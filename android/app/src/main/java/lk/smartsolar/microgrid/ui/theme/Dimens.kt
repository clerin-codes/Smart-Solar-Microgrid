package lk.smartsolar.microgrid.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp

/** Spacing scale. Screens use these instead of ad-hoc margins. */
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 20.dp
    val xxl = 24.dp
    val xxxl = 32.dp

    /** Horizontal gutter shared by every screen. */
    val screen = 20.dp
}

/** Corner radius scale. */
object Radius {
    val small = 10.dp
    val medium = 14.dp
    val large = 20.dp
    val hero = 24.dp
    val nav = 28.dp
}

object Shapes {
    val small = RoundedCornerShape(Radius.small)
    val medium = RoundedCornerShape(Radius.medium)
    val large = RoundedCornerShape(Radius.large)
    val hero = RoundedCornerShape(Radius.hero)
    val nav = RoundedCornerShape(Radius.nav)
    val pill = RoundedCornerShape(50)
}

object Sizes {
    val button = 52.dp
    val field = 56.dp
    val touch = 44.dp
}
