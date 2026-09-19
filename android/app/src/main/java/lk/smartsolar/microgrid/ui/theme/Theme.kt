package lk.smartsolar.microgrid.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Green = Color(0xFF16A34A)
val GreenLight = Color(0xFFDCFCE7)
val Blue = Color(0xFF1D4ED8)
val Amber = Color(0xFFF59E0B)
val Red = Color(0xFFDC2626)

private val Light = lightColorScheme(
    primary = Green,
    onPrimary = Color.White,
    primaryContainer = GreenLight,
    onPrimaryContainer = Color(0xFF14532D),
    secondary = Blue,
    onSecondary = Color.White,
    tertiary = Amber,
    background = Color(0xFFF9FAFB),
    surface = Color.White,
    surfaceVariant = Color(0xFFF3F4F6),
    error = Red,
)

private val Dark = darkColorScheme(
    primary = Color(0xFF4ADE80),
    onPrimary = Color(0xFF052E16),
    primaryContainer = Color(0xFF14532D),
    onPrimaryContainer = GreenLight,
    secondary = Color(0xFF93C5FD),
    tertiary = Amber,
    error = Color(0xFFF87171),
)

@Composable
fun SunChainTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, content = content)
}
