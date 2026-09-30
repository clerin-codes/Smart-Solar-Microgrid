package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.material.icons.rounded.History
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.ViewFilter
import lk.smartsolar.microgrid.ui.common.completedTransfers
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.common.filterReservations
import lk.smartsolar.microgrid.ui.design.GlassChip
import lk.smartsolar.microgrid.ui.design.HeroCard
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SunChainSearchField
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary
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
    val capacities by vm.capacities.collectAsState()
    val ui by vm.ui.collectAsState()
    var view by rememberSaveable { mutableStateOf(ViewFilter.All) }
    var query by rememberSaveable { mutableStateOf("") }

    val visible = remember(items, view, query, names) { filterReservations(items, view, query) { names[it] ?: "" } }

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("My reservations", subtitle = "Track and manage your bookings")
        OfflineBanner(online, lastSync)
        SunChainSearchField(query, { query = it }, "Search by number or station", Modifier.padding(horizontal = Spacing.screen).testTag("reservation_search"))
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = Spacing.screen, vertical = Spacing.md),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            ViewFilter.entries.forEach { f -> GlassChip(f.label, view == f, { view = f }, Modifier.testTag("view_${f.name}")) }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            if (visible.isEmpty()) {
                EmptyState(
                    if (ui.loaded || items.isNotEmpty()) "No reservations found" else "Loading...",
                    "Book an energy slot from the Stations tab.",
                    icon = Icons.Rounded.EventAvailable,
                )
            } else {
                LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.screen, vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    items(visible, key = { it.id }) { r -> ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, energyKw = capacities[r.slotId]) }
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

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Transaction history", subtitle = "Your completed energy transfers")
        OfflineBanner(online, lastSync)
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = Spacing.screen, vertical = Spacing.sm),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            listOf<Pair<String, Int?>>("All time" to null, "Last 30 days" to 30, "Last 7 days" to 7).forEach { (label, d) ->
                GlassChip(label, days == d, { days = d })
            }
        }
        if (stationOptions.size > 1) {
            Row(
                Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.sm),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
            ) {
                GlassChip("All stations", stationId == null, { stationId = null })
                stationOptions.forEach { (id, name) -> GlassChip(name, stationId == id, { stationId = id }) }
            }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.screen, vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                item {
                    HeroCard {
                        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                            androidx.compose.material3.Icon(Icons.Rounded.Bolt, contentDescription = null, tint = EnergyGreen)
                            Text("Energy received", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                        }
                        Text(Fmt.kw(totalKw), style = MaterialTheme.typography.displaySmall, modifier = Modifier.testTag("total_kw"))
                        Text("${visible.size} completed transfer${if (visible.size == 1) "" else "s"} (slot capacity)", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
                if (visible.isEmpty()) item {
                    EmptyState("No completed transfers yet", "Completed energy transfers appear here with a receipt.", icon = Icons.Rounded.History)
                }
                items(visible, key = { it.id }) { r -> ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, energyKw = capacities[r.slotId]) }
            }
        }
    }
}
