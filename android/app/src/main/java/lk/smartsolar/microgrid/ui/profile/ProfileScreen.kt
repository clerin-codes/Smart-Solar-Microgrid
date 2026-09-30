package lk.smartsolar.microgrid.ui.profile

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import lk.smartsolar.microgrid.ui.common.SessionAvatar
import lk.smartsolar.microgrid.ui.theme.BorderSoft
import lk.smartsolar.microgrid.util.ProfileImages
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Logout
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.NotificationsOff
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material.icons.rounded.Sync
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.local.Session
import lk.smartsolar.microgrid.data.local.SessionStore
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.remote.ProfileDto
import lk.smartsolar.microgrid.data.repo.AuthRepository
import lk.smartsolar.microgrid.data.repo.SyncManager
import lk.smartsolar.microgrid.ui.auth.AuthValidation
import lk.smartsolar.microgrid.ui.common.ConfirmDialog
import lk.smartsolar.microgrid.ui.common.DetailRow
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.LocalSnackbar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.HeroCard
import lk.smartsolar.microgrid.ui.design.IconBadge
import lk.smartsolar.microgrid.ui.design.ScreenHeader
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.design.SunChainTextField
import lk.smartsolar.microgrid.ui.theme.EnergyGreen
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary
import lk.smartsolar.microgrid.ui.theme.Warning
import lk.smartsolar.microgrid.util.Fmt

data class ProfileUi(
    val profile: ProfileDto? = null,
    val loading: Boolean = true,
    val saving: Boolean = false,
    val syncing: Boolean = false,
    val photoBusy: Boolean = false,
    val error: String? = null,
)

class ProfileViewModel(
    private val auth: AuthRepository,
    private val sync: SyncManager,
    private val settings: SessionStore,
) : ViewModel() {
    private val _ui = MutableStateFlow(ProfileUi())
    val ui: StateFlow<ProfileUi> = _ui
    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val events: SharedFlow<String> = _events
    val serverUrl: StateFlow<String> = settings.baseUrl

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _ui.update { it.copy(loading = true, error = null) }
            try {
                _ui.update { it.copy(profile = auth.profile(), loading = false) }
            } catch (e: AppException) {
                _ui.update { it.copy(loading = false, error = e.message) }
            }
        }
    }

    fun save(name: String, email: String, phone: String) {
        if (_ui.value.saving) return
        _ui.update { it.copy(saving = true) }
        viewModelScope.launch {
            try {
                val updated = auth.updateProfile(name, email, phone)
                _ui.update { it.copy(profile = updated, saving = false, error = null) }
                _events.emit("Profile updated")
            } catch (e: AppException) {
                _ui.update { it.copy(saving = false) }
                _events.emit(e.message ?: "Could not update the profile.")
            }
        }
    }

    /** Shrinks the picked photo to a small square JPEG, then uploads it as base64 to be stored on the profile. */
    fun uploadPicked(context: android.content.Context, uri: android.net.Uri) {
        if (_ui.value.photoBusy) return
        _ui.update { it.copy(photoBusy = true) }
        viewModelScope.launch {
            try {
                val base64 = ProfileImages.toBase64(context.applicationContext, uri)
                val updated = auth.uploadProfileImage(base64)
                _ui.update { it.copy(profile = updated, photoBusy = false) }
                _events.emit("Profile photo updated")
            } catch (e: AppException) {
                _ui.update { it.copy(photoBusy = false) }
                _events.emit(e.message ?: "Could not upload the photo.")
            } catch (e: Exception) {
                _ui.update { it.copy(photoBusy = false) }
                _events.emit("That picture could not be read. Try a different photo.")
            }
        }
    }

    fun removePhoto() {
        if (_ui.value.photoBusy) return
        _ui.update { it.copy(photoBusy = true) }
        viewModelScope.launch {
            try {
                val updated = auth.removeProfileImage()
                _ui.update { it.copy(profile = updated, photoBusy = false) }
                _events.emit("Profile photo removed")
            } catch (e: AppException) {
                _ui.update { it.copy(photoBusy = false) }
                _events.emit(e.message ?: "Could not remove the photo.")
            }
        }
    }

    fun syncNow() {
        if (_ui.value.syncing) return
        _ui.update { it.copy(syncing = true) }
        viewModelScope.launch {
            val failure = sync.sync(notify = false)
            _ui.update { it.copy(syncing = false) }
            _events.emit(failure?.message ?: "Up to date")
        }
    }

    fun setServerUrl(url: String) = settings.setBaseUrl(url)

    fun logout() {
        viewModelScope.launch { auth.logout() }
    }
}

