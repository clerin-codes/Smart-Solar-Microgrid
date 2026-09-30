package lk.smartsolar.microgrid.ui.operator

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.HourglassTop
import androidx.compose.material.icons.rounded.QrCodeScanner
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material.icons.rounded.Verified
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
import lk.smartsolar.microgrid.ui.common.Logo
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.OperatorStats
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionTitle
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.design.Avatar
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.HeroCard
import lk.smartsolar.microgrid.ui.design.MetricCard
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.design.timeGreeting
import lk.smartsolar.microgrid.ui.theme.Amber
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Info
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary
import lk.smartsolar.microgrid.util.Fmt

private const val REFRESH_MS = 15_000L

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
    val fullName = session?.fullName.orEmpty()

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

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = Spacing.screen, vertical = Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Logo(Modifier.width(120.dp).height(30.dp))
            Spacer(Modifier.weight(1f))
            Avatar(fullName)
        }
        OfflineBanner(online, lastSync)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            Column(
                Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg),
                verticalArrangement = Arrangement.spacedBy(Spacing.md),
            ) {
                HeroCard {
                    Text(timeGreeting(), style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
                    Text(fullName, style = MaterialTheme.typography.headlineMedium, modifier = Modifier.testTag("greeting"))
                    Text("Grid Operator", style = MaterialTheme.typography.labelLarge, color = SunChainBlue)
                    Spacer(Modifier.height(Spacing.xs))
                    SunChainButton("Scan QR code", onScan, Modifier.fillMaxWidth().testTag("scan_qr"), icon = Icons.Rounded.QrCodeScanner)
                }
                if (online) ErrorBanner(ui.error, vm::refresh)

                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    MetricCard("Pending approval", stats.pending, Icons.Rounded.HourglassTop, Amber, Modifier.weight(1f).testTag("stat_pending"))
                    MetricCard("Awaiting QR scan", stats.awaitingScan, Icons.Rounded.QrCodeScanner, Info, Modifier.weight(1f).testTag("stat_scan"))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    MetricCard("Verified, not done", stats.verified, Icons.Rounded.Verified, SunChainBlue, Modifier.weight(1f).testTag("stat_verified"))
                    MetricCard("Completed today", stats.completedToday, Icons.Rounded.TaskAlt, EnergyGreen, Modifier.weight(1f).testTag("stat_today"))
                }

                SectionTitle("Awaiting approval")
                if (pending.isEmpty()) EmptyState("Nothing waiting for approval", icon = Icons.Rounded.CheckCircle)
                pending.forEach { r ->
                    ReservationCard(
                        r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, showNic = true,
                        footer = {
                            SunChainButton(
                                if (approving == r.id) "Approving..." else "Approve",
                                onClick = { vm.approve(r.id) },
                                modifier = Modifier.fillMaxWidth().testTag("approve_${r.number}"),
                                kind = ButtonKind.Success, enabled = approving == null, icon = Icons.Rounded.CheckCircle, compact = true,
                            )
                        },
                    )
                }
                Text(
                    "Live · refreshes every ${REFRESH_MS / 1000}s" + if (lastSync > 0) " · last updated ${Fmt.stamp(lastSync)}" else "",
                    style = MaterialTheme.typography.labelSmall, color = TextSecondary,
                )
            }
        }
    }
}
