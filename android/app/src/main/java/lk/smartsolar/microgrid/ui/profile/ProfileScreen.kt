package lk.smartsolar.microgrid.ui.profile

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
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
import lk.smartsolar.microgrid.ui.common.SectionCard
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt

data class ProfileUi(
    val profile: ProfileDto? = null,
    val loading: Boolean = true,
    val saving: Boolean = false,
    val syncing: Boolean = false,
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
    val server by vm.serverUrl.collectAsState()
    val snackbar = LocalSnackbar.current
    var confirmLogout by remember { mutableStateOf(false) }
    var showServer by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(Unit) { vm.events.collect { snackbar.showSnackbar(it) } }

    Column {
        SunChainTopBar("Profile")
        Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ErrorBanner(ui.error, vm::load)

            SectionCard {
                DetailRow("NIC", session?.nic ?: "-")
                DetailRow("Role", if (session?.role == Session.ROLE_GRID_OPERATOR) "Grid Operator" else "Solar Prosumer")
            }

            ui.profile?.let { p ->
                var name by rememberSaveable(p.fullName) { mutableStateOf(p.fullName) }
                var email by rememberSaveable(p.email) { mutableStateOf(p.email) }
                var phone by rememberSaveable(p.phoneNumber) { mutableStateOf(p.phoneNumber) }
                var submitted by rememberSaveable { mutableStateOf(false) }
                val errors = mapOf("name" to AuthValidation.name(name), "email" to AuthValidation.email(email), "phone" to AuthValidation.phone(phone))
                fun err(k: String) = if (submitted) errors[k] else null

                SectionCard {
                    Text("Edit details", fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(name, { name = it }, label = { Text("Full name") }, isError = err("name") != null, supportingText = { err("name")?.let { Text(it) } }, singleLine = true, modifier = Modifier.fillMaxWidth().testTag("profile_name"))
                    OutlinedTextField(email, { email = it }, label = { Text("Email") }, isError = err("email") != null, supportingText = { err("email")?.let { Text(it) } }, singleLine = true, modifier = Modifier.fillMaxWidth().testTag("profile_email"))
                    OutlinedTextField(phone, { phone = it }, label = { Text("Phone number") }, isError = err("phone") != null, supportingText = { err("phone")?.let { Text(it) } }, singleLine = true, modifier = Modifier.fillMaxWidth().testTag("profile_phone"))
                    Button(
                        onClick = { submitted = true; if (errors.values.all { it == null }) vm.save(name, email, phone) },
                        enabled = !ui.saving,
                        modifier = Modifier.fillMaxWidth().testTag("save_profile"),
                    ) { Text(if (ui.saving) "Saving..." else "Save changes") }
                }
            }

            SectionCard {
                Text("Data", fontWeight = FontWeight.SemiBold)
                DetailRow("Last synced", if (lastSync > 0) Fmt.stamp(lastSync) else "Never")
                OutlinedButton(onClick = vm::syncNow, enabled = !ui.syncing, modifier = Modifier.fillMaxWidth().testTag("sync_now")) { Text(if (ui.syncing) "Syncing..." else "Sync now") }
            }

            NotificationsCard()

            SectionCard {
                Text("Server", fontWeight = FontWeight.SemiBold)
                Text(server, style = MaterialTheme.typography.bodySmall)
                OutlinedButton(onClick = { showServer = true }, modifier = Modifier.fillMaxWidth()) { Text("Change server address") }
            }

            Button(
                onClick = { confirmLogout = true },
                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                modifier = Modifier.fillMaxWidth().testTag("logout"),
            ) { Text("Log out") }
        }
    }

    if (confirmLogout) {
        ConfirmDialog("Log out?", "Saved data on this device is cleared when you sign out.", "Log out", destructive = true, onDismiss = { confirmLogout = false }, onConfirm = { confirmLogout = false; vm.logout() })
    }
    if (showServer) {
        var url by rememberSaveable { mutableStateOf(server) }
        AlertDialog(
            onDismissRequest = { showServer = false },
            title = { Text("Server address") },
            text = { OutlinedTextField(url, { url = it }, singleLine = true, modifier = Modifier.fillMaxWidth()) },
            confirmButton = { TextButton(onClick = { vm.setServerUrl(url); showServer = false; vm.load() }) { Text("Save") } },
            dismissButton = { TextButton(onClick = { showServer = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun NotificationsCard() {
    val container = LocalContainer.current
    var enabled by remember { mutableStateOf(container.notifier.canNotify()) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { enabled = it }
    SectionCard {
        Text("Notifications", fontWeight = FontWeight.SemiBold)
        Text(
            if (enabled) "On. You will be told when a reservation changes." else "Off. Allow notifications to hear about approvals and transfers.",
            style = MaterialTheme.typography.bodySmall,
        )
        if (!enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            OutlinedButton(onClick = { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) }, modifier = Modifier.fillMaxWidth().testTag("allow_notifications")) { Text("Allow notifications") }
        }
    }
}
