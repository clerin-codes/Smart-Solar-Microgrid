package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import lk.smartsolar.microgrid.ui.theme.BorderSoft
import lk.smartsolar.microgrid.ui.theme.Shapes
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.ui.graphics.Color
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.GlassChip
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import java.time.LocalDate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.isBookable
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.SlotEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.ReservationRepository
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.ui.common.ConfirmDialog
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LoadingBox
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt
import lk.smartsolar.microgrid.util.TimeRules

data class BookingUi(
    val stationId: String? = null,
    val date: String? = null,
    val slotId: String? = null,
    val busy: Boolean = false,
    val error: String? = null,
    /** id of the reservation once it was saved */
    val savedId: String? = null,
)

/** Creates a reservation, or with [reservationId] moves an existing pending one to another slot. */
class BookingViewModel(
    val reservationId: String?,
    presetStationId: String?,
    presetSlotId: String?,
    private val reservations: ReservationRepository,
    private val stationRepo: StationRepository,
) : ViewModel() {
    val stations: StateFlow<List<StationEntity>> = stationRepo.stations.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val slots: StateFlow<List<SlotEntity>> = stationRepo.slots.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val existing: StateFlow<ReservationEntity?> =
        (if (reservationId != null) reservations.reservation(reservationId) else kotlinx.coroutines.flow.flowOf(null))
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val _ui = MutableStateFlow(BookingUi(stationId = presetStationId, slotId = presetSlotId))
    val ui: StateFlow<BookingUi> = _ui
    private var prefilled = false

    init {
        viewModelScope.launch { runCatching { stationRepo.refresh() } }
    }

    /** In edit mode, start from the reservation's current station, day and slot. */
    fun prefillFrom(r: ReservationEntity) {
        if (prefilled) return
        prefilled = true
        _ui.update { it.copy(stationId = r.stationId, date = r.date, slotId = r.slotId) }
    }

    /** A slot chosen on the station page fixes the day too, without clearing the slot. */
    fun showDayOf(slot: SlotEntity) = _ui.update { if (it.date == null) it.copy(date = slot.date) else it }

    fun selectStation(id: String) = _ui.update { it.copy(stationId = id, date = null, slotId = null, error = null) }
    fun selectDate(date: String) = _ui.update { it.copy(date = date, slotId = null, error = null) }
    fun selectSlot(id: String) = _ui.update { it.copy(slotId = id, error = null) }

    fun submit(slot: SlotEntity) {
        val stationId = _ui.value.stationId ?: return
        if (_ui.value.busy) return
        _ui.update { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            try {
                val saved = if (reservationId == null) reservations.create(stationId, slot) else reservations.update(reservationId, slot)
                _ui.update { it.copy(busy = false, savedId = saved.id) }
            } catch (e: AppException) {
                _ui.update { it.copy(busy = false, error = e.message) }
            }
        }
    }
}

