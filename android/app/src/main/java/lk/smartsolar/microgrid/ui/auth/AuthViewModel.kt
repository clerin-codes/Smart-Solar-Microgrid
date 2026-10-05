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

/** State shared by login and Prosumer registration. */
data class AuthUiState(
    val busy: Boolean = false,
    val error: String? = null,
    val registrationMessage: String? = null,
)

/**
 * Client-side validation mirrors the central API rules.
 *
 * These checks are for immediate UX feedback only.
 * The ASP.NET Core API remains authoritative.
 */
object AuthValidation {

    fun nic(
        value: String,
    ): String? {

        val normalized =
            value
                .trim()
                .uppercase()

        return when {

            normalized.isBlank() ->
                "NIC is required."

            !Regex(
                "^(?:\\d{12}|\\d{9}[VX])$",
            ).matches(
                normalized,
            ) ->
                "Enter a valid Sri Lankan NIC."

            else ->
                null
        }
    }

    fun name(
        value: String,
    ): String? {

        val normalized =
            value.trim()

        return when {

            normalized.isBlank() ->
                "Full name is required."

            normalized.length !in 2..100 ->
                "Full name must contain between 2 and 100 characters."

            !Regex(
                "^[\\p{L}][\\p{L}\\p{M}\\s.'-]*$",
            ).matches(
                normalized,
            ) ->
                "Enter a valid full name."

            else ->
                null
        }
    }

    fun email(
        value: String,
    ): String? =

        if (
            Regex(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            ).matches(
                value.trim(),
            )
        ) {
            null
        } else {
            "Enter a valid email address."
        }

    fun phone(
        value: String,
    ): String? =

        if (
            Regex(
                "^(?:\\+94|0)7\\d{8}$",
            ).matches(
                value.trim(),
            )
        ) {
            null
        } else {
            "Enter a valid Sri Lankan mobile number."
        }

    fun password(
        value: String,
    ): String? =

        when {

            value.length !in 12..128 ->
                "Password must contain between 12 and 128 characters."

            value !=
                    value.trim() ->
                "Password must not begin or end with spaces."

            value.any {
                it.isISOControl()
            } ->
                "Password must not contain control characters."

            value.none {
                it.isUpperCase()
            } ->
                "Password must contain at least one uppercase letter."

            value.none {
                it.isLowerCase()
            } ->
                "Password must contain at least one lowercase letter."

            value.none {
                it.isDigit()
            } ->
                "Password must contain at least one number."

            value.none {
                !it.isLetterOrDigit() &&
                        !it.isWhitespace()
            } ->
                "Password must contain at least one special character."

            else ->
                null
        }

    fun confirm(
        password: String,
        confirm: String,
    ): String? =

        if (
            password ==
            confirm
        ) {
            null
        } else {
            "Passwords do not match."
        }
}

/**
 * Coordinates authentication while keeping business
 * rules inside the central API.
 */
class AuthViewModel(
    private val auth:
    AuthRepository,

    private val sync:
    SyncManager,

    private val settings:
    SessionStore,
) : ViewModel() {

    private val _state =
        MutableStateFlow(
            AuthUiState(),
        )

    val state:
            StateFlow<AuthUiState> =
        _state

    val serverUrl:
            StateFlow<String> =
        settings.baseUrl

    fun setServerUrl(
        url: String,
    ) =
        settings.setBaseUrl(
            url,
        )

    fun clearError() =
        _state.update {
            it.copy(
                error =
                    null,
            )
        }

    /** Logs in and starts the correct role-based mobile session. */
    fun login(
        nic: String,
        password: String,
    ) {

        if (
            _state.value.busy
        ) {
            return
        }

        _state.value =
            AuthUiState(
                busy =
                    true,
            )

        viewModelScope.launch {

            try {

                auth.login(
                    nic,
                    password,
                )

                _state.value =
                    AuthUiState()

                // Refresh operational local data only after authentication succeeds.
                sync.sync(
                    notify =
                        false,
                )

            } catch (
                error:
                AppException,
            ) {

                _state.value =
                    AuthUiState(
                        error =
                            error.message,
                    )

            } catch (
                _: Exception,
            ) {

                _state.value =
                    AuthUiState(
                        error =
                            "Unable to sign in. Please try again.",
                    )
            }
        }
    }

    /**
     * Registers a Prosumer as PendingActivation.
     *
     * Registration does not create a login session.
     */
    fun register(
        nic: String,
        name: String,
        email: String,
        phone: String,
        password: String,
    ) {

        if (
            _state.value.busy
        ) {
            return
        }

        _state.value =
            AuthUiState(
                busy =
                    true,
            )

        viewModelScope.launch {

            try {

                val response =
                    auth.registerProsumer(
                        nic,
                        name,
                        email,
                        phone,
                        password,
                    )

                _state.value =
                    AuthUiState(
                        registrationMessage =
                            response.message,
                    )

            } catch (
                error:
                AppException,
            ) {

                _state.value =
                    AuthUiState(
                        error =
                            error.message,
                    )

            } catch (
                _: Exception,
            ) {

                _state.value =
                    AuthUiState(
                        error =
                            "Unable to create the account. Please try again.",
                    )
            }
        }
    }
}