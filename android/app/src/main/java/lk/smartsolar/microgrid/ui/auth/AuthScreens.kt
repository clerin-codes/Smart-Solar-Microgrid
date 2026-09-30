package lk.smartsolar.microgrid.ui.auth

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Badge
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Phone
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
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

/** Centered, scrollable frame shared by sign-in and registration. */
@Composable
private fun AuthFrame(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
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

/** Brief branded launch screen: the logo fades and settles into place. */
@Composable
fun SplashScreen() {
    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) { progress.animateTo(1f, tween(750, easing = FastOutSlowInEasing)) }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            Modifier.graphicsLayer {
                alpha = progress.value
                val s = 0.88f + 0.12f * progress.value
                scaleX = s; scaleY = s
            },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Logo(Modifier.widthIn(max = 280.dp).fillMaxWidth(0.72f))
            Spacer(Modifier.height(Spacing.md))
            Text("Powering tomorrow, together.", style = AccentQuoteStyle, color = SolarOrange)
        }
    }
}

@Composable
fun LoginScreen(onRegister: () -> Unit) {
    val vm = containerViewModel { AuthViewModel(it.auth, it.sync, it.session) }
    val state by vm.state.collectAsState()
    var nic by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }

    AuthFrame {
        Logo(Modifier.widthIn(max = 300.dp).fillMaxWidth(0.78f))
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
        Spacer(Modifier.height(Spacing.lg))
        Text(
            "Decentralized Solar Energy Trading Platform",
            style = MaterialTheme.typography.labelSmall, color = TextSecondary, textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun RegisterScreen(onBack: () -> Unit) {
    val vm = containerViewModel { AuthViewModel(it.auth, it.sync, it.session) }
    val state by vm.state.collectAsState()
    var nic by rememberSaveable { mutableStateOf("") }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var confirm by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }

    val errors = mapOf(
        "nic" to AuthValidation.nic(nic),
        "name" to AuthValidation.name(name),
        "email" to AuthValidation.email(email),
        "phone" to AuthValidation.phone(phone),
        "password" to AuthValidation.password(password),
        "confirm" to AuthValidation.confirm(password, confirm),
    )
    fun err(key: String) = if (submitted) errors[key] else null

    AuthFrame {
        Spacer(Modifier.height(Spacing.lg))
        Logo(Modifier.widthIn(max = 240.dp).fillMaxWidth(0.62f))
        Spacer(Modifier.height(Spacing.lg))
        Text("Create your prosumer account", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
        Text("Join the network and trade clean energy.", style = AccentQuoteStyle, color = SolarOrange, textAlign = TextAlign.Center)
        Spacer(Modifier.height(Spacing.lg))

        ErrorState(state.error, modifier = Modifier.widthIn(max = 480.dp), horizontalInset = 0.dp)
        GlassCard(Modifier.widthIn(max = 480.dp), shape = Shapes.hero, contentPadding = androidx.compose.foundation.layout.PaddingValues(Spacing.xl), verticalArrangement = Arrangement.spacedBy(Spacing.xs)) {
            SunChainTextField(nic, { nic = it; vm.clearError() }, "NIC", Modifier.testTag("reg_nic"), error = err("nic"), leadingIcon = Icons.Rounded.Badge)
            SunChainTextField(name, { name = it }, "Full name", Modifier.testTag("reg_name"), error = err("name"), leadingIcon = Icons.Rounded.Person)
            SunChainTextField(email, { email = it }, "Email", Modifier.testTag("reg_email"), error = err("email"), keyboardType = KeyboardType.Email, leadingIcon = Icons.Rounded.Email)
            SunChainTextField(phone, { phone = it }, "Phone number", Modifier.testTag("reg_phone"), error = err("phone"), keyboardType = KeyboardType.Phone, leadingIcon = Icons.Rounded.Phone)
            SunChainTextField(password, { password = it }, "Password", Modifier.testTag("reg_password"), error = err("password"), password = true, leadingIcon = Icons.Rounded.Lock)
            SunChainTextField(confirm, { confirm = it }, "Confirm password", Modifier.testTag("reg_confirm"), error = err("confirm"), password = true, leadingIcon = Icons.Rounded.Lock, imeAction = ImeAction.Done)
            Spacer(Modifier.height(Spacing.sm))
            SunChainButton(
                "Create account",
                onClick = {
                    submitted = true
                    if (errors.values.all { it == null }) vm.register(nic, name, email, phone, password)
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
