package lk.smartsolar.microgrid.ui.common

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Icon
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.theme.Spacing
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.TxStatus
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.ReservationRepository
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.data.tx
import lk.smartsolar.microgrid.ui.theme.Green
import lk.smartsolar.microgrid.util.Files
import lk.smartsolar.microgrid.util.Fmt
import lk.smartsolar.microgrid.util.QrCodes
import lk.smartsolar.microgrid.util.ReceiptPdf
import lk.smartsolar.microgrid.util.TimeRules

data class DetailUi(val busy: Boolean = false, val error: String? = null, val loaded: Boolean = false)

@OptIn(ExperimentalCoroutinesApi::class)
class ReservationDetailViewModel(
    private val id: String,
    private val repo: ReservationRepository,
    stations: StationRepository,
) : ViewModel() {
    val reservation: StateFlow<ReservationEntity?> =
        repo.reservation(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val station: StateFlow<StationEntity?> =
        repo.reservation(id)
            .flatMapLatest { r -> if (r == null) flowOf(null) else stations.station(r.stationId) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val capacityKw: StateFlow<Double?> =
        repo.reservation(id)
            .flatMapLatest { r -> if (r == null) flowOf(null) else stations.slotsFor(r.stationId).map { s -> s.firstOrNull { it.id == r.slotId }?.capacityKw } }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _ui = MutableStateFlow(DetailUi())
    val ui: StateFlow<DetailUi> = _ui
    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val events: SharedFlow<String> = _events

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repo.refreshOne(id)
                _ui.update { it.copy(error = null, loaded = true) }
            } catch (e: AppException) {
                _ui.update { it.copy(error = e.message, loaded = true) }
            }
        }
    }

    fun postMessage(message: String) {
        _events.tryEmit(message)
    }

    fun cancel() = act("Reservation cancelled") { repo.cancel(id) }
    fun approve() = act("Reservation approved. QR code generated.") { repo.approve(id) }
    fun reject() = act("Reservation rejected.") { repo.reject(id) }
    fun complete() = act("Energy transfer completed") { repo.complete(id) }

    private fun act(success: String, block: suspend () -> Unit) {
        if (_ui.value.busy) return
        _ui.update { it.copy(busy = true) }
        viewModelScope.launch {
            try {
                block()
                _events.emit(success)
            } catch (e: AppException) {
                _events.emit(e.message ?: "Something went wrong.")
            } finally {
                _ui.update { it.copy(busy = false) }
            }
        }
    }
}

private enum class PendingAction { Cancel, Approve, Reject, Complete }

