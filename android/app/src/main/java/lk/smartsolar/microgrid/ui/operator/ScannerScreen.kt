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
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.QrCodeScanner
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
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
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.IconBadge
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.design.SunChainTextField
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.ErrorRed
import lk.smartsolar.microgrid.ui.theme.Info
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScannerScreen(onOpenReceipt: (String) -> Unit) {
    val vm = containerViewModel { ScannerViewModel(it.reservations) }
    val names = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }.stationNames.collectAsState().value
    val phase by vm.phase.collectAsState()
    val transfer by vm.transfer.collectAsState()
    var token by rememberSaveable { mutableStateOf("") }
    var confirming by rememberSaveable { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Scan QR", subtitle = "Scan the reservation QR code to verify the energy transfer.")
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg),
            verticalArrangement = Arrangement.spacedBy(Spacing.lg),
        ) {
            ScannerFrame(active = phase is ScanPhase.Idle, onCode = { token = it; vm.verify(it) })

            when (val p = phase) {
                is ScanPhase.Idle -> ManualEntry(token, { token = it }, onVerify = { vm.verify(token) })
                is ScanPhase.Processing -> GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                        CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.5.dp, color = SunChainBlue)
                        Text("Verifying QR code...", Modifier.testTag("phase_processing"), style = MaterialTheme.typography.titleSmall)
                    }
                }
                is ScanPhase.Invalid -> {
                    GlassCard(tint = Color(0xFFFFF1F1), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                            Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = ErrorRed)
                            Text("Invalid QR code", Modifier.testTag("phase_invalid"), color = ErrorRed, style = MaterialTheme.typography.titleMedium)
                        }
                        Text(p.message, style = MaterialTheme.typography.bodyMedium)
                    }
                    SunChainButton("Scan again", { token = ""; vm.reset() }, Modifier.fillMaxWidth().testTag("scan_again"))
                }
                is ScanPhase.Valid, is ScanPhase.Completed -> Unit // shown in the result sheet below
            }
        }
    }

    val result = (phase as? ScanPhase.Valid)?.reservation ?: (phase as? ScanPhase.Completed)?.reservation
    if (result != null) {
        val done = phase is ScanPhase.Completed
        ModalBottomSheet(
            onDismissRequest = { token = ""; vm.reset() },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = Color.White,
            shape = Shapes.hero,
        ) {
            ResultSheet(
                r = result, done = done, station = names[result.stationId] ?: "Station",
                onProceed = { confirming = true },
                onReceipt = { onOpenReceipt(result.id) },
                onAgain = { token = ""; vm.reset() },
            )
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
private fun ManualEntry(token: String, onChange: (String) -> Unit, onVerify: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
        Text("Or enter token manually", style = MaterialTheme.typography.titleSmall)
        GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
            SunChainTextField(
                token, onChange, "QR token", Modifier.testTag("token_input"),
                singleLine = false, minLines = 2, placeholder = "Paste the QR token",
                textStyle = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
            )
            SunChainButton("Verify token", onVerify, Modifier.fillMaxWidth().testTag("verify_token"), enabled = token.isNotBlank(), icon = Icons.Rounded.Verified)
        }
    }
}

/** Verification outcome, presented as a bottom sheet with the reservation's details and next action. */
@Composable
private fun ResultSheet(
    r: ReservationEntity,
    done: Boolean,
    station: String,
    onProceed: () -> Unit,
    onReceipt: () -> Unit,
    onAgain: () -> Unit,
) {
    val pop = remember { Animatable(0.6f) }
    LaunchedEffect(done) {
        pop.snapTo(0.6f)
        pop.animateTo(1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium))
    }
    val accent = if (done) EnergyGreen else Info
    Column(
        Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = Spacing.xxl).padding(bottom = Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        IconBadge(Icons.Rounded.CheckCircle, accent, Modifier.graphicsLayer { scaleX = pop.value; scaleY = pop.value }, size = 72.dp)
        Text(
            if (done) "Energy transfer completed" else "Valid QR code — reservation verified",
            style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center, color = accent,
            modifier = Modifier.testTag(if (done) "phase_completed" else "phase_valid"),
        )
        GlassCard(elevation = 0.dp, verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
            DetailRow("Reservation", r.number)
            DetailRow("Prosumer NIC", r.prosumerNic)
            DetailRow("Station", station)
            DetailRow("Date", Fmt.date(r.date))
            DetailRow("Time", Fmt.range(r.startTime, r.endTime))
            DetailRow("Status", r.statusEnum.name)
            DetailRow("Transaction", r.tx.name)
        }
        if (done) {
            SunChainButton("View receipt", onReceipt, Modifier.fillMaxWidth().testTag("view_receipt"), kind = ButtonKind.Success)
            SunChainButton("Scan another", onAgain, Modifier.fillMaxWidth(), kind = ButtonKind.Secondary)
        } else {
            SunChainButton("Proceed to transfer", onProceed, Modifier.fillMaxWidth().testTag("proceed_transfer"), kind = ButtonKind.Success)
            SunChainButton("Rescan", onAgain, Modifier.fillMaxWidth(), kind = ButtonKind.Secondary)
        }
    }
}

