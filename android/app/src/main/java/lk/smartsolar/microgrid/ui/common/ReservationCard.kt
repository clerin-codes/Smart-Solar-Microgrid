package lk.smartsolar.microgrid.ui.common

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CalendarToday
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.data.tx
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.StatusPill
import lk.smartsolar.microgrid.ui.design.pressScale
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary
import lk.smartsolar.microgrid.util.Fmt

@Composable
private fun InfoLine(icon: ImageVector, text: String, tint: androidx.compose.ui.graphics.Color = TextSecondary) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        Icon(icon, contentDescription = null, Modifier.size(16.dp), tint = tint)
        Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** The tappable body of a reservation card: number and status, station, date and time. */
@Composable
fun ReservationSummary(
    r: ReservationEntity,
    stationName: String,
    onClick: () -> Unit,
    showNic: Boolean = false,
    showTransaction: Boolean = false,
    energyKw: Double? = null,
    modifier: Modifier = Modifier,
) {
    val source = remember { MutableInteractionSource() }
    Column(
        modifier.fillMaxWidth().pressScale(source, 0.985f).clickable(source, indication = null, role = Role.Button, onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(r.number, Modifier.weight(1f), style = MaterialTheme.typography.titleSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
            StatusPill(r.statusEnum.name)
        }
        InfoLine(Icons.Rounded.LocationOn, stationName)
        InfoLine(Icons.Rounded.CalendarToday, "${Fmt.date(r.date)} · ${Fmt.range(r.startTime, r.endTime)}")
        if (showNic) InfoLine(Icons.Rounded.Person, "Prosumer ${r.prosumerNic}")
        if (energyKw != null && energyKw > 0) InfoLine(Icons.Rounded.Bolt, Fmt.kw(energyKw), EnergyGreen)
        val txLabel = r.tx.name.let { if (it == "NotStarted") "Not started" else it }
        // Skip the transaction pill when it would only repeat the reservation status above.
        if (showTransaction && txLabel != r.statusEnum.name) {
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
                Text("Transaction", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                StatusPill(txLabel)
            }
        }
    }
}

@Composable
fun ReservationCard(
    r: ReservationEntity,
    stationName: String,
    onClick: () -> Unit,
    showNic: Boolean = false,
    modifier: Modifier = Modifier,
    showTransaction: Boolean = false,
    energyKw: Double? = null,
    footer: (@Composable ColumnScope.() -> Unit)? = null,
) {
    GlassCard(modifier) {
        ReservationSummary(r, stationName, onClick, showNic, showTransaction, energyKw)
        footer?.invoke(this)
    }
}