@Composable
fun ProfileScreen() {
    val container = LocalContainer.current
    val session by container.session.session.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { ProfileViewModel(it.auth, it.sync, it.session) }
    val ui by vm.ui.collectAsState()
    val snackbar = LocalSnackbar.current
    var confirmLogout by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { vm.events.collect { snackbar.showSnackbar(it) } }

    val displayName = ui.profile?.fullName ?: session?.fullName.orEmpty()
    val roleLabel = if (session?.role == Session.ROLE_GRID_OPERATOR) "Grid Operator" else "Solar Prosumer"
    val context = androidx.compose.ui.platform.LocalContext.current
    val hasPhoto by container.session.profileImage.collectAsState()
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) vm.uploadPicked(context, uri)
    }
    val pickPhoto = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }

    Column(Modifier.fillMaxSize()) {
        ScreenHeader("Profile")
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = Spacing.screen).padding(bottom = Spacing.lg),
            verticalArrangement = Arrangement.spacedBy(Spacing.lg),
        ) {
            ErrorBanner(ui.error, vm::load)

            HeroCard {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.lg)) {
                    Box(
                        Modifier
                            .size(76.dp)
                            .clickable(role = Role.Button, enabled = !ui.photoBusy) { pickPhoto() }
                            .semantics { contentDescription = "Change profile photo" }
                            .testTag("profile_photo"),
                    ) {
                        SessionAvatar(displayName, size = 76.dp)
                        Box(
                            Modifier.align(Alignment.BottomEnd).size(26.dp).clip(CircleShape).background(Color.White).border(1.dp, BorderSoft, CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (ui.photoBusy) CircularProgressIndicator(Modifier.size(14.dp), strokeWidth = 2.dp, color = SunChainBlue)
                            else Icon(Icons.Rounded.PhotoCamera, contentDescription = null, Modifier.size(16.dp), tint = SunChainBlue)
                        }
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(displayName, style = MaterialTheme.typography.titleLarge)
                        Text(roleLabel, style = MaterialTheme.typography.bodyMedium, color = SunChainBlue)
                        Text("NIC ${session?.nic ?: "-"}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    SunChainButton(
                        if (ui.photoBusy) "Uploading..." else if (hasPhoto != null) "Change" else "Add photo",
                        onClick = pickPhoto, modifier = Modifier.weight(1f).testTag("change_photo"),
                        kind = ButtonKind.Secondary, enabled = !ui.photoBusy, icon = Icons.Rounded.PhotoCamera, compact = true,
                    )
                    if (hasPhoto != null) {
                        SunChainButton(
                            "Remove", onClick = vm::removePhoto, modifier = Modifier.weight(1f).testTag("remove_photo"),
                            kind = ButtonKind.Ghost, enabled = !ui.photoBusy, icon = Icons.Rounded.Delete, compact = true,
                        )
                    }
                }
            }

            ui.profile?.let { p ->
                var name by rememberSaveable(p.fullName) { mutableStateOf(p.fullName) }
                var email by rememberSaveable(p.email) { mutableStateOf(p.email) }
                var phone by rememberSaveable(p.phoneNumber) { mutableStateOf(p.phoneNumber) }
                var submitted by rememberSaveable { mutableStateOf(false) }
                val errors = mapOf("name" to AuthValidation.name(name), "email" to AuthValidation.email(email), "phone" to AuthValidation.phone(phone))
                fun err(k: String) = if (submitted) errors[k] else null

                GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                    Text("Personal information", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = Spacing.sm))
                    SunChainTextField(name, { name = it }, "Full name", Modifier.testTag("profile_name"), error = err("name"), leadingIcon = Icons.Rounded.Person)
                    SunChainTextField(email, { email = it }, "Email", Modifier.testTag("profile_email"), error = err("email"), keyboardType = KeyboardType.Email, leadingIcon = Icons.Rounded.Email)
                    SunChainTextField(phone, { phone = it }, "Phone number", Modifier.testTag("profile_phone"), error = err("phone"), keyboardType = KeyboardType.Phone, leadingIcon = Icons.Rounded.Phone)
                    SunChainButton(
                        if (ui.saving) "Saving..." else "Save changes",
                        onClick = { submitted = true; if (errors.values.all { it == null }) vm.save(name, email, phone) },
                        modifier = Modifier.fillMaxWidth().padding(top = Spacing.sm).testTag("save_profile"),
                        enabled = !ui.saving,
                    )
                }
            }

            GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                    IconBadge(Icons.Rounded.Sync, EnergyGreen)
                    Text("Data", style = MaterialTheme.typography.titleMedium)
                }
                DetailRow("Last synced", if (lastSync > 0) Fmt.stamp(lastSync) else "Never")
                SunChainButton(
                    if (ui.syncing) "Syncing..." else "Sync now", vm::syncNow, Modifier.fillMaxWidth().testTag("sync_now"),
                    kind = ButtonKind.Secondary, enabled = !ui.syncing,
                )
            }

            NotificationsCard()

            SunChainButton("Log out", { confirmLogout = true }, Modifier.fillMaxWidth().testTag("logout"), kind = ButtonKind.Danger, icon = Icons.Rounded.Logout)
        }
    }

    if (confirmLogout) {
        ConfirmDialog("Log out?", "Saved data on this device is cleared when you sign out.", "Log out", destructive = true, onDismiss = { confirmLogout = false }, onConfirm = { confirmLogout = false; vm.logout() })
    }
}

@Composable
private fun NotificationsCard() {
    val container = LocalContainer.current
    var enabled by remember { mutableStateOf(container.notifier.canNotify()) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { enabled = it }
    GlassCard(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
            IconBadge(if (enabled) Icons.Rounded.Notifications else Icons.Rounded.NotificationsOff, if (enabled) EnergyGreen else Warning)
            Text("Notifications", style = MaterialTheme.typography.titleMedium)
        }
        Text(
            if (enabled) "On. You will be told when a reservation changes." else "Off. Allow notifications to hear about approvals and transfers.",
            style = MaterialTheme.typography.bodyMedium, color = TextSecondary,
        )
        if (!enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            SunChainButton(
                "Allow notifications", { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) },
                Modifier.fillMaxWidth().testTag("allow_notifications"), kind = ButtonKind.Secondary,
            )
        }
    }
}