/**
 * The viewfinder: a rounded glass frame with corner brackets and a sweeping scan line. It holds the
 * live camera while idle and a paused state otherwise.
 */
@Composable
private fun ScannerFrame(active: Boolean, onCode: (String) -> Unit) {
    val context = LocalContext.current
    var granted by remember { mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted = it }
    val sweep = rememberInfiniteTransition(label = "scan")
    val line by sweep.animateFloat(0.06f, 0.94f, infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Reverse), label = "scanLine")
    val bracket = Color.White
    val shape = Shapes.hero

    Box(
        Modifier
            .fillMaxWidth()
            .height(320.dp)
            .clip(shape)
            .background(Brush.verticalGradient(listOf(Color(0xFF0B1220), Color(0xFF16233F))))
            .border(1.5.dp, Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.85f), SunChainBlue.copy(alpha = 0.35f))), shape),
        contentAlignment = Alignment.Center,
    ) {
        when {
            active && granted -> CameraPreview(onCode, Modifier.fillMaxSize().testTag("camera_preview"))
            active -> Column(Modifier.padding(Spacing.xl), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                Icon(Icons.Rounded.QrCodeScanner, contentDescription = null, Modifier.size(56.dp), tint = Color.White.copy(alpha = 0.9f))
                Text("Camera permission is needed to scan QR codes. You can also paste the token below.", color = Color.White.copy(alpha = 0.85f), style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                SunChainButton("Allow camera", { launcher.launch(Manifest.permission.CAMERA) }, Modifier.testTag("grant_camera"), compact = true)
            }
            else -> Icon(Icons.Rounded.QrCodeScanner, contentDescription = null, Modifier.size(72.dp), tint = Color.White.copy(alpha = 0.35f))
        }

        // Corner brackets and the sweeping line sit on top of whatever the frame shows.
        Box(
            Modifier.fillMaxSize().padding(28.dp).drawWithContent {
                drawContent()
                val len = 34.dp.toPx()
                val stroke = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
                val w = size.width
                val h = size.height
                fun corner(x: Float, y: Float, dx: Float, dy: Float) {
                    drawLine(bracket, Offset(x, y), Offset(x + dx * len, y), stroke.width, StrokeCap.Round)
                    drawLine(bracket, Offset(x, y), Offset(x, y + dy * len), stroke.width, StrokeCap.Round)
                }
                corner(0f, 0f, 1f, 1f); corner(w, 0f, -1f, 1f); corner(0f, h, 1f, -1f); corner(w, h, -1f, -1f)
                if (active && granted) {
                    val y = h * line
                    drawRoundRect(
                        Brush.horizontalGradient(listOf(Color.Transparent, EnergyGreen, Color.Transparent)),
                        topLeft = Offset(0f, y - 2.dp.toPx()), size = androidx.compose.ui.geometry.Size(w, 4.dp.toPx()),
                        cornerRadius = CornerRadius(2.dp.toPx()),
                    )
                }
            },
        ) {}
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
        Box(modifier, contentAlignment = Alignment.Center) {
            Text(
                "The camera is not available on this device. Paste the token below instead.",
                style = MaterialTheme.typography.bodyMedium, color = Color.White.copy(alpha = 0.85f), textAlign = TextAlign.Center,
                modifier = Modifier.padding(Spacing.xl),
            )
        }
    } else {
        AndroidView({ previewView }, modifier)
    }
}
