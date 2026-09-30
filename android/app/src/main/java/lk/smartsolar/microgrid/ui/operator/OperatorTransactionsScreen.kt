package lk.smartsolar.microgrid.ui.operator

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Receipt
import androidx.compose.material3.ExperimentalMaterial3Api
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
import lk.smartsolar.microgrid.ui.common.TxFilter
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.common.operatorTransactions
import lk.smartsolar.microgrid.ui.design.GlassChip
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SunChainSearchField
import lk.smartsolar.microgrid.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OperatorTransactionsScreen(onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val ui by vm.ui.collectAsState()
    var todayOnly by rememberSaveable { mutableStateOf(false) }
    var filter by rememberSaveable { mutableStateOf(TxFilter.All) }
    var query by rememberSaveable { mutableStateOf("") }

    val visible = remember(items, todayOnly, filter, query) { operatorTransactions(items, filter, todayOnly, query) }

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Transactions", subtitle = "${visible.size} ${if (visible.size == 1) "record" else "records"}")
        OfflineBanner(online, lastSync)
        SunChainSearchField(query, { query = it }, "Search by reservation ID or NIC", Modifier.padding(horizontal = Spacing.screen).testTag("tx_search"))
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = Spacing.screen, vertical = Spacing.md),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            GlassChip("Today", todayOnly, { todayOnly = true }, Modifier.testTag("tx_today"))
            GlassChip("Recent", !todayOnly, { todayOnly = false }, Modifier.testTag("tx_recent"))
            androidx.compose.foundation.layout.Box(
                Modifier.align(androidx.compose.ui.Alignment.CenterVertically)
                    .width(1.dp).height(24.dp).background(lk.smartsolar.microgrid.ui.theme.BorderSoft),
            )
            TxFilter.entries.forEach { f -> GlassChip(f.label, filter == f, { filter = f }) }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            if (visible.isEmpty()) {
                EmptyState(
                    "No transactions found",
                    if (todayOnly) "Nothing completed today yet. Switch to Recent to see earlier ones." else "Transactions appear once a QR code has been verified.",
                    icon = Icons.Rounded.Receipt,
                )
            } else {
                LazyColumn(contentPadding = PaddingValues(horizontal = Spacing.screen, vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    items(visible, key = { it.id }) { r ->
                        ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, showNic = true, showTransaction = true)
                    }
                }
            }
        }
    }
}
