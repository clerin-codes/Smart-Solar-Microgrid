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

data class AuthUiState(
    val busy: Boolean = false,
    val error: String? = null,
    val fieldErrors: Map<String, String> = emptyMap(),
    val success: String? = null,
)

data class ServerConnectionState(
    val testing: Boolean = false,
    val message: String? = null,
    val connected: Boolean = false,
)

/** Field checks shared by the register form and its tests. */
object AuthValidation {
    fun nic(value: String): String? {
        val nic = value.trim()
        return when {
            nic.isEmpty() -> "NIC is required."
            !Regex("^(?:\\d{12}|\\d{9}[vVxX])$").matches(nic) -> "Use 12 digits or the old 9-digit format followed by V/X."
            else -> null
        }
    }

    fun name(value: String): String? {
        val name = value.trim()
        return when {
            name.isEmpty() -> "Full name is required."
            name.length !in 2..100 -> "Full name must contain between 2 and 100 characters."
            !Regex("^[\\p{L}][\\p{L}\\p{M}\\s.'-]*$").matches(name) -> "Use letters, spaces, apostrophes, periods or hyphens only."
            else -> null
        }
    }

    fun email(value: String): String? {
        val email = value.trim()
        return when {
            email.isEmpty() -> "Email address is required."
            email.length > 254 || !Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(email) -> "Enter a valid email address."
            else -> null
        }
    }

    fun phone(value: String) = if (Regex("^(?:\\+94|0)7\\d{8}$").matches(value.trim())) null
        else "Use a Sri Lankan mobile number such as 0771234567 or +94771234567."

    fun password(value: String): String? {
        val failures = buildList {
            if (value.length !in 12..128) add("12-128 characters")
            if (value.none(Char::isUpperCase)) add("an uppercase letter")
            if (value.none(Char::isLowerCase)) add("a lowercase letter")
            if (value.none(Char::isDigit)) add("a number")
            if (value.none { !it.isLetterOrDigit() && !it.isWhitespace() }) add("a special character")
            if (value != value.trim()) add("no leading or trailing spaces")
            if (value.any(Char::isISOControl)) add("no control characters")
        }
        return failures.takeIf { it.isNotEmpty() }?.joinToString(prefix = "Password needs ", postfix = ".")
    }
    fun confirm(password: String, confirm: String) = if (password == confirm) null else "Passwords do not match."
}

class AuthViewModel(
    private val auth: AuthRepository,
    private val sync: SyncManager,
    private val session: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state
    private val _serverState = MutableStateFlow(ServerConnectionState())
    val serverState: StateFlow<ServerConnectionState> = _serverState
    val baseUrl: StateFlow<String> = session.baseUrl
    fun clearError() = _state.update { it.copy(error = null) }
    fun clearFieldError(field: String) = _state.update {
        it.copy(error = null, fieldErrors = it.fieldErrors - field)
    }
    fun clearServerResult() { _serverState.value = ServerConnectionState() }

    /** Validates and tests an API root, persisting it only after a healthy response. */
    fun configureServer(value: String) {
        if (_serverState.value.testing) return
        val normalised = normaliseServerUrl(value) ?: return

        _serverState.value = ServerConnectionState(testing = true)
        viewModelScope.launch {
            try {
                auth.testServer(normalised)
                session.setBaseUrl(normalised)
                _serverState.value = ServerConnectionState(
                    message = "Server connected successfully.",
                    connected = true,
                )
            } catch (e: AppException) {
                _serverState.value = ServerConnectionState(
                    message = e.message ?: "Could not connect to the server.",
                )
            }
        }
    }

    private fun normaliseServerUrl(value: String): String? {
        val entered = value.trim()
        if (entered.isEmpty()) return serverError("Server URL is required.")

        val withScheme = if (entered.startsWith("http://", true) || entered.startsWith("https://", true)) {
            entered
        } else {
            "http://$entered"
        }

        val uri = runCatching { URI(withScheme) }.getOrNull()
            ?: return serverError("Enter a valid server URL.")
        if (uri.scheme !in setOf("http", "https") || uri.host.isNullOrBlank()) {
            return serverError("Use an HTTP or HTTPS server address.")
        }

        var path = uri.path.orEmpty().trimEnd('/')
        if (path.isEmpty()) path = "/api"
        else if (!path.endsWith("/api", ignoreCase = true)) path += "/api"

        return runCatching {
            URI(uri.scheme.lowercase(), uri.userInfo, uri.host, uri.port, "$path/", null, null).toString()
        }.getOrNull() ?: serverError("Enter a valid server URL.")
    }

    private fun serverError(message: String): String? {
        _serverState.value = ServerConnectionState(message = message)
        return null
    }

    fun login(nic: String, password: String) = run { auth.login(nic, password) }

    fun register(nic: String, name: String, email: String, phone: String, password: String) {
        if (_state.value.busy) return
        _state.value = AuthUiState(busy = true)
        viewModelScope.launch {
            try {
                val message = auth.register(nic, name, email, phone, password)
                _state.value = AuthUiState(success = message)
            } catch (e: AppException) {
                _state.value = AuthUiState(
                    error = e.message,
                    fieldErrors = e.fieldErrors,
                )
            }
        }
    }

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
