package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.SectionTitle
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel

@Composable
private fun StatCard(label: String, value: Int, modifier: Modifier = Modifier) {
    SectionCard(modifier) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value.toString(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProsumerHomeScreen(onBook: () -> Unit, onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val ui by vm.ui.collectAsState()

    val upcoming = items
        .filter { it.statusEnum == ReservationStatus.Pending || it.statusEnum == ReservationStatus.Approved }
        .sortedWith(compareBy({ it.date }, { it.startTime }))

    Column {
        SunChainTopBar("SunChain")
        OfflineBanner(online, lastSync)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh) {
            Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Hello, ${session?.fullName ?: ""}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.testTag("greeting"))
                if (online) ErrorBanner(ui.error, vm::refresh)

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard("Pending", items.count { it.statusEnum == ReservationStatus.Pending }, Modifier.weight(1f))
                    StatCard("Approved", items.count { it.statusEnum == ReservationStatus.Approved }, Modifier.weight(1f))
                    StatCard("Completed", items.count { it.statusEnum == ReservationStatus.Completed }, Modifier.weight(1f))
                }

                Button(onClick = onBook, modifier = Modifier.fillMaxWidth().testTag("book_energy")) { Text("Book energy") }

                SectionTitle("Upcoming reservations")
                if (upcoming.isEmpty()) {
                    EmptyState("No upcoming reservations", "Book an energy slot at a solar station.")
                } else {
                    upcoming.take(5).forEach { r ->
                        ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) })
                    }
                }
            }
        }
    }
}
