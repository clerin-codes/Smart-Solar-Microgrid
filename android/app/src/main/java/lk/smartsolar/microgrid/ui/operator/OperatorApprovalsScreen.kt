package lk.smartsolar.microgrid.ui.operator

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextAlign
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.LocalSnackbar
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.ReservationCard
import lk.smartsolar.microgrid.ui.common.ReservationsViewModel
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary

/** Reservations shown per page on the Approvals tab. */
const val APPROVALS_PAGE_SIZE = 10

/** Number of pages needed for [count] items; an empty list still has one (empty) page. */
fun approvalPageCount(count: Int, pageSize: Int = APPROVALS_PAGE_SIZE): Int =
    maxOf(1, (count + pageSize - 1) / pageSize)

/** Reservations waiting for the operator's decision, newest first (the order the repository already keeps). */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OperatorApprovalsScreen(onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ReservationsViewModel(it.reservations, it.stations, it.sync) }
    val items by vm.items.collectAsState()
    val names by vm.stationNames.collectAsState()
    val ui by vm.ui.collectAsState()
    val approving by vm.approving.collectAsState()
    val rejecting by vm.rejecting.collectAsState()
    val snackbar = LocalSnackbar.current
    var requestedPage by rememberSaveable { mutableIntStateOf(0) }

    LaunchedEffect(Unit) { vm.events.collect { snackbar.showSnackbar(it) } }

    val pending = items
        .filter { it.statusEnum == ReservationStatus.Pending }
        .sortedByDescending { it.createdAt }
    val pages = approvalPageCount(pending.size)
    // Approving the last row of a page can shrink the list, so keep the page inside the new range.
    val page = requestedPage.coerceIn(0, pages - 1)
    val from = page * APPROVALS_PAGE_SIZE
    val visible = pending.drop(from).take(APPROVALS_PAGE_SIZE)

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Approvals", subtitle = "${pending.size} awaiting approval")
        OfflineBanner(online, lastSync)
        if (online) ErrorBanner(ui.error, vm::refresh)
        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            if (pending.isEmpty()) {
                EmptyState("Nothing waiting for approval", "New reservation requests will show up here.", icon = Icons.Rounded.CheckCircle)
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = Spacing.screen, vertical = Spacing.sm),
                    verticalArrangement = Arrangement.spacedBy(Spacing.md),
                ) {
                    items(visible, key = { it.id }) { r ->
                        ReservationCard(
                            r, names[r.stationId] ?: "Station", onClick = { onOpen(r.id) }, showNic = true,
                            footer = {
                                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                                    SunChainButton(
                                        if (approving == r.id) "Approving..." else "Approve",
                                        onClick = { vm.approve(r.id) },
                                        modifier = Modifier.weight(1f).testTag("approve_${r.number}"),
                                        kind = ButtonKind.Success, enabled = approving == null && rejecting == null, icon = Icons.Rounded.CheckCircle, compact = true,
                                    )
                                    SunChainButton(
                                        if (rejecting == r.id) "Rejecting..." else "Reject",
                                        onClick = { vm.reject(r.id) },
                                        modifier = Modifier.weight(1f).testTag("reject_${r.number}"),
                                        kind = ButtonKind.Danger, enabled = approving == null && rejecting == null, icon = Icons.Rounded.Close, compact = true,
                                    )
                                }
                            },
                        )
                    }
                    if (pages > 1) {
                        item(key = "pager") {
                            PageBar(
                                page = page, pages = pages, shown = "${from + 1}-${from + visible.size}", total = pending.size,
                                onPrevious = { requestedPage = page - 1 },
                                onNext = { requestedPage = page + 1 },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PageBar(page: Int, pages: Int, shown: String, total: Int, onPrevious: () -> Unit, onNext: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(vertical = Spacing.sm), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        Text(
            "Page ${page + 1} of $pages · $shown of $total",
            modifier = Modifier.fillMaxWidth().testTag("approvals_page"),
            style = MaterialTheme.typography.bodyMedium, color = TextSecondary, textAlign = TextAlign.Center,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md), verticalAlignment = Alignment.CenterVertically) {
            SunChainButton(
                "Previous", onPrevious, Modifier.weight(1f).testTag("page_prev"),
                kind = ButtonKind.Secondary, enabled = page > 0, icon = Icons.AutoMirrored.Rounded.ArrowBack, compact = true,
            )
            SunChainButton(
                "Next", onNext, Modifier.weight(1f).testTag("page_next"),
                kind = ButtonKind.Secondary, enabled = page < pages - 1, icon = Icons.AutoMirrored.Rounded.ArrowForward, compact = true,
            )
        }
    }
}