@Composable
fun ReservationDetailScreen(id: String, onBack: () -> Unit, onEdit: (String) -> Unit) {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val vm = containerViewModel(key = "detail-$id") { ReservationDetailViewModel(id, it.reservations, it.stations) }
    val r by vm.reservation.collectAsState()
    val station by vm.station.collectAsState()
    val capacity by vm.capacityKw.collectAsState()
    val ui by vm.ui.collectAsState()
    val snackbar = LocalSnackbar.current
    val context = LocalContext.current
    var confirm by remember { mutableStateOf<PendingAction?>(null) }

    LaunchedEffect(Unit) { vm.events.collect { snackbar.showSnackbar(it) } }

    Column {
        SunChainTopBar("Reservation", onBack)
        val current = r
        when {
            current == null && !ui.loaded -> LoadingBox()
            current == null -> Column { ErrorBanner(ui.error ?: "Reservation not found.", vm::refresh) }
            else -> {
                val isProsumer = session?.isProsumer == true
                val isOperator = session?.isGridOperator == true
                val status = current.statusEnum
                val tx = current.tx
                val stationName = station?.name ?: "Station"
                val locked = TimeRules.isLocked(current)

                Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    ErrorBanner(ui.error, vm::refresh)

                    SectionCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(current.number, Modifier.weight(1f).testTag("reservation_number"), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                            StatusChip(status.name)
                        }
                        DetailRow("Station", stationName)
                        DetailRow("Date", Fmt.date(current.date))
                        DetailRow("Time", Fmt.range(current.startTime, current.endTime))
                        DetailRow("Slot capacity", capacity?.let(Fmt::kw) ?: "-")
                        if (!isProsumer) DetailRow("Prosumer NIC", current.prosumerNic)
                        DetailRow("Transaction", tx.name)
                        current.approvedBy?.let { DetailRow("Approved by", it) }
                        current.completedBy?.let { DetailRow("Completed by", it) }
                        current.completedAt?.let { DetailRow("Completed at", Fmt.dateTime(it)) }
                    }

                    if (isProsumer) VerificationTracking(status, tx)

                    val token = current.qrToken
                    if (isProsumer && status == ReservationStatus.Approved && token != null) {
                        QrCard(current.number, token, message = vm::postMessage)
                    }

                    if (isProsumer && (status == ReservationStatus.Pending || status == ReservationStatus.Approved)) {
                        Text(
                            if (locked) "This reservation starts in less than ${TimeRules.LOCK_HOURS} hours, so it can no longer be edited or cancelled."
                            else "You can edit or cancel this reservation until ${TimeRules.LOCK_HOURS} hours before it starts.",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (locked) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }

                    Actions(
                        canEdit = isProsumer && TimeRules.canEdit(current),
                        canCancel = isProsumer && TimeRules.canCancel(current),
                        canApprove = isOperator && status == ReservationStatus.Pending,
                        canReject = isOperator && status == ReservationStatus.Pending,
                        canComplete = isOperator && tx == TxStatus.Verified && status != ReservationStatus.Completed,
                        busy = ui.busy,
                        onEdit = { onEdit(id) },
                        onCancel = { confirm = PendingAction.Cancel },
                        onApprove = { confirm = PendingAction.Approve },
                        onReject = { confirm = PendingAction.Reject },
                        onComplete = { confirm = PendingAction.Complete },
                    )

                    ReceiptButtons(
                        current, stationName, capacity, status.name, tx.name,
                        title = if (status == ReservationStatus.Completed) "Energy Transfer Receipt" else "Reservation",
                        context = context,
                        message = vm::postMessage,
                    )

                    SectionCard {
                        Text("Progress", fontWeight = FontWeight.SemiBold)
                        Timeline(current)
                    }
                }
            }
        }
    }

    confirm?.let { action ->
        val (title, message, label) = when (action) {
            PendingAction.Cancel -> Triple("Cancel this reservation?", "This cannot be undone.", "Cancel reservation")
            PendingAction.Approve -> Triple("Approve this reservation?", "A QR code will be generated for the prosumer.", "Approve")
            PendingAction.Reject -> Triple("Reject this reservation?", "This cannot be undone.", "Reject")
            PendingAction.Complete -> Triple("Complete the energy transfer?", "This closes the reservation and cannot be undone.", "Complete transfer")
        }
        ConfirmDialog(
            title, message, label, busy = ui.busy, destructive = action == PendingAction.Cancel || action == PendingAction.Reject,
            onDismiss = { confirm = null },
            onConfirm = {
                when (action) {
                    PendingAction.Cancel -> vm.cancel()
                    PendingAction.Approve -> vm.approve()
                    PendingAction.Reject -> vm.reject()
                    PendingAction.Complete -> vm.complete()
                }
                confirm = null
            },
        )
    }
}

@Composable
private fun VerificationTracking(status: ReservationStatus, tx: TxStatus) {
    val (text, color) = when {
        status == ReservationStatus.Pending -> "Waiting for a Grid Operator to approve your reservation." to MaterialTheme.colorScheme.onSurfaceVariant
        status == ReservationStatus.Rejected -> "This reservation was not approved." to MaterialTheme.colorScheme.error
        status == ReservationStatus.Cancelled -> "This reservation was cancelled." to MaterialTheme.colorScheme.onSurfaceVariant
        status == ReservationStatus.Completed -> "Energy transfer complete." to Green
        tx == TxStatus.Verified -> "QR code verified. The energy transfer is being completed." to MaterialTheme.colorScheme.secondary
        else -> "Approved. Show your QR code to the Grid Operator." to MaterialTheme.colorScheme.secondary
    }
    SectionCard { Text(text, color = color, fontWeight = FontWeight.Medium, modifier = Modifier.testTag("tracking")) }
}

