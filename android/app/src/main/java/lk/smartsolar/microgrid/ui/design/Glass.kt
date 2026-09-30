package lk.smartsolar.microgrid.ui.design

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.theme.BorderSoft
import lk.smartsolar.microgrid.ui.theme.DarkNavy
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.SolarOrange
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue

/** App-wide backdrop: a soft cool gradient with faint solar-orange, brand-blue and green glows. */
@Composable
fun SunChainBackground(modifier: Modifier = Modifier, content: @Composable BoxScope.() -> Unit) {
    Box(
        modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFFF8FAFD), Color(0xFFEFF4FF), Color(0xFFF6F1FF))))
            .drawBehind {
                val r = size.width * 0.75f
                fun glow(color: Color, center: Offset) =
                    drawCircle(Brush.radialGradient(listOf(color, Color.Transparent), center = center, radius = r), radius = r, center = center)
                glow(SolarOrange.copy(alpha = 0.16f), Offset(size.width * 1.0f, size.height * 0.03f))
                glow(SunChainBlue.copy(alpha = 0.10f), Offset(0f, size.height * 0.28f))
                glow(EnergyGreen.copy(alpha = 0.10f), Offset(size.width * 0.9f, size.height * 0.95f))
            },
        content = content,
    )
}

/** Gentle scale-down while a control is pressed. */
fun Modifier.pressScale(source: InteractionSource, pressedScale: Float = 0.97f): Modifier = composed {
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) pressedScale else 1f, tween(110), label = "pressScale")
    graphicsLayer { scaleX = scale; scaleY = scale }
}

/** A frosted, layered surface: translucent white, a thin light border and a soft shadow. */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    shape: Shape = Shapes.large,
    tint: Color = Color.White,
    alpha: Float = 0.80f,
    elevation: Dp = 8.dp,
    contentPadding: PaddingValues = PaddingValues(Spacing.lg),
    verticalArrangement: Arrangement.Vertical = Arrangement.spacedBy(Spacing.sm),
    content: @Composable ColumnScope.() -> Unit,
) {
    val source = remember { MutableInteractionSource() }
    val press = if (onClick != null) Modifier.pressScale(source) else Modifier
    val click = if (onClick != null) Modifier.clickable(source, indication = null, role = Role.Button, onClick = onClick) else Modifier
    Column(
        modifier
            .fillMaxWidth()
            .then(press)
            .then(if (elevation > 0.dp) Modifier.shadow(elevation, shape, ambientColor = DarkNavy.copy(alpha = 0.05f), spotColor = SunChainBlue.copy(alpha = 0.14f)) else Modifier)
            .clip(shape)
            .background(Brush.verticalGradient(listOf(tint.copy(alpha = alpha), tint.copy(alpha = alpha * 0.86f))))
            .border(1.dp, Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.95f), BorderSoft.copy(alpha = 0.75f))), shape)
            .then(click)
            .padding(contentPadding),
        verticalArrangement = verticalArrangement,
        content = content,
    )
}

/** Tinted circle with an icon, used to anchor cards and rows. */
@Composable
fun IconBadge(icon: ImageVector, tint: Color, modifier: Modifier = Modifier, size: Dp = 40.dp, contentDescription: String? = null) {
    Box(
        modifier.size(size).clip(CircleShape).background(tint.copy(alpha = 0.13f)),
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription, Modifier.size(size * 0.5f), tint = tint)
    }
}

/** Round avatar showing the initials of a name. */
@Composable
fun Avatar(name: String, modifier: Modifier = Modifier, size: Dp = 44.dp) {
    val initials = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.take(2).joinToString("") { it.first().uppercase() }.ifEmpty { "S" }
    Box(
        modifier.size(size).clip(CircleShape).background(Brush.linearGradient(listOf(SunChainBlue, Color(0xFF3B82F6)))),
        contentAlignment = Alignment.Center,
    ) {
        Text(initials, color = Color.White, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
    }
}

/** Time-of-day greeting for headers ("Good morning", ...). */
fun timeGreeting(hour: Int = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)): String = when {
    hour < 12 -> "Good morning"
    hour < 17 -> "Good afternoon"
    else -> "Good evening"
}

/**
 * Feature card for the top of a dashboard: a pastel blue, green and warm-orange wash with a soft sun
 * glow in the corner, a light border and a gentle shadow. Text on it stays dark for contrast.
 */
@Composable
fun HeroCard(
    modifier: Modifier = Modifier,
    /** Optional photo drawn behind the content, anchored to the right so its subject stays visible. */
    @androidx.annotation.DrawableRes backgroundRes: Int? = null,
    /** Share of the card width the content may use when a photo is shown; the rest is left to the photo. */
    contentFraction: Float = 1f,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = Shapes.hero
    val frame = modifier
        .fillMaxWidth()
        .shadow(14.dp, shape, ambientColor = DarkNavy.copy(alpha = 0.05f), spotColor = SunChainBlue.copy(alpha = 0.18f))
        .clip(shape)
    if (backgroundRes != null) {
        Box(frame.border(1.dp, Brush.verticalGradient(listOf(Color.White, Color.White.copy(alpha = 0.4f))), shape)) {
            androidx.compose.foundation.Image(
                androidx.compose.ui.res.painterResource(backgroundRes),
                contentDescription = null,
                modifier = Modifier.matchParentSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                alignment = Alignment.CenterEnd,
            )
            // Light wash on the left only, so the dark text stays readable while the house and sunrise stay clear.
            Box(
                Modifier.matchParentSize().background(
                    Brush.horizontalGradient(
                        0f to Color.White.copy(alpha = 0.88f),
                        0.55f to Color.White.copy(alpha = 0.8f),
                        0.68f to Color.White.copy(alpha = 0.45f),
                        0.75f to Color.White.copy(alpha = 0.22f),
                        0.92f to Color.Transparent,
                    ),
                ),
            )
            Column(
                Modifier.fillMaxWidth(contentFraction).padding(Spacing.xl),
                verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                content = content,
            )
        }
        return
    }
    Column(
        frame
            .background(Brush.linearGradient(listOf(Color(0xFFE4EDFF), Color(0xFFE7F7EE), Color(0xFFFFF2DC))))
            .drawBehind {
                val r = size.minDimension * 0.9f
                val center = Offset(size.width * 0.96f, size.height * 0.04f)
                drawCircle(Brush.radialGradient(listOf(SolarOrange.copy(alpha = 0.34f), Color.Transparent), center = center, radius = r), radius = r, center = center)
            }
            .border(1.dp, Brush.verticalGradient(listOf(Color.White, Color.White.copy(alpha = 0.4f))), shape)
            .padding(Spacing.xl),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
        content = content,
    )
}
