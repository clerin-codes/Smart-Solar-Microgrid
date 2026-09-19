package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.ViewFilter
import lk.smartsolar.microgrid.ui.common.completedTransfers
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.common.filterReservations
import lk.smartsolar.microgrid.util.Fmt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyReservationsScreen(onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val ui by vm.ui.collectAsState()
    var view by rememberSaveable { mutableStateOf(ViewFilter.All) }
    var query by rememberSaveable { mutableStateOf("") }

    val visible = remember(items, view, query, names) { filterReservations(items, view, query) { names[it] ?: "" } }

    Column {
        SunChainTopBar("My reservations")
        OfflineBanner(online, lastSync)
        OutlinedTextField(
            query, { query = it }, placeholder = { Text("Search by number or station") }, singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).testTag("reservation_search"),
        )
        Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ViewFilter.entries.forEach { f -> FilterChip(selected = view == f, onClick = { view = f }, label = { Text(f.label) }, modifier = Modifier.testTag("view_${f.name}")) }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            if (visible.isEmpty()) {
                EmptyState(if (ui.loaded || items.isNotEmpty()) "No reservations found" else "Loading...", "Book an energy slot from the Stations tab.")
            } else {
                LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(visible, key = { it.id }) { r -> ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }) }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionHistoryScreen(onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val capacities by vm.capacities.collectAsState()
    val ui by vm.ui.collectAsState()
    var days by rememberSaveable { mutableStateOf<Int?>(null) }
    var stationId by rememberSaveable { mutableStateOf<String?>(null) }

    val visible = remember(items, days, stationId) { completedTransfers(items, days, stationId) }
    val stationOptions = remember(items, names) { items.map { it.stationId }.distinct().map { it to (names[it] ?: "Station") } }
    val totalKw = visible.sumOf { capacities[it.slotId] ?: 0.0 }

    Column {
        SunChainTopBar("Transaction history")
        OfflineBanner(online, lastSync)
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf<Pair<String, Int?>>("All time" to null, "Last 30 days" to 30, "Last 7 days" to 7).forEach { (label, d) ->
                FilterChip(selected = days == d, onClick = { days = d }, label = { Text(label) })
            }
        }
        if (stationOptions.size > 1) {
            Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = stationId == null, onClick = { stationId = null }, label = { Text("All stations") })
                stationOptions.forEach { (id, name) -> FilterChip(selected = stationId == id, onClick = { stationId = id }, label = { Text(name) }) }
            }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    SectionCard {
                        Text("Energy received", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(Fmt.kw(totalKw), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, modifier = Modifier.testTag("total_kw"))
                        Text("${visible.size} completed transfer${if (visible.size == 1) "" else "s"} (slot capacity)", style = MaterialTheme.typography.bodySmall)
                    }
                }
                if (visible.isEmpty()) item { EmptyState("No completed transfers yet", "Completed energy transfers appear here with a receipt.") }
                items(visible, key = { it.id }) { r -> ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }) }
            }
        }
    }
}
