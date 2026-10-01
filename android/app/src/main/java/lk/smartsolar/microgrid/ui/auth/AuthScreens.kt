package lk.smartsolar.microgrid.ui.auth

import android.widget.Toast
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Badge
import androidx.compose.material.icons.rounded.Cloud
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.R
import lk.smartsolar.microgrid.ui.design.ErrorState
import lk.smartsolar.microgrid.ui.common.Logo
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.ui.design.ButtonKind
import lk.smartsolar.microgrid.ui.design.GlassCard
import lk.smartsolar.microgrid.ui.design.SunChainButton
import lk.smartsolar.microgrid.ui.design.SunChainTextField
import lk.smartsolar.microgrid.ui.theme.AccentQuoteStyle
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.SolarOrange
import lk.smartsolar.microgrid.ui.theme.Spacing
import lk.smartsolar.microgrid.ui.theme.TextSecondary

/** Centered, scrollable frame shared by sign-in and registration. An optional [background] fills the screen behind it. */
@Composable
private fun AuthFrame(
    @androidx.annotation.DrawableRes background: Int? = null,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    Box(Modifier.fillMaxSize()) {
        if (background != null) {
            Image(painterResource(background), contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        }
        Box(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()) {
            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = Spacing.xxl, vertical = Spacing.xl),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                content = content,
            )
        }
    }
}

/** Brief branded launch screen: a sunrise-over-solar photo with the logo fading and settling into place. */
@Composable
fun SplashScreen() {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) { progress.animateTo(1f, tween(750, easing = FastOutSlowInEasing)) }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Image(
            painterResource(R.drawable.splash_background),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        // A soft white glow behind the logo keeps the wordmark and tagline readable on the bright sky.
        Box(
            Modifier.fillMaxSize().background(
                Brush.radialGradient(
                    0f to Color.White.copy(alpha = 0.78f),
                    0.6f to Color.White.copy(alpha = 0.6f),
                    1f to Color.Transparent,
                    center = Offset.Unspecified,
                    radius = 1000f,
                ),
            ),
        )
        Column(
            Modifier.graphicsLayer {
                alpha = progress.value
                val s = 0.88f + 0.12f * progress.value
                scaleX = s; scaleY = s
            },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Logo(Modifier.size(136.dp))
            Spacer(Modifier.height(Spacing.md))
            Text("Powering tomorrow, together.", style = AccentQuoteStyle, color = SolarOrange)
        }
    }
}

@Composable
fun LoginScreen(onRegister: () -> Unit) {
    val vm = containerViewModel { AuthViewModel(it.auth, it.sync, it.session) }
    val state by vm.state.collectAsState()
    val serverState by vm.serverState.collectAsState()
    val configuredServer by vm.baseUrl.collectAsState()
    val context = LocalContext.current
    var nic by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }
    var serverUrl by rememberSaveable { mutableStateOf(configuredServer) }
    var serverError by rememberSaveable { mutableStateOf<String?>(null) }
    var showServerDialog by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(serverState.message) {
        val message = serverState.message ?: return@LaunchedEffect
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        serverError = if (serverState.connected) null else message
        if (serverState.connected) {
            serverUrl = vm.baseUrl.value
            showServerDialog = false
        }
        vm.clearServerResult()
    }

    AuthFrame(background = R.drawable.login_background) {
        Logo(Modifier.size(104.dp))
        Spacer(Modifier.height(Spacing.xl))
        Text("Welcome back", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
        Text("Every sunrise powers a stronger grid.", style = AccentQuoteStyle, color = SolarOrange, textAlign = TextAlign.Center)
        Spacer(Modifier.height(Spacing.xl))

        ErrorState(state.error, modifier = Modifier.widthIn(max = 480.dp), horizontalInset = 0.dp)
        GlassCard(Modifier.widthIn(max = 480.dp), shape = Shapes.hero, contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.xl), verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
            Text("Sign in with your NIC and password", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            SunChainTextField(
                nic, { nic = it; vm.clearError() }, "NIC",
                Modifier.testTag("nic"),
                error = if (submitted && nic.isBlank()) "NIC is required." else null,
                leadingIcon = Icons.Rounded.Badge,
            )
            SunChainTextField(
                password, { password = it; vm.clearError() }, "Password",
                Modifier.testTag("password"),
                error = if (submitted && password.isBlank()) "Password is required." else null,
                password = true, leadingIcon = Icons.Rounded.Lock, imeAction = ImeAction.Done,
            )
            Spacer(Modifier.height(Spacing.xs))
            SunChainButton(
                "Sign in",
                onClick = {
                    submitted = true
                    if (nic.isNotBlank() && password.isNotBlank()) vm.login(nic, password)
                },
                modifier = Modifier.fillMaxWidth().testTag("sign_in"),
                loading = state.busy,
            )
        }
        Spacer(Modifier.height(Spacing.md))
        SunChainButton("Create a prosumer account", onRegister, Modifier.testTag("go_register"), kind = ButtonKind.Ghost)
        TextButton(
            onClick = {
                serverUrl = configuredServer
                serverError = null
                vm.clearServerResult()
                showServerDialog = true
            },
            modifier = Modifier.testTag("open_server_settings"),
        ) {
            Text("Connect server", style = MaterialTheme.typography.labelMedium)
        }
        Spacer(Modifier.height(Spacing.lg))
        Text(
            "Decentralized Solar Energy Trading Platform",
            style = MaterialTheme.typography.labelSmall, color = TextSecondary, textAlign = TextAlign.Center,
        )
    }

    if (showServerDialog) {
        AlertDialog(
            onDismissRequest = { showServerDialog = false },
            modifier = Modifier.testTag("server_settings_dialog"),
            icon = { androidx.compose.material3.Icon(Icons.Rounded.Cloud, contentDescription = null) },
            title = { Text("Connect server") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    Text(
                        "Enter the backend API address. It will be saved on this device.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    SunChainTextField(
                        serverUrl,
                        {
                            serverUrl = it
                            serverError = null
                        },
                        "Server URL",
                        Modifier.testTag("server_url"),
                        error = serverError,
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Done,
                        leadingIcon = Icons.Rounded.Cloud,
                        placeholder = "http://10.0.2.2:9339/api/",
                    )
                    Text(
                        "Emulator: 10.0.2.2:9339\nPhone: your computer's Wi-Fi IP:9339",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = { vm.configureServer(serverUrl) },
                    modifier = Modifier.testTag("save_server"),
                    enabled = !serverState.testing,
                ) { Text(if (serverState.testing) "Testing…" else "Save") }
            },
            dismissButton = {
                TextButton(onClick = { showServerDialog = false }) { Text("Cancel") }
            },
        )
    }
}

