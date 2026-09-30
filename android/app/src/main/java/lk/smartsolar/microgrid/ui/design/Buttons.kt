package lk.smartsolar.microgrid.ui.design

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.theme.BorderSoft
import lk.smartsolar.microgrid.ui.theme.DisabledSurface
import lk.smartsolar.microgrid.ui.theme.DisabledText
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.EnergyGreenDeep
import lk.smartsolar.microgrid.ui.theme.ErrorRed
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.Sizes
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue

enum class ButtonKind { Primary, Success, Secondary, Danger, Ghost }

/**
 * The one button style for the app. Primary and Success are filled gradients, Secondary is a glass
 * outline, Danger is red and Ghost is text-only. Pass `loading` to show a spinner in place of the label.
 */
@Composable
fun SunChainButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: ButtonKind = ButtonKind.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
    compact: Boolean = false,
) {
    val source = remember { MutableInteractionSource() }
    val active = enabled || loading
    val shape = Shapes.medium
    val background: Brush = when {
        !active -> Brush.linearGradient(listOf(DisabledSurface, DisabledSurface))
        kind == ButtonKind.Primary -> Brush.linearGradient(listOf(SunChainBlue, Color(0xFF2B62E6)))
        kind == ButtonKind.Success -> Brush.linearGradient(listOf(EnergyGreen, EnergyGreenDeep))
        kind == ButtonKind.Danger -> Brush.linearGradient(listOf(ErrorRed, Color(0xFFD62B2B)))
        kind == ButtonKind.Secondary -> Brush.linearGradient(listOf(Color.White.copy(alpha = 0.85f), Color.White.copy(alpha = 0.65f)))
        else -> Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
    }
    val contentTarget = when {
        !active -> DisabledText
        kind == ButtonKind.Secondary || kind == ButtonKind.Ghost -> SunChainBlue
        else -> Color.White
    }
    val content by animateColorAsState(contentTarget, label = "buttonContent")
    val glow = when (kind) {
        ButtonKind.Primary -> SunChainBlue
        ButtonKind.Success -> EnergyGreen
        ButtonKind.Danger -> ErrorRed
        else -> Color.Transparent
    }
    val filled = active && (kind == ButtonKind.Primary || kind == ButtonKind.Success || kind == ButtonKind.Danger)

    Box(
        modifier
            .defaultMinSize(minHeight = if (compact) Sizes.touch else Sizes.button)
            .pressScale(source)
            .then(if (filled) Modifier.shadow(10.dp, shape, ambientColor = glow.copy(alpha = 0.12f), spotColor = glow.copy(alpha = 0.35f)) else Modifier)
            .clip(shape)
            .background(background)
            .then(if (kind == ButtonKind.Secondary && active) Modifier.border(1.dp, BorderSoft, shape) else Modifier)
            .clickable(source, indication = null, enabled = enabled && !loading, role = Role.Button, onClick = onClick)
            .padding(horizontal = Spacing.xl, vertical = if (compact) Spacing.sm else Spacing.md),
        contentAlignment = Alignment.Center,
    ) {
        if (loading) {
            CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = content)
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm), verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) Icon(icon, contentDescription = null, Modifier.size(20.dp), tint = content)
                Text(text, color = content, style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

/** Round glass icon button, at least 44dp so it is easy to hit. */
@Composable
fun GlassIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = SunChainBlue,
) {
    val source = remember { MutableInteractionSource() }
    Box(
        modifier
            .size(Sizes.touch)
            .pressScale(source)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.75f))
            .border(1.dp, BorderSoft.copy(alpha = 0.8f), CircleShape)
            .clickable(source, indication = null, role = Role.Button, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription, Modifier.size(22.dp), tint = tint)
    }
}

/** Selectable pill used for filters and segmented choices. */
@Composable
fun GlassChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    sublabel: String? = null,
) {
    val source = remember { MutableInteractionSource() }
    val text by animateColorAsState(if (selected) Color.White else MaterialTheme.colorScheme.onSurface, label = "chipText")
    val sub by animateColorAsState(if (selected) Color.White.copy(alpha = 0.85f) else MaterialTheme.colorScheme.onSurfaceVariant, label = "chipSub")
    val fill = if (selected) Brush.linearGradient(listOf(SunChainBlue, Color(0xFF2B62E6)))
    else Brush.linearGradient(listOf(Color.White.copy(alpha = 0.8f), Color.White.copy(alpha = 0.62f)))
    Box(
        modifier
            .defaultMinSize(minHeight = Sizes.touch)
            .pressScale(source, 0.95f)
            .clip(Shapes.pill)
            .background(fill)
            .border(1.dp, if (selected) Color.Transparent else BorderSoft, Shapes.pill)
            .clickable(source, indication = null, role = Role.Tab, onClick = onClick)
            .padding(horizontal = Spacing.lg, vertical = Spacing.sm),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.layout.Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, color = text, style = MaterialTheme.typography.labelLarge, maxLines = 1)
            if (sublabel != null) Text(sublabel, color = sub, style = MaterialTheme.typography.labelSmall, maxLines = 1)
        }
    }
}

@Composable
fun FullWidthButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: ButtonKind = ButtonKind.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
) = SunChainButton(text, onClick, modifier.fillMaxWidth(), kind, enabled, loading, icon)
