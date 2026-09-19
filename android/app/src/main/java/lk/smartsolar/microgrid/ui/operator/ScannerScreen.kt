package lk.smartsolar.microgrid.ui.operator

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.ReservationRepository
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.data.tx
import lk.smartsolar.microgrid.ui.common.ConfirmDialog
import lk.smartsolar.microgrid.ui.common.DetailRow
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.StatusChip
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt

sealed interface ScanPhase {
    data object Idle : ScanPhase
    data object Processing : ScanPhase
    data class Valid(val reservation: ReservationEntity) : ScanPhase
    data class Invalid(val message: String) : ScanPhase
    data class Completed(val reservation: ReservationEntity) : ScanPhase
}

class ScannerViewModel(private val repo: ReservationRepository) : ViewModel() {
    private val _phase = MutableStateFlow<ScanPhase>(ScanPhase.Idle)
    val phase: StateFlow<ScanPhase> = _phase
    private val _transfer = MutableStateFlow(TransferUi())
    val transfer: StateFlow<TransferUi> = _transfer

    data class TransferUi(val busy: Boolean = false, val error: String? = null)

    fun verify(token: String) {
        val qr = token.trim()
        if (qr.isEmpty() || _phase.value == ScanPhase.Processing) return
        _phase.value = ScanPhase.Processing
        viewModelScope.launch {
            _phase.value = try {
                ScanPhase.Valid(repo.verifyQr(qr))
            } catch (e: AppException) {
                ScanPhase.Invalid(e.message ?: "QR verification failed.")
            }
        }
    }

    fun transfer() {
        val current = _phase.value as? ScanPhase.Valid ?: return
        if (_transfer.value.busy) return
        _transfer.value = TransferUi(busy = true)
        viewModelScope.launch {
            try {
                _phase.value = ScanPhase.Completed(repo.complete(current.reservation.id))
                _transfer.value = TransferUi()
            } catch (e: AppException) {
                _transfer.value = TransferUi(error = e.message)
            }
        }
    }

    fun clearTransferError() = _transfer.update { it.copy(error = null) }

    fun reset() {
        _phase.value = ScanPhase.Idle
        _transfer.value = TransferUi()
    }
}

