package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import java.time.LocalDate
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import lk.smartsolar.microgrid.data.decodeSchedule
import lk.smartsolar.microgrid.data.isBookable
import lk.smartsolar.microgrid.data.local.SlotEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.ui.common.DetailRow
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.LoadingBox
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.SectionTitle
import lk.smartsolar.microgrid.ui.common.StatusChip
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt
import lk.smartsolar.microgrid.util.TimeRules

class StationDetailViewModel(id: String, repo: StationRepository) : ViewModel() {
    val station: StateFlow<StationEntity?> = repo.station(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)
    val slots: StateFlow<List<SlotEntity>> = repo.slotsFor(id).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
}

@Composable
fun StationDetailScreen(id: String, onBack: () -> Unit, onReserve: (stationId: String, slotId: String) -> Unit) {
    val vm = containerViewModel(key = "station-$id") { StationDetailViewModel(id, it.stations) }
    val station by vm.station.collectAsState()
    val slots by vm.slots.collectAsState()
    val context = LocalContext.current

    Column {
        SunChainTopBar(station?.name ?: "Station", onBack)
        val s = station
        if (s == null) {
            LoadingBox()
            return@Column
        }
        // Only the next week is bookable, so that is all we list.
        val window = TimeRules.bookingWindow().map(LocalDate::toString).toSet()
        val upcoming = slots.filter { it.date in window }.groupBy { it.date }.toSortedMap()

        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(s.code, Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    StatusChip(if (s.isActive) "Active" else "Inactive")
                }
                DetailRow("Capacity", Fmt.kw(s.capacityKw))
                DetailRow("Battery slots", "${s.availableSlots} / ${s.batterySlots} free")
                DetailRow("Location", "%.4f, %.4f".format(s.latitude, s.longitude))
                OutlinedButton(onClick = { openInMaps(context, s) }, modifier = Modifier.fillMaxWidth().testTag("open_maps")) { Text("Open in Maps") }
            }

            val hours = decodeSchedule(s.schedule)
            if (hours.isNotEmpty()) {
                SectionCard {
                    Text("Opening hours", fontWeight = FontWeight.SemiBold)
                    hours.forEach { DetailRow(it.day, if (it.available) Fmt.range(it.opening, it.closing) else "Closed") }
                }
            }

            SectionTitle("Energy slots (next 7 days)")
            if (upcoming.isEmpty()) {
                EmptyState("No slots available", "Check back later or try another station.")
            }
            upcoming.forEach { (date, daySlots) ->
                SectionCard {
                    Text(Fmt.date(date), fontWeight = FontWeight.SemiBold)
                    daySlots.forEach { slot ->
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Column(Modifier.weight(1f)) {
                                Text(Fmt.range(slot.startTime, slot.endTime), fontWeight = FontWeight.Medium)
                                Text("${Fmt.kw(slot.availableKw)} of ${Fmt.kw(slot.capacityKw)} available", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (s.isActive && slot.isBookable) {
                                Button(onClick = { onReserve(s.id, slot.id) }, modifier = Modifier.testTag("reserve_${slot.id}")) { Text("Reserve") }
                            } else {
                                StatusChip(slot.statusEnum.name)
                            }
                        }
                    }
                }
            }
        }
    }
}
