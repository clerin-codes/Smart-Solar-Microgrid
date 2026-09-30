package lk.smartsolar.microgrid.ui.design

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.annotation.DrawableRes
import androidx.compose.ui.res.painterResource
import androidx.compose.material.icons.Icons
import lk.smartsolar.microgrid.ui.theme.BorderSoft
import lk.smartsolar.microgrid.ui.theme.DarkNavy
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary

data class NavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon,
    /** Optional drawable used instead of the vector icons, tinted the same way. */
    @DrawableRes val iconRes: Int? = null,
)

/**
 * Floating pill navigation in the iOS style: a frosted white capsule with a soft shadow, sitting above
 * the gesture area. The selected item gets a tinted capsule behind a filled icon and a bold label.
 */
@Composable
fun GlassBottomNavigation(
    items: List<NavItem>,
    selectedRoute: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = Spacing.lg, vertical = Spacing.sm)) {
        Row(
            Modifier
                .fillMaxWidth()
                .shadow(18.dp, Shapes.nav, ambientColor = DarkNavy.copy(alpha = 0.10f), spotColor = SunChainBlue.copy(alpha = 0.22f))
                .clip(Shapes.nav)
                .background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.94f), Color.White.copy(alpha = 0.84f))))
                .border(1.dp, Brush.verticalGradient(listOf(Color.White, BorderSoft.copy(alpha = 0.7f))), Shapes.nav)
                .padding(horizontal = Spacing.xs, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEach { item ->
                NavButton(item, item.route == selectedRoute, { onSelect(item.route) }, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun NavButton(item: NavItem, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    val source = remember { MutableInteractionSource() }
    val capsule by animateColorAsState(if (selected) SunChainBlue.copy(alpha = 0.13f) else Color.Transparent, label = "navCapsule")
    val tint by animateColorAsState(if (selected) SunChainBlue else TextSecondary, label = "navTint")
    val capsuleWidth by animateDpAsState(if (selected) 60.dp else 36.dp, spring(stiffness = 500f), label = "navWidth")
    Column(
        modifier
            .testTag("tab_${item.route}")
            .height(58.dp)
            .pressScale(source, 0.92f)
            .selectable(selected, source, indication = null, role = Role.Tab, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(Modifier.width(capsuleWidth).height(32.dp).clip(Shapes.pill).background(capsule), contentAlignment = Alignment.Center) {
            if (item.iconRes != null) Icon(painterResource(item.iconRes), contentDescription = null, Modifier.size(24.dp), tint = tint)
            else Icon(if (selected) item.selectedIcon else item.icon, contentDescription = null, Modifier.size(24.dp), tint = tint)
        }
        Text(
            item.label,
            color = tint,
            fontSize = 10.5.sp,
            lineHeight = 13.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Clip,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 2.dp),
        )
    }
}

/** Large-title header used by every screen: optional back button, title, subtitle and trailing actions. */
@Composable
fun ScreenHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    Row(
        modifier.fillMaxWidth().padding(start = Spacing.screen, end = Spacing.screen, top = Spacing.md, bottom = Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        if (onBack != null) GlassIconButton(Icons.AutoMirrored.Rounded.ArrowBack, "Back", onBack)
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.headlineMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
        trailing?.invoke()
    }
}
