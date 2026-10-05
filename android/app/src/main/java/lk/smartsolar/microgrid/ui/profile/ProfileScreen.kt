package lk.smartsolar.microgrid.ui.profile

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.rounded.Warning
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
import lk.smartsolar.microgrid.ui.common.SessionAvatar
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
import lk.smartsolar.microgrid.ui.theme.Warning as WarningColor
import lk.smartsolar.microgrid.util.Fmt

/* =====================================================
   UI State
===================================================== */

/** UI state for the authenticated account/profile page. */
data class ProfileUi(
    val profile:
    ProfileDto? =
        null,

    val loading:
    Boolean =
        true,

    val saving:
    Boolean =
        false,

    val syncing:
    Boolean =
        false,

    val deactivationBusy:
    Boolean =
        false,

    val deactivationComplete:
    Boolean =
        false,

    val error:
    String? =
        null,
)

/* =====================================================
   ViewModel
===================================================== */

/**
 * Coordinates profile operations through AuthRepository.
 *
 * All lifecycle validation remains in the ASP.NET Core API.
 */
class ProfileViewModel(
    private val auth:
    AuthRepository,

    private val sync:
    SyncManager,
) : ViewModel() {

    private val _ui =
        MutableStateFlow(
            ProfileUi(),
        )

    val ui:
            StateFlow<ProfileUi> =
        _ui

    private val _events =
        MutableSharedFlow<String>(
            extraBufferCapacity =
                4,
        )

    val events:
            SharedFlow<String> =
        _events

    init {
        load()
    }

    /**
     * Loads the own profile.
     * The repository can return the SQLite cache when offline.
     */
    fun load() {

        viewModelScope.launch {

            _ui.update {
                it.copy(
                    loading =
                        true,

                    error =
                        null,
                )
            }

            try {

                _ui.update {
                    it.copy(
                        profile =
                            auth.profile(),

                        loading =
                            false,
                    )
                }

            } catch (
                error:
                AppException,
            ) {

                _ui.update {
                    it.copy(
                        loading =
                            false,

                        error =
                            error.message,
                    )
                }
            }
        }
    }

    /** Updates the current account's editable profile fields. */
    fun save(
        name: String,
        email: String,
        phone: String,
    ) {

        if (
            _ui.value.saving ||
            _ui.value.deactivationComplete
        ) {
            return
        }

        _ui.update {
            it.copy(
                saving =
                    true,
            )
        }

        viewModelScope.launch {

            try {

                val updated =
                    auth.updateProfile(
                        name,
                        email,
                        phone,
                    )

                _ui.update {
                    it.copy(
                        profile =
                            updated,

                        saving =
                            false,

                        error =
                            null,
                    )
                }

                _events.emit(
                    "Profile updated",
                )

            } catch (
                error:
                AppException,
            ) {

                _ui.update {
                    it.copy(
                        saving =
                            false,
                    )
                }

                _events.emit(
                    error.message
                        ?: "Could not update the profile.",
                )
            }
        }
    }

    /**
     * Requests Prosumer account deactivation.
     *
     * Backoffice remains responsible for finalizing and
     * later reactivating the account.
     */
    fun requestDeactivation() {

        if (
            _ui.value.deactivationBusy ||
            _ui.value.deactivationComplete
        ) {
            return
        }

        _ui.update {
            it.copy(
                deactivationBusy =
                    true,
            )
        }

        viewModelScope.launch {

            try {

                val response =
                    auth.requestDeactivation()

                _ui.update {
                    it.copy(
                        profile =
                            response.user,

                        deactivationBusy =
                            false,

                        deactivationComplete =
                            true,

                        error =
                            null,
                    )
                }

                _events.emit(
                    response.message,
                )

            } catch (
                error:
                AppException,
            ) {

                _ui.update {
                    it.copy(
                        deactivationBusy =
                            false,
                    )
                }

                _events.emit(
                    error.message
                        ?: "Could not request account deactivation.",
                )
            }
        }
    }

    /** Refreshes operational cached data. */
    fun syncNow() {

        if (
            _ui.value.syncing
        ) {
            return
        }

        _ui.update {
            it.copy(
                syncing =
                    true,
            )
        }

        viewModelScope.launch {

            val failure =
                sync.sync(
                    notify =
                        false,
                )

            _ui.update {
                it.copy(
                    syncing =
                        false,
                )
            }

            _events.emit(
                failure?.message
                    ?: "Up to date",
            )
        }
    }

    /** Clears authentication and local cached user data. */
    fun logout() {

        viewModelScope.launch {
            auth.logout()
        }
    }
}

