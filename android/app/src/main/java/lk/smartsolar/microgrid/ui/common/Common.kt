package lk.smartsolar.microgrid.ui.common

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import lk.smartsolar.microgrid.AppContainer
import lk.smartsolar.microgrid.R
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.EmptyPanel
import lk.smartsolar.microgrid.ui.design.ErrorState
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.LoadingState
import lk.smartsolar.microgrid.ui.design.OfflineNotice
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SectionHeader
import lk.smartsolar.microgrid.ui.design.StatusPill
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary
import lk.smartsolar.microgrid.util.Fmt

val LocalContainer = compositionLocalOf<AppContainer> { error("AppContainer not provided") }

/** Snackbar host owned by the main scaffold, so any screen can show a short message. */
val LocalSnackbar = compositionLocalOf<androidx.compose.material3.SnackbarHostState> { error("SnackbarHostState not provided") }

/** Creates a ViewModel wired to the app container, scoped to the current navigation entry. */
@Composable
inline fun <reified VM : ViewModel> containerViewModel(key: String? = null, crossinline create: (AppContainer) -> VM): VM {
    val container = LocalContainer.current
    return viewModel(
        key = key,
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = create(container) as T
        },
    )
}

// The composables below keep their original names and signatures so every screen shares one look.

@Composable
fun SunChainTopBar(title: String, onBack: (() -> Unit)? = null) = ScreenHeader(title, onBack = onBack)

@Composable
fun Logo(modifier: Modifier = Modifier) {
    Image(painterResource(R.drawable.sunchain_app_logo), contentDescription = "SunChain", modifier = modifier, contentScale = ContentScale.Fit)
}

@Composable
fun LoadingBox(modifier: Modifier = Modifier) = LoadingState(modifier)

@Composable
fun ErrorBanner(message: String?, onRetry: (() -> Unit)? = null) = ErrorState(message, onRetry)

@Composable
fun EmptyState(
    title: String,
    hint: String? = null,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Rounded.Inbox,
    action: (@Composable () -> Unit)? = null,
) = EmptyPanel(title, modifier, hint, icon, action)

/** Shown while offline, with when the saved data was last refreshed. */
@Composable
fun OfflineBanner(online: Boolean, lastSync: Long) {
    if (online) return
    OfflineNotice(if (lastSync > 0) "Offline. Showing data saved ${Fmt.stamp(lastSync)}." else "Offline. No saved data yet.")
}

@Composable
fun StatusChip(status: String, modifier: Modifier = Modifier) = StatusPill(status, modifier)

@Composable
fun SectionCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) =
    GlassCard(modifier, verticalArrangement = Arrangement.spacedBy(Spacing.md), content = content)

@Composable
fun DetailRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = androidx.compose.ui.Alignment.Top) {
        Text(label, color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.size(Spacing.md))
        Text(value, Modifier.widthIn(max = 220.dp), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) = SectionHeader(text, modifier)

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    busy: Boolean = false,
    destructive: Boolean = false,
) {
    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        shape = Shapes.hero,
        containerColor = Color.White.copy(alpha = 0.98f),
        title = { Text(title, style = MaterialTheme.typography.titleLarge) },
        text = { Text(message, style = MaterialTheme.typography.bodyMedium, color = TextSecondary) },
        confirmButton = {
            SunChainButton(
                if (busy) "Working..." else confirmLabel, onConfirm,
                kind = if (destructive) ButtonKind.Danger else ButtonKind.Primary, enabled = !busy, compact = true,
            )
        },
        dismissButton = { SunChainButton("Go back", onDismiss, kind = ButtonKind.Secondary, enabled = !busy, compact = true) },
    )
}

@Composable
fun VSpace(dp: Int) = Spacer(Modifier.height(dp.dp))

/** The [Avatar] for the signed-in user: their uploaded picture if they have one, otherwise their initials. */
@Composable
fun SessionAvatar(name: String, modifier: Modifier = Modifier, size: androidx.compose.ui.unit.Dp = 44.dp) {
    val image by LocalContainer.current.session.profileImage.collectAsState()
    val picture by androidx.compose.runtime.produceState<androidx.compose.ui.graphics.ImageBitmap?>(null, image) {
        value = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
            lk.smartsolar.microgrid.util.ProfileImages.decodeBase64(image)?.asImageBitmap()
        }
    }
    lk.smartsolar.microgrid.ui.design.Avatar(name, modifier, size, picture)
}
