package lk.smartsolar.microgrid.ui.operator

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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.TxFilter
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.common.operatorTransactions

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

    Column {
        SunChainTopBar("Transactions")
        OfflineBanner(online, lastSync)
        OutlinedTextField(
            query, { query = it }, placeholder = { Text("Search by reservation ID or NIC") }, singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).testTag("tx_search"),
        )
        Row(Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = todayOnly, onClick = { todayOnly = true }, label = { Text("Today") }, modifier = Modifier.testTag("tx_today"))
            FilterChip(selected = !todayOnly, onClick = { todayOnly = false }, label = { Text("Recent") }, modifier = Modifier.testTag("tx_recent"))
            TxFilter.entries.forEach { f -> FilterChip(selected = filter == f, onClick = { filter = f }, label = { Text(f.label) }) }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            if (visible.isEmpty()) {
                EmptyState("No transactions found", if (todayOnly) "Nothing completed today yet. Switch to Recent to see earlier ones." else "Transactions appear once a QR code has been verified.")
            } else {
                LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(visible, key = { it.id }) { r -> ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, showNic = true, modifier = Modifier.fillMaxWidth()) }
                }
            }
        }
    }
}