/* =====================================================
   Screen
===================================================== */

@Composable
fun ProfileScreen() {

    val container =
        LocalContainer.current

    val session by
    container
        .session
        .session
        .collectAsState()

    val lastSync by
    container
        .session
        .lastSync
        .collectAsState()

    val vm =
        containerViewModel {
            ProfileViewModel(
                it.auth,
                it.sync,
            )
        }

    val ui by
    vm.ui
        .collectAsState()

    val snackbar =
        LocalSnackbar.current

    var confirmLogout by
    remember {
        mutableStateOf(
            false,
        )
    }

    var confirmDeactivation by
    remember {
        mutableStateOf(
            false,
        )
    }

    LaunchedEffect(
        Unit,
    ) {

        vm.events.collect {
            snackbar.showSnackbar(
                it,
            )
        }
    }

    val displayName =
        ui.profile?.fullName
            ?: session?.fullName
                .orEmpty()

    val roleLabel =
        if (
            session?.role ==
            Session.ROLE_GRID_OPERATOR
        ) {
            "Grid Operator"
        } else {
            "Solar Prosumer"
        }

    Column(
        Modifier.fillMaxSize(),
    ) {

        ScreenHeader(
            "Profile",
        )

        Column(
            Modifier
                .verticalScroll(
                    rememberScrollState(),
                )
                .padding(
                    horizontal =
                        Spacing.screen,
                )
                .padding(
                    bottom =
                        Spacing.lg,
                ),

            verticalArrangement =
                Arrangement.spacedBy(
                    Spacing.lg,
                ),
        ) {

            ErrorBanner(
                ui.error,
                vm::load,
            )

            /* ===========================================
               PROFILE HEADER
            ============================================ */

            HeroCard {

                Row(
                    verticalAlignment =
                        Alignment.CenterVertically,

                    horizontalArrangement =
                        Arrangement.spacedBy(
                            Spacing.lg,
                        ),
                ) {

                    SessionAvatar(
                        displayName,

                        size =
                            76.dp,
                    )

                    Column(
                        Modifier.weight(
                            1f,
                        ),

                        verticalArrangement =
                            Arrangement.spacedBy(
                                2.dp,
                            ),
                    ) {

                        Text(
                            displayName,

                            style =
                                MaterialTheme
                                    .typography
                                    .titleLarge,
                        )

                        Text(
                            roleLabel,

                            style =
                                MaterialTheme
                                    .typography
                                    .bodyMedium,

                            color =
                                SunChainBlue,
                        )

                        Text(
                            "NIC ${session?.nic ?: "-"}",

                            style =
                                MaterialTheme
                                    .typography
                                    .bodySmall,

                            color =
                                TextSecondary,
                        )

                        ui.profile
                            ?.status
                            ?.let {
                                    status ->

                                Text(
                                    status.replace(
                                        Regex(
                                            "([a-z])([A-Z])",
                                        ),

                                        "$1 $2",
                                    ),

                                    style =
                                        MaterialTheme
                                            .typography
                                            .bodySmall,

                                    color =
                                        if (
                                            ui.profile?.isActive ==
                                            true
                                        ) {
                                            EnergyGreen
                                        } else {
                                            WarningColor
                                        },
                                )
                            }
                    }
                }
            }

            /* ===========================================
               PERSONAL INFORMATION
            ============================================ */

            ui.profile?.let {
                    profile ->

                var name by
                rememberSaveable(
                    profile.fullName,
                ) {
                    mutableStateOf(
                        profile.fullName,
                    )
                }

                var email by
                rememberSaveable(
                    profile.email,
                ) {
                    mutableStateOf(
                        profile.email,
                    )
                }

                var phone by
                rememberSaveable(
                    profile.phoneNumber,
                ) {
                    mutableStateOf(
                        profile.phoneNumber,
                    )
                }

                var submitted by
                rememberSaveable {
                    mutableStateOf(
                        false,
                    )
                }

                val errors =
                    mapOf(
                        "name" to
                                AuthValidation.name(
                                    name,
                                ),

                        "email" to
                                AuthValidation.email(
                                    email,
                                ),

                        "phone" to
                                AuthValidation.phone(
                                    phone,
                                ),
                    )

                fun err(
                    key: String,
                ) =
                    if (
                        submitted
                    ) {
                        errors[key]
                    } else {
                        null
                    }

                GlassCard(
                    verticalArrangement =
                        Arrangement.spacedBy(
                            Spacing.xs,
                        ),
                ) {

                    Text(
                        "Personal information",

                        style =
                            MaterialTheme
                                .typography
                                .titleMedium,

                        modifier =
                            Modifier.padding(
                                bottom =
                                    Spacing.sm,
                            ),
                    )

                    SunChainTextField(
                        name,

                        {
                            name =
                                it
                        },

                        "Full name",

                        Modifier.testTag(
                            "profile_name",
                        ),

                        error =
                            err(
                                "name",
                            ),

                        leadingIcon =
                            Icons.Rounded.Person,
                    )

                    SunChainTextField(
                        email,

                        {
                            email =
                                it
                        },

                        "Email",

                        Modifier.testTag(
                            "profile_email",
                        ),

                        error =
                            err(
                                "email",
                            ),

                        keyboardType =
                            KeyboardType.Email,

                        leadingIcon =
                            Icons.Rounded.Email,
                    )

                    SunChainTextField(
                        phone,

                        {
                            phone =
                                it
                        },

                        "Phone number",

                        Modifier.testTag(
                            "profile_phone",
                        ),

                        error =
                            err(
                                "phone",
                            ),

                        keyboardType =
                            KeyboardType.Phone,

                        leadingIcon =
                            Icons.Rounded.Phone,
                    )

                    SunChainButton(
                        if (
                            ui.saving
                        ) {
                            "Saving..."
                        } else {
                            "Save changes"
                        },

                        onClick = {

                            submitted =
                                true

                            if (
                                errors
                                    .values
                                    .all {
                                        it ==
                                                null
                                    }
                            ) {

                                vm.save(
                                    name,
                                    email,
                                    phone,
                                )
                            }
                        },

                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .padding(
                                    top =
                                        Spacing.sm,
                                )
                                .testTag(
                                    "save_profile",
                                ),

                        enabled =
                            !ui.saving &&
                                    !ui.deactivationComplete,
                    )
                }
            }

            /* ===========================================
               LOCAL DATA
            ============================================ */

            GlassCard(
                verticalArrangement =
                    Arrangement.spacedBy(
                        Spacing.md,
                    ),
            ) {

                Row(
                    verticalAlignment =
                        Alignment.CenterVertically,

                    horizontalArrangement =
                        Arrangement.spacedBy(
                            Spacing.md,
                        ),
                ) {

                    IconBadge(
                        Icons.Rounded.Sync,
                        EnergyGreen,
                    )

                    Text(
                        "Data",

                        style =
                            MaterialTheme
                                .typography
                                .titleMedium,
                    )
                }

                DetailRow(
                    "Last synced",

                    if (
                        lastSync >
                        0
                    ) {
                        Fmt.stamp(
                            lastSync,
                        )
                    } else {
                        "Never"
                    },
                )

                SunChainButton(
                    if (
                        ui.syncing
                    ) {
                        "Syncing..."
                    } else {
                        "Sync now"
                    },

                    vm::syncNow,

                    Modifier
                        .fillMaxWidth()
                        .testTag(
                            "sync_now",
                        ),

                    kind =
                        ButtonKind.Secondary,

                    enabled =
                        !ui.syncing &&
                                !ui.deactivationComplete,
                )
            }

            NotificationsCard()

            /* ===========================================
               PROSUMER DEACTIVATION
            ============================================ */

            if (
                session?.isProsumer ==
                true
            ) {

                GlassCard(
                    verticalArrangement =
                        Arrangement.spacedBy(
                            Spacing.md,
                        ),
                ) {

                    Row(
                        verticalAlignment =
                            Alignment.CenterVertically,

                        horizontalArrangement =
                            Arrangement.spacedBy(
                                Spacing.md,
                            ),
                    ) {

                        IconBadge(
                            Icons.Rounded.Warning,
                            WarningColor,
                        )

                        Text(
                            "Account deactivation",

                            style =
                                MaterialTheme
                                    .typography
                                    .titleMedium,
                        )
                    }

                    if (
                        ui.deactivationComplete
                    ) {

                        Text(
                            "Your deactivation request was submitted. " +
                                    "Backoffice must finalize the account deactivation " +
                                    "before it can later be reactivated.",

                            style =
                                MaterialTheme
                                    .typography
                                    .bodyMedium,

                            color =
                                TextSecondary,
                        )

                        SunChainButton(
                            "Return to sign in",

                            vm::logout,

                            Modifier
                                .fillMaxWidth()
                                .testTag(
                                    "deactivation_sign_out",
                                ),

                            kind =
                                ButtonKind.Secondary,
                        )

                    } else {

                        Text(
                            "Request deactivation of your Solar Prosumer account. " +
                                    "Only Backoffice can finalize or later reactivate the account.",

                            style =
                                MaterialTheme
                                    .typography
                                    .bodyMedium,

                            color =
                                TextSecondary,
                        )

                        SunChainButton(
                            if (
                                ui.deactivationBusy
                            ) {
                                "Requesting..."
                            } else {
                                "Request deactivation"
                            },

                            onClick = {
                                confirmDeactivation =
                                    true
                            },

                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .testTag(
                                        "request_deactivation",
                                    ),

                            kind =
                                ButtonKind.Danger,

                            enabled =
                                !ui.deactivationBusy,
                        )
                    }
                }
            }

            /* ===========================================
               LOGOUT
            ============================================ */

            SunChainButton(
                "Log out",

                {
                    confirmLogout =
                        true
                },

                Modifier
                    .fillMaxWidth()
                    .testTag(
                        "logout",
                    ),

                kind =
                    ButtonKind.Danger,

                icon =
                    Icons.Rounded.Logout,
            )
        }
    }

    /* =================================================
       DEACTIVATION CONFIRMATION
    ================================================== */

    if (
        confirmDeactivation
    ) {

        ConfirmDialog(
            title =
                "Request account deactivation?",

            message =
                "Your Solar Prosumer account will be placed into the " +
                        "deactivation-request state. Backoffice must finalize the request.",

            confirmLabel =
                "Request deactivation",

            destructive =
                true,

            busy =
                ui.deactivationBusy,

            onDismiss = {

                if (
                    !ui.deactivationBusy
                ) {
                    confirmDeactivation =
                        false
                }
            },

            onConfirm = {

                confirmDeactivation =
                    false

                vm.requestDeactivation()
            },
        )
    }

    /* =================================================
       LOGOUT CONFIRMATION
    ================================================== */

    if (
        confirmLogout
    ) {

        ConfirmDialog(
            title =
                "Log out?",

            message =
                "Saved data on this device is cleared when you sign out.",

            confirmLabel =
                "Log out",

            destructive =
                true,

            onDismiss = {
                confirmLogout =
                    false
            },

            onConfirm = {

                confirmLogout =
                    false

                vm.logout()
            },
        )
    }
}