@Composable
fun ScannerScreen(onOpenReceipt: (String) -> Unit) {
    val vm = containerViewModel { ScannerViewModel(it.reservations) }
    val names = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }.stationNames.collectAsState().value
    val phase by vm.phase.collectAsState()
    val transfer by vm.transfer.collectAsState()
    var token by rememberSaveable { mutableStateOf("") }
    var confirming by rememberSaveable { mutableStateOf(false) }

    Column {
        SunChainTopBar("QR scanner")
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (val p = phase) {
                is ScanPhase.Idle -> {
                    CameraSection(onCode = { token = it; vm.verify(it) })
                    SectionCard {
                        Text("Or enter the token manually", fontWeight = FontWeight.SemiBold)
                        OutlinedTextField(
                            token, { token = it }, singleLine = false, minLines = 2, placeholder = { Text("Paste the QR token") },
                            textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                            modifier = Modifier.fillMaxWidth().testTag("token_input"),
                        )
                        Button(onClick = { vm.verify(token) }, enabled = token.isNotBlank(), modifier = Modifier.fillMaxWidth().testTag("verify_token")) { Text("Verify token") }
                    }
                }
                is ScanPhase.Processing -> SectionCard {
                    Text("Verifying QR code...", modifier = Modifier.testTag("phase_processing"))
                }
                is ScanPhase.Invalid -> {
                    SectionCard {
                        Text("✗ Invalid QR code", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, modifier = Modifier.testTag("phase_invalid"))
                        Text(p.message)
                    }
                    Button(onClick = { token = ""; vm.reset() }, modifier = Modifier.fillMaxWidth().testTag("scan_again")) { Text("Scan again") }
                }
                is ScanPhase.Valid, is ScanPhase.Completed -> {
                    val r = (p as? ScanPhase.Valid)?.reservation ?: (p as ScanPhase.Completed).reservation
                    val done = p is ScanPhase.Completed
                    SectionCard {
                        Text(
                            if (done) "✓ Energy transfer completed" else "✓ Valid QR code — reservation verified",
                            color = if (done) lk.smartsolar.microgrid.ui.theme.Green else MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.testTag(if (done) "phase_completed" else "phase_valid"),
                        )
                        DetailRow("Reservation", r.number)
                        DetailRow("Prosumer NIC", r.prosumerNic)
                        DetailRow("Station", names[r.stationId] ?: "Station")
                        DetailRow("Date", Fmt.date(r.date))
                        DetailRow("Time", Fmt.range(r.startTime, r.endTime))
                        DetailRow("Status", r.statusEnum.name)
                        DetailRow("Transaction", r.tx.name)
                    }
                    if (done) {
                        Button(onClick = { onOpenReceipt(r.id) }, modifier = Modifier.fillMaxWidth().testTag("view_receipt")) { Text("View receipt") }
                        OutlinedButton(onClick = { token = ""; vm.reset() }, modifier = Modifier.fillMaxWidth()) { Text("Scan another") }
                    } else {
                        Button(onClick = { confirming = true }, modifier = Modifier.fillMaxWidth().testTag("proceed_transfer")) { Text("Proceed to transfer") }
                        OutlinedButton(onClick = { token = ""; vm.reset() }, modifier = Modifier.fillMaxWidth()) { Text("Rescan") }
                    }
                }
            }
        }
    }

    if (confirming && phase is ScanPhase.Valid) {
        val r = (phase as ScanPhase.Valid).reservation
        ConfirmDialog(
            title = "Confirm energy transfer",
            message = (transfer.error?.let { "$it\n\n" } ?: "") +
                "Complete the transfer for ${r.number} (${r.prosumerNic}) at ${names[r.stationId] ?: "the station"}? This closes the reservation and cannot be undone.",
            confirmLabel = "Confirm transfer",
            busy = transfer.busy,
            onDismiss = { confirming = false; vm.clearTransferError() },
            onConfirm = { vm.transfer() },
        )
    }
    if (phase is ScanPhase.Completed && confirming) confirming = false
}

@Composable
private fun CameraSection(onCode: (String) -> Unit) {
    val context = LocalContext.current
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }

    SectionCard {
        Text("Scan with camera", fontWeight = FontWeight.SemiBold)
        if (granted) {
            CameraPreview(onCode, Modifier.fillMaxWidth().height(280.dp).clip(RoundedCornerShape(12.dp)).testTag("camera_preview"))
        } else {
            Text("Camera permission is needed to scan QR codes. You can also paste the token below.", style = MaterialTheme.typography.bodySmall)
            Button(onClick = { launcher.launch(Manifest.permission.CAMERA) }, modifier = Modifier.testTag("grant_camera")) { Text("Allow camera") }
        }
    }
}

@Composable
private fun CameraPreview(onCode: (String) -> Unit, modifier: Modifier) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val previewView = remember { PreviewView(context) }
    var failed by remember { mutableStateOf(false) }

    DisposableEffect(lifecycleOwner) {
        val executor = Executors.newSingleThreadExecutor()
        val scanner = BarcodeScanning.getClient(BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build())
        val future = ProcessCameraProvider.getInstance(context)
        var provider: ProcessCameraProvider? = null
        var handled = false

        future.addListener({
            try {
                provider = future.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                val analysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                analysis.setAnalyzer(executor) { proxy ->
                    val media = proxy.image
                    if (media == null || handled) {
                        proxy.close()
                    } else {
                        scanner.process(InputImage.fromMediaImage(media, proxy.imageInfo.rotationDegrees))
                            .addOnSuccessListener { codes ->
                                val value = codes.firstNotNullOfOrNull { it.rawValue }
                                if (value != null && !handled) {
                                    handled = true
                                    onCode(value)
                                }
                            }
                            .addOnCompleteListener { proxy.close() }
                    }
                }
                provider?.unbindAll()
                provider?.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
            } catch (e: Exception) {
                failed = true
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            runCatching { provider?.unbindAll() }
            scanner.close()
            executor.shutdown()
        }
    }

    if (failed) {
        Text("The camera is not available on this device. Paste the token below instead.", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 8.dp))
    } else {
        AndroidView({ previewView }, modifier)
    }
}
