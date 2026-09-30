package lk.smartsolar.microgrid.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import lk.smartsolar.microgrid.R

/**
 * Lato is the interface typeface. Google Fonts publishes it in Light, Regular, Bold and Black, so
 * Medium resolves to Regular and SemiBold to Bold.
 */
val Lato = FontFamily(
    Font(R.font.lato_light, FontWeight.Light),
    Font(R.font.lato_regular, FontWeight.Normal),
    Font(R.font.lato_bold, FontWeight.Medium),
    Font(R.font.lato_bold, FontWeight.SemiBold),
    Font(R.font.lato_bold, FontWeight.Bold),
    Font(R.font.lato_black, FontWeight.ExtraBold),
    Font(R.font.lato_black, FontWeight.Black),
)

/** Decorative script, used only for welcome lines and short brand quotes. */
val Sacramento = FontFamily(Font(R.font.sacramento_regular, FontWeight.Normal))

private fun lato(size: Int, line: Int, weight: FontWeight = FontWeight.Normal, tracking: Double = 0.0) =
    TextStyle(fontFamily = Lato, fontWeight = weight, fontSize = size.sp, lineHeight = line.sp, letterSpacing = tracking.sp)

val SunChainTypography = Typography(
    displayLarge = lato(44, 50, FontWeight.Black, -0.5),
    displayMedium = lato(36, 42, FontWeight.Black, -0.4),
    displaySmall = lato(30, 36, FontWeight.Bold, -0.3),
    headlineLarge = lato(30, 36, FontWeight.Bold, -0.3),
    headlineMedium = lato(26, 32, FontWeight.Bold, -0.2),
    headlineSmall = lato(22, 28, FontWeight.Bold),
    titleLarge = lato(20, 26, FontWeight.Bold),
    titleMedium = lato(17, 23, FontWeight.Bold),
    titleSmall = lato(15, 21, FontWeight.Bold),
    bodyLarge = lato(16, 24),
    bodyMedium = lato(14, 21),
    bodySmall = lato(12, 18),
    labelLarge = lato(15, 20, FontWeight.Bold, 0.1),
    labelMedium = lato(12, 16, FontWeight.Bold, 0.2),
    labelSmall = lato(11, 14, FontWeight.Bold, 0.3),
)

/** The one place Sacramento is used: a short quote or welcome line. */
val AccentQuoteStyle = TextStyle(fontFamily = Sacramento, fontSize = 24.sp, lineHeight = 28.sp)