/* =====================================================
   Notification preferences
===================================================== */

@Composable
private fun NotificationsCard() {

    val container =
        LocalContainer.current

    var enabled by
    remember {
        mutableStateOf(
            container
                .notifier
                .canNotify(),
        )
    }

    val launcher =
        rememberLauncherForActivityResult(
            ActivityResultContracts
                .RequestPermission(),
        ) {

            enabled =
                it
        }

    GlassCard(
        verticalArrangement =
            Arrangement.spacedBy(
                Spacing.md,
            ),
    ) {

        Row(
            verticalAlignment =
                Alignment.CenterVertically,

            horizontalArrangement =
                Arrangement.spacedBy(
                    Spacing.md,
                ),
        ) {

            IconBadge(
                if (
                    enabled
                ) {
                    Icons.Rounded.Notifications
                } else {
                    Icons.Rounded.NotificationsOff
                },

                if (
                    enabled
                ) {
                    EnergyGreen
                } else {
                    WarningColor
                },
            )

            Text(
                "Notifications",

                style =
                    MaterialTheme
                        .typography
                        .titleMedium,
            )
        }

        Text(
            if (
                enabled
            ) {
                "On. You will be told when a reservation changes."
            } else {
                "Off. Allow notifications to hear about approvals and transfers."
            },

            style =
                MaterialTheme
                    .typography
                    .bodyMedium,

            color =
                TextSecondary,
        )

        if (
            !enabled &&
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.TIRAMISU
        ) {

            SunChainButton(
                "Allow notifications",

                {
                    launcher.launch(
                        Manifest.permission.POST_NOTIFICATIONS,
                    )
                },

                Modifier
                    .fillMaxWidth()
                    .testTag(
                        "allow_notifications",
                    ),

                kind =
                    ButtonKind.Secondary,
            )
        }
    }
}