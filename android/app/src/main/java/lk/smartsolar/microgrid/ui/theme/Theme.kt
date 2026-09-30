package lk.smartsolar.microgrid.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SunChainColors = lightColorScheme(
    primary = SunChainBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE3ECFF),
    onPrimaryContainer = Color(0xFF082C80),
    secondary = SolarOrange,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFEFD0),
    onSecondaryContainer = Color(0xFF6B3F00),
    tertiary = Warning,
    tertiaryContainer = Color(0xFFFEF3C7),
    background = SoftBackground,
    onBackground = TextPrimary,
    surface = Color.White,
    onSurface = TextPrimary,
    surfaceVariant = Color(0xFFEEF2F8),
    onSurfaceVariant = TextSecondary,
    outline = BorderSoft,
    outlineVariant = Color(0xFFEDF1F7),
    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFFFEE7E7),
    onErrorContainer = Color(0xFF7A1212),
    scrim = DarkNavy,
)

/**
 * SunChain is designed as a single light theme: the glass surfaces and brand gradients are tuned
 * for a light background, so the app does not switch with the system dark mode.
 */
@Composable
fun SunChainTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = SunChainColors,
        typography = SunChainTypography,
        shapes = androidx.compose.material3.Shapes(
            extraSmall = Shapes.small,
            small = Shapes.small,
            medium = Shapes.medium,
            large = Shapes.large,
            extraLarge = Shapes.hero,
        ),
        content = content,
    )
}