@Composable
private fun QrCard(number: String, token: String, message: (String) -> Unit) {
    val context = LocalContext.current
    val bitmap = remember(token) { QrCodes.encode(token) }
    SectionCard {
        Text("Your QR code", fontWeight = FontWeight.SemiBold)
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "QR code for $number",
            modifier = Modifier.align(Alignment.CenterHorizontally).size(240.dp).background(Color.White, RoundedCornerShape(16.dp)).padding(12.dp).testTag("qr_image"),
        )
        Text("Show this to the Grid Operator at the station.", style = MaterialTheme.typography.bodySmall, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        Text(token, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth().testTag("qr_token"), textAlign = TextAlign.Center)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SunChainButton(
                "Save image",
                onClick = { message(if (Files.saveImageToGallery(context, bitmap, "sunchain-$number")) "QR image saved to Pictures/SunChain" else "Could not save the image") },
                modifier = Modifier.weight(1f).testTag("save_qr"), kind = ButtonKind.Secondary,
            )
            SunChainButton("Share", { Files.shareImage(context, bitmap, "sunchain-$number", "SunChain reservation $number") }, Modifier.weight(1f).testTag("share_qr"))
        }
    }
}

@Composable
private fun Actions(
    canEdit: Boolean,
    canCancel: Boolean,
    canApprove: Boolean,
    canReject: Boolean,
    canComplete: Boolean,
    busy: Boolean,
    onEdit: () -> Unit,
    onCancel: () -> Unit,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onComplete: () -> Unit,
) {
    if (!(canEdit || canCancel || canApprove || canReject || canComplete)) return
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        if (canEdit) SunChainButton("Edit", onEdit, Modifier.weight(1f).testTag("edit"), kind = ButtonKind.Secondary, enabled = !busy)
        if (canCancel) SunChainButton("Cancel", onCancel, Modifier.weight(1f).testTag("cancel"), kind = ButtonKind.Danger, enabled = !busy)
        if (canApprove) SunChainButton("Approve", onApprove, Modifier.weight(1f).testTag("approve"), kind = ButtonKind.Success, enabled = !busy)
        if (canReject) SunChainButton("Reject", onReject, Modifier.weight(1f).testTag("reject"), kind = ButtonKind.Danger, enabled = !busy)
        if (canComplete) SunChainButton("Complete transfer", onComplete, Modifier.weight(1f).testTag("complete"), kind = ButtonKind.Success, enabled = !busy)
    }
}

@Composable
private fun ReceiptButtons(
    r: ReservationEntity,
    stationName: String,
    capacity: Double?,
    status: String,
    tx: String,
    title: String,
    context: android.content.Context,
    message: (String) -> Unit,
) {
    fun build() = ReceiptPdf.create(context, title, r.number, ReceiptPdf.fields(r, stationName, capacity, status, tx))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        SunChainButton(
            "Save PDF",
            onClick = { message(if (Files.savePdfToDownloads(context, build())) "PDF saved to Downloads/SunChain" else "Could not save the PDF") },
            modifier = Modifier.weight(1f).testTag("save_pdf"), kind = ButtonKind.Secondary,
        )
        SunChainButton("Share PDF", { Files.sharePdf(context, build()) }, Modifier.weight(1f).testTag("share_pdf"), kind = ButtonKind.Secondary)
    }
}

@Composable
private fun Timeline(r: ReservationEntity) {
    val status = r.statusEnum
    val tx = r.tx
    val ended = status == ReservationStatus.Cancelled || status == ReservationStatus.Rejected
    val steps = listOf(
        "Requested" to true,
        "Approved" to (status == ReservationStatus.Approved || status == ReservationStatus.Completed || tx != TxStatus.NotStarted),
        "QR verified" to (tx == TxStatus.Verified || tx == TxStatus.Completed),
        "Energy transferred" to (status == ReservationStatus.Completed),
    )
    val all = steps.map { Triple(it.first, it.second, false) } + if (ended) listOf(Triple(status.name, true, true)) else emptyList()
    Column {
        all.forEachIndexed { i, (label, done, failed) ->
            val color = when {
                failed -> MaterialTheme.colorScheme.error
                done -> Green
                else -> Color(0xFFCBD5E1)
            }
            Row(Modifier.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(22.dp).background(color, CircleShape), contentAlignment = Alignment.Center) {
                        if (done) Icon(if (failed) Icons.Rounded.Close else Icons.Rounded.Check, contentDescription = null, Modifier.size(14.dp), tint = Color.White)
                    }
                    if (i < all.lastIndex) Box(Modifier.width(2.dp).weight(1f).background(color.copy(alpha = 0.45f)))
                }
                Text(
                    label,
                    Modifier.padding(bottom = if (i < all.lastIndex) Spacing.lg else 0.dp),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = if (done) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (failed) MaterialTheme.colorScheme.error else if (done) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
