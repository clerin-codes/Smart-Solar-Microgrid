package lk.smartsolar.microgrid.ui.prosumer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.HourglassTop
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.R
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.Logo
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.SectionTitle
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.common.SessionAvatar
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.HeroCard
import lk.smartsolar.microgrid.ui.design.MetricCard
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.design.timeGreeting
import lk.smartsolar.microgrid.ui.theme.AccentQuoteStyle
import lk.smartsolar.microgrid.ui.theme.Amber
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Info
import lk.smartsolar.microgrid.ui.theme.SolarOrange
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProsumerHomeScreen(onBook: () -> Unit, onOpen: (String) -> Unit, onProfile: () -> Unit = {}) {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val capacities by vm.capacities.collectAsState()
    val ui by vm.ui.collectAsState()
    val fullName = session?.fullName.orEmpty()

    val upcoming = items
        .filter { it.statusEnum == ReservationStatus.Pending || it.statusEnum == ReservationStatus.Approved }
        .sortedWith(compareBy({ it.date }, { it.startTime }))

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = Spacing.screen, vertical = Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Logo(Modifier.size(44.dp))
            Spacer(Modifier.weight(1f))
            SessionAvatar(fullName, Modifier.clickable(role = Role.Button, onClick = onProfile))
        }
        OfflineBanner(online, lastSync)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            Column(
                Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg),
                verticalArrangement = Arrangement.spacedBy(Spacing.lg),
            ) {
                HeroCard(backgroundRes = R.drawable.book_energy_background, contentFraction = 0.74f) {
                    Text(timeGreeting(), style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
                    Text(fullName, style = MaterialTheme.typography.headlineLarge, modifier = Modifier.testTag("greeting"))
                    Text("Your sun, your grid, your power.", style = AccentQuoteStyle, color = SolarOrange)
                    Spacer(Modifier.height(Spacing.xs))
                    SunChainButton("Book energy", onBook, Modifier.fillMaxWidth().testTag("book_energy"), kind = ButtonKind.Success, icon = Icons.Rounded.Bolt)
                }
                if (online) ErrorBanner(ui.error, vm::refresh)

                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    MetricCard("Pending", items.count { it.statusEnum == ReservationStatus.Pending }, Icons.Rounded.HourglassTop, Amber, Modifier.weight(1f))
                    MetricCard("Approved", items.count { it.statusEnum == ReservationStatus.Approved }, Icons.Rounded.CheckCircle, Info, Modifier.weight(1f))
                    MetricCard("Completed", items.count { it.statusEnum == ReservationStatus.Completed }, Icons.Rounded.TaskAlt, EnergyGreen, Modifier.weight(1f))
                }

                SectionTitle("Upcoming reservations")
                if (upcoming.isEmpty()) {
                    EmptyState("No upcoming reservations", "Book an energy slot at a solar station.", icon = Icons.Rounded.Bolt)
                } else {
                    upcoming.take(5).forEach { r ->
                        ReservationCard(r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, energyKw = capacities[r.slotId])
                    }
                }
            }
        }
    }
}