@Composable
fun BookingScreen(
    reservationId: String?,
    presetStationId: String?,
    presetSlotId: String?,
    onBack: () -> Unit,
    onSaved: (String) -> Unit,
) {
    val editing = reservationId != null
    val vm = containerViewModel(key = "booking-${reservationId ?: "new"}-${presetStationId}-${presetSlotId}") {
        BookingViewModel(reservationId, presetStationId, presetSlotId, it.reservations, it.stations)
    }
    val stations by vm.stations.collectAsState()
    val slots by vm.slots.collectAsState()
    val existing by vm.existing.collectAsState()
    val ui by vm.ui.collectAsState()
    var confirming by remember { mutableStateOf(false) }

    LaunchedEffect(existing) { existing?.let(vm::prefillFrom) }
    LaunchedEffect(slots, ui.slotId, ui.date) {
        if (ui.date == null && ui.slotId != null) slots.firstOrNull { it.id == ui.slotId }?.let(vm::showDayOf)
    }
    LaunchedEffect(ui.savedId) { ui.savedId?.let(onSaved) }

    Column {
        SunChainTopBar(if (editing) "Edit reservation" else "Book energy", onBack)
        if (editing && existing == null) {
            LoadingBox()
            return@Column
        }

        val days = remember { TimeRules.bookingWindow().map(LocalDate::toString) }
        val currentSlotId = existing?.slotId
        val stationSlots = slots.filter { it.stationId == ui.stationId }
        val isFree = { s: SlotEntity -> !TimeRules.hasStarted(s) && (s.isBookable || s.id == currentSlotId) }
        val firstFreeDay = days.firstOrNull { d -> stationSlots.any { it.date == d && isFree(it) } }
        val date = ui.date ?: firstFreeDay ?: days.first()
        val daySlots = stationSlots.filter { it.date == date }.sortedBy { it.startTime }
        val selected = daySlots.firstOrNull { it.id == ui.slotId }

        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg), verticalArrangement = Arrangement.spacedBy(Spacing.lg)) {
            ErrorBanner(ui.error)

            Text("Station", fontWeight = FontWeight.SemiBold)
            if (editing) {
                Text(stations.firstOrNull { it.id == ui.stationId }?.name ?: "-")
            } else {
                var open by remember { mutableStateOf(false) }
                val active = stations.filter { it.isActive }
                Column {
                    SunChainButton(
                        active.firstOrNull { it.id == ui.stationId }?.name ?: "Select a station",
                        onClick = { open = true },
                        modifier = Modifier.fillMaxWidth().testTag("station_picker"),
                        kind = ButtonKind.Secondary,
                    )
                    DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                        active.forEach { s ->
                            DropdownMenuItem(text = { Text("${s.name} (${s.code})") }, onClick = { vm.selectStation(s.id); open = false }, modifier = Modifier.testTag("pick_${s.code}"))
                        }
                    }
                }
            }

            if (ui.stationId == null) {
                EmptyState("Select a station to see its available slots")
                return@Column
            }

            Text("Date (next 7 days)", fontWeight = FontWeight.SemiBold)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(days) { d ->
                    val count = stationSlots.count { it.date == d && isFree(it) }
                    GlassChip(
                        label = Fmt.dateShort(LocalDate.parse(d)),
                        sublabel = "$count free",
                        selected = d == date,
                        onClick = { vm.selectDate(d) },
                        modifier = Modifier.testTag("day_$d"),
                    )
                }
            }

            if (ui.busy) {
                // The request is in flight: show progress instead of a list that can no longer be changed.
                GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                        CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.5.dp, color = SunChainBlue)
                        Text(if (editing) "Saving your changes..." else "Placing your reservation...", style = MaterialTheme.typography.titleSmall)
                    }
                }
            } else {
                Text("Slot", fontWeight = FontWeight.SemiBold)
                if (daySlots.isEmpty()) EmptyState("No slots on this day", "Pick another date.")
                daySlots.forEach { s ->
                    SlotOption(
                        id = s.id,
                        title = Fmt.range(s.startTime, s.endTime) + if (s.id == currentSlotId) "  (current)" else "",
                        detail = if (isFree(s)) "${Fmt.kw(s.availableKw)} available of ${Fmt.kw(s.capacityKw)}" else "Not available",
                        enabled = isFree(s),
                        selected = s.id == ui.slotId,
                        onSelect = vm::selectSlot,
                    )
                }
            }

            SunChainButton(
                if (editing) "Review changes" else "Review reservation",
                onClick = { confirming = true },
                modifier = Modifier.fillMaxWidth().testTag("review"),
                enabled = selected != null && !ui.busy && selected.id != currentSlotId,
                loading = ui.busy,
            )
        }

        if (confirming && selected != null) {
            val stationName = stations.firstOrNull { it.id == ui.stationId }?.name ?: "Station"
            ConfirmDialog(
                title = if (editing) "Save changes?" else "Confirm reservation",
                message = "$stationName\n${Fmt.date(selected.date)}\n${Fmt.range(selected.startTime, selected.endTime)}\n\nA Grid Operator will approve it, then your QR code appears.",
                confirmLabel = if (editing) "Save" else "Reserve",
                busy = ui.busy,
                onDismiss = { confirming = false },
                onConfirm = { vm.submit(selected); confirming = false },
            )
        }
    }
}

/**
 * One selectable time slot. It takes only plain values, so Compose can skip it when nothing about
 * this row changed; the day can hold dozens of slots and the screen updates on every tap.
 */
@Composable
private fun SlotOption(
    id: String,
    title: String,
    detail: String,
    enabled: Boolean,
    selected: Boolean,
    onSelect: (String) -> Unit,
) {
    val shape = Shapes.large
    Row(
        Modifier
            .testTag("slot_$id")
            .fillMaxWidth()
            .clip(shape)
            .background(if (selected) Color(0xFFE3ECFF) else Color.White.copy(alpha = if (enabled) 0.9f else 0.5f))
            .border(1.dp, if (selected) SunChainBlue.copy(alpha = 0.5f) else BorderSoft, shape)
            .clickable(enabled = enabled, role = Role.RadioButton) { onSelect(id) }
            .padding(Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        Icon(
            if (selected) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
            contentDescription = if (selected) "Selected" else null,
            tint = if (selected) SunChainBlue else TextSecondary,
        )
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(detail, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
        }
    }
}
