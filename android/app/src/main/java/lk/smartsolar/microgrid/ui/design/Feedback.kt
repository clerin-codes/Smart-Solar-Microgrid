package lk.smartsolar.microgrid.ui.design

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.theme.Amber
import lk.smartsolar.microgrid.ui.theme.Blue
import lk.smartsolar.microgrid.ui.theme.ErrorRed
import lk.smartsolar.microgrid.ui.theme.Green
import lk.smartsolar.microgrid.ui.theme.Info
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary

/** Pending, approved, completed and so on, as a coloured pill with an icon so colour is never the only cue. */
@Composable
fun StatusPill(status: String, modifier: Modifier = Modifier) {
    val (color, icon) = when (status) {
        "Pending" -> Amber to Icons.Rounded.Schedule
        "Approved" -> Info to Icons.Rounded.CheckCircle
        "Verified" -> Blue to Icons.Rounded.Verified
        "Completed", "Available", "Active" -> Green to Icons.Rounded.TaskAlt
        "Rejected", "Full" -> ErrorRed to Icons.Rounded.ErrorOutline
        "Cancelled", "Closed", "Inactive" -> Color(0xFF64748B) to Icons.Rounded.Block
        else -> Color(0xFF64748B) to Icons.Rounded.Schedule
    }
    Row(
        modifier
            .clip(Shapes.pill)
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.22f), Shapes.pill)
            .padding(start = 8.dp, end = 10.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(icon, contentDescription = null, Modifier.size(14.dp), tint = color)
        Text(status, color = color, style = MaterialTheme.typography.labelMedium, maxLines = 1)
    }
}

/** A key figure with a label and a small tinted icon. */
@Composable
fun MetricCard(label: String, value: Int, icon: ImageVector, tint: Color, modifier: Modifier = Modifier) {
    GlassCard(modifier, contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.md), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        IconBadge(icon, tint, size = 34.dp)
        Text(value.toString(), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextSecondary, maxLines = 2)
    }
}

@Composable
fun SectionHeader(text: String, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    Row(modifier.fillMaxWidth().padding(top = Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
        Text(text, Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
        action?.invoke()
    }
}

/** Sliding highlight for loading placeholders. */
fun Modifier.shimmer(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val progress by transition.animateFloat(
        initialValue = -1f, targetValue = 2f,
        animationSpec = infiniteRepeatable(tween(1300, easing = LinearEasing), RepeatMode.Restart),
        label = "shimmerProgress",
    )
    drawBehind {
        val w = size.width
        drawRect(
            Brush.horizontalGradient(
                listOf(Color(0xFFE6EBF3), Color(0xFFF6F8FC), Color(0xFFE6EBF3)),
                startX = progress * w, endX = progress * w + w,
            ),
        )
    }
}

@Composable
fun SkeletonCard(modifier: Modifier = Modifier) {
    GlassCard(modifier, elevation = 0.dp) {
        Box(Modifier.width(120.dp).height(16.dp).clip(Shapes.small).shimmer())
        Box(Modifier.fillMaxWidth(0.7f).height(12.dp).clip(Shapes.small).shimmer())
        Box(Modifier.fillMaxWidth(0.5f).height(12.dp).clip(Shapes.small).shimmer())
    }
}

/** Placeholder cards shown while a screen loads, instead of a blocking spinner. */
@Composable
fun LoadingState(modifier: Modifier = Modifier, count: Int = 3) {
    Column(
        modifier.fillMaxSize().padding(Spacing.screen).semantics { contentDescription = "Loading" },
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        repeat(count) { SkeletonCard() }
    }
}

@Composable
fun EmptyPanel(
    title: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    icon: ImageVector = Icons.Rounded.Inbox,
    action: (@Composable () -> Unit)? = null,
) {
    Column(
        modifier.fillMaxWidth().padding(horizontal = Spacing.xxl, vertical = Spacing.xxxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        IconBadge(icon, lk.smartsolar.microgrid.ui.theme.SunChainBlue, size = 64.dp)
        Spacer(Modifier.height(Spacing.xs))
        Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        if (hint != null) Text(hint, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, textAlign = TextAlign.Center)
        if (action != null) {
            Spacer(Modifier.height(Spacing.sm))
            action()
        }
    }
}

/** Friendly failure notice with an optional retry. Never shows addresses or technical detail. */
@Composable
fun ErrorState(
    message: String?,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    horizontalInset: androidx.compose.ui.unit.Dp = Spacing.screen,
) {
    if (message == null) return
    Row(
        modifier
            .fillMaxWidth()
            .padding(horizontal = horizontalInset, vertical = Spacing.sm)
            .clip(Shapes.medium)
            .background(Color(0xFFFEECEC))
            .border(1.dp, ErrorRed.copy(alpha = 0.25f), Shapes.medium)
            .padding(horizontal = Spacing.md, vertical = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        Icon(Icons.Rounded.ErrorOutline, contentDescription = null, Modifier.size(22.dp), tint = ErrorRed)
        Text(message, Modifier.weight(1f), color = Color(0xFF7A1212), style = MaterialTheme.typography.bodyMedium)
        if (onRetry != null) SunChainButton("Retry", onRetry, kind = ButtonKind.Ghost, compact = true)
    }
}

/** Shown while offline, with when the saved data was last refreshed. */
@Composable
fun OfflineNotice(text: String, modifier: Modifier = Modifier) {
    Row(
        modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.screen, vertical = Spacing.xs)
            .clip(Shapes.pill)
            .background(Amber.copy(alpha = 0.16f))
            .border(1.dp, Amber.copy(alpha = 0.3f), Shapes.pill)
            .padding(horizontal = Spacing.lg, vertical = Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        Icon(Icons.Rounded.CloudOff, contentDescription = null, Modifier.size(18.dp), tint = Color(0xFF92580A))
        Text(text, style = MaterialTheme.typography.bodySmall, color = Color(0xFF6B4208))
    }
}
