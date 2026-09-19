package lk.smartsolar.microgrid.ui.operator

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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.LocalSnackbar
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.OperatorStats
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.SectionTitle
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt

private const val REFRESH_MS = 15_000L

@Composable
private fun Stat(label: String, value: Int, tag: String, modifier: Modifier = Modifier) {
    SectionCard(modifier.testTag(tag)) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value.toString(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OperatorDashboardScreen(onScan: () -> Unit, onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val ui by vm.ui.collectAsState()
    val approving by vm.approving.collectAsState()
    val snackbar = LocalSnackbar.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    LaunchedEffect(Unit) { vm.events.collect { snackbar.showSnackbar(it) } }
    // Live updates while the dashboard is on screen.
    LaunchedEffect(lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                delay(REFRESH_MS)
                vm.refreshQuietly()
            }
        }
    }

    val stats = remember(items) { OperatorStats.from(items) }
    val pending = items.filter { it.statusEnum == ReservationStatus.Pending }

    Column {
        SunChainTopBar("Grid operator")
        OfflineBanner(online, lastSync)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh) {
            Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Hello, ${session?.fullName ?: ""}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, modifier = Modifier.testTag("greeting"))
                if (online) ErrorBanner(ui.error, vm::refresh)

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Stat("Pending approval", stats.pending, "stat_pending", Modifier.weight(1f))
                    Stat("Awaiting QR scan", stats.awaitingScan, "stat_scan", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Stat("Verified, not done", stats.verified, "stat_verified", Modifier.weight(1f))
                    Stat("Completed today", stats.completedToday, "stat_today", Modifier.weight(1f))
                }

                Button(onClick = onScan, modifier = Modifier.fillMaxWidth().testTag("scan_qr")) { Text("Scan QR code") }

                SectionTitle("Awaiting approval")
                if (pending.isEmpty()) EmptyState("Nothing waiting for approval")
                pending.forEach { r ->
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, showNic = true)
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Button(
                                onClick = { vm.approve(r.id) },
                                enabled = approving == null,
                                modifier = Modifier.fillMaxWidth().testTag("approve_${r.number}"),
                            ) { Text(if (approving == r.id) "Approving..." else "Approve ${r.number}") }
                        }
                    }
                }
                Text(
                    "Live · refreshes every ${REFRESH_MS / 1000}s" + if (lastSync > 0) " · last updated ${Fmt.stamp(lastSync)}" else "",
                    style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