@Composable
fun RegisterScreen(onBack: () -> Unit) {
    val vm = containerViewModel { AuthViewModel(it.auth, it.sync, it.session) }
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    var nic by rememberSaveable { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirm by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }

    val localErrors = mapOf(
        "nic" to AuthValidation.nic(nic),
        "name" to AuthValidation.name(name),
        "email" to AuthValidation.email(email),
        "phone" to AuthValidation.phone(phone),
        "password" to AuthValidation.password(password),
        "confirm" to AuthValidation.confirm(password, confirm),
    )
    val serverKeys = mapOf(
        "nic" to "nic",
        "name" to "fullname",
        "email" to "email",
        "phone" to "phonenumber",
        "password" to "password",
    )
    fun err(key: String): String? {
        val serverError = serverKeys[key]?.let(state.fieldErrors::get)
        return serverError ?: if (submitted) localErrors[key] else null
    }

    LaunchedEffect(state.success) {
        val message = state.success ?: return@LaunchedEffect
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
        onBack()
    }

    AuthFrame {
        Spacer(Modifier.height(Spacing.lg))
        Logo(Modifier.size(88.dp))
        Spacer(Modifier.height(Spacing.lg))
        Text("Create your prosumer account", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Text("Join the network and trade clean energy.", style = AccentQuoteStyle, color = SolarOrange, textAlign = TextAlign.Center)
        Spacer(Modifier.height(Spacing.lg))

        ErrorState(state.error, modifier = Modifier.widthIn(max = 480.dp), horizontalInset = 0.dp)
        GlassCard(Modifier.widthIn(max = 480.dp), shape = Shapes.hero, contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.xl), verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
            SunChainTextField(nic, { nic = it; vm.clearFieldError("nic") }, "NIC", Modifier.testTag("reg_nic"), error = err("nic"), leadingIcon = Icons.Rounded.Badge)
            SunChainTextField(name, { name = it; vm.clearFieldError("fullname") }, "Full name", Modifier.testTag("reg_name"), error = err("name"), leadingIcon = Icons.Rounded.Person)
            SunChainTextField(email, { email = it; vm.clearFieldError("email") }, "Email", Modifier.testTag("reg_email"), error = err("email"), keyboardType = KeyboardType.Email, leadingIcon = Icons.Rounded.Email)
            SunChainTextField(phone, { phone = it; vm.clearFieldError("phonenumber") }, "Phone number", Modifier.testTag("reg_phone"), error = err("phone"), keyboardType = KeyboardType.Phone, leadingIcon = Icons.Rounded.Phone)
            SunChainTextField(password, { password = it; vm.clearFieldError("password") }, "Password", Modifier.testTag("reg_password"), error = err("password"), password = true, leadingIcon = Icons.Rounded.Lock)
            SunChainTextField(confirm, { confirm = it }, "Confirm password", Modifier.testTag("reg_confirm"), error = err("confirm"), password = true, leadingIcon = Icons.Rounded.Lock, imeAction = ImeAction.Done)
            Spacer(Modifier.height(Spacing.sm))
            SunChainButton(
                "Create account",
                onClick = {
                    submitted = true
                    if (localErrors.values.all { it == null }) vm.register(nic, name, email, phone, password)
                },
                modifier = Modifier.fillMaxWidth().testTag("register"),
                loading = state.busy,
            )
        }
        Spacer(Modifier.height(Spacing.md))
        SunChainButton("Already have an account? Sign in", onBack, kind = ButtonKind.Ghost)
        Spacer(Modifier.height(Spacing.lg))
    }
}
