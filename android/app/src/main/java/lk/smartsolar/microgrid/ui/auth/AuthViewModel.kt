package lk.smartsolar.microgrid.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.local.SessionStore
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.AuthRepository
import lk.smartsolar.microgrid.data.repo.SyncManager
import java.net.URI

data class AuthUiState(val busy: Boolean = false, val error: String? = null)

/** Field checks shared by the register form and its tests. */
object AuthValidation {
    fun nic(value: String) = if (value.isBlank()) "NIC is required." else null
    fun name(value: String) = if (value.isBlank()) "Full name is required." else null
    fun email(value: String) =
        if (Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(value.trim())) null else "Enter a valid email address."
    fun phone(value: String) = if (Regex("^\\+?[0-9]{9,12}$").matches(value.trim())) null else "Enter a valid phone number."
    fun password(value: String) = if (value.length >= 8) null else "Password must be at least 8 characters."
    fun confirm(password: String, confirm: String) = if (password == confirm) null else "Passwords do not match."
}

class AuthViewModel(
    private val auth: AuthRepository,
    private val sync: SyncManager,
    private val session: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state
    val baseUrl: StateFlow<String> = session.baseUrl
    fun clearError() = _state.update { it.copy(error = null) }

    /** Validates, normalises, and persists the API root entered on the sign-in screen. */
    fun configureServer(value: String): String? {
        val entered = value.trim()
        if (entered.isEmpty()) return "Server URL is required."

        val withScheme = if (entered.startsWith("http://", true) || entered.startsWith("https://", true)) {
            entered
        } else {
            "http://$entered"
        }

        val uri = runCatching { URI(withScheme) }.getOrNull()
            ?: return "Enter a valid server URL."
        if (uri.scheme !in setOf("http", "https") || uri.host.isNullOrBlank()) {
            return "Use an HTTP or HTTPS server address."
        }

        var path = uri.path.orEmpty().trimEnd('/')
        if (path.isEmpty()) path = "/api"
        else if (!path.endsWith("/api", ignoreCase = true)) path += "/api"

        val normalised = runCatching {
            URI(uri.scheme.lowercase(), uri.userInfo, uri.host, uri.port, "$path/", null, null).toString()
        }.getOrNull() ?: return "Enter a valid server URL."

        session.setBaseUrl(normalised)
        return null
    }

    fun login(nic: String, password: String) = run { auth.login(nic, password) }

    fun register(nic: String, name: String, email: String, phone: String, password: String) =
        run { auth.register(nic, name, email, phone, password) }

    private fun run(block: suspend () -> Unit) {
        if (_state.value.busy) return
        _state.value = AuthUiState(busy = true)
        viewModelScope.launch {
            try {
                block()
                _state.value = AuthUiState()
                sync.sync(notify = false)
            } catch (e: AppException) {
                _state.value = AuthUiState(error = e.message)
            }
        }
    }
}
