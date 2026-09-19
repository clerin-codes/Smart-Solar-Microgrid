package lk.smartsolar.microgrid.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.Logo
import lk.smartsolar.microgrid.ui.common.containerViewModel

@Composable
private fun Field(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    error: String?,
    tag: String,
    modifier: Modifier = Modifier,
    keyboard: KeyboardType = KeyboardType.Text,
    password: Boolean = false,
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        isError = error != null,
        supportingText = { if (error != null) Text(error) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboard),
        visualTransformation = if (password && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        trailingIcon = {
            if (password) {
                IconButton(onClick = { visible = !visible }) {
                    Icon(if (visible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility, contentDescription = "Show password")
                }
            }
        },
        modifier = modifier.fillMaxWidth().testTag(tag),
    )
}

@Composable
fun LoginScreen(onRegister: () -> Unit) {
    val vm = containerViewModel { AuthViewModel(it.auth, it.sync, it.session) }
    val state by vm.state.collectAsState()
    val server by vm.serverUrl.collectAsState()
    var nic by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf(false) }
    var showServer by rememberSaveable { mutableStateOf(false) }

    Scaffold { padding ->
        Column(
            Modifier.padding(padding).verticalScroll(rememberScrollState()).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Logo(Modifier.width(240.dp).padding(top = 32.dp, bottom = 8.dp))
            Text("Sign in with your NIC and password", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            ErrorBanner(state.error)
            Field("NIC", nic, { nic = it; vm.clearError() }, if (submitted && nic.isBlank()) "NIC is required." else null, "nic")
            Field("Password", password, { password = it; vm.clearError() }, if (submitted && password.isBlank()) "Password is required." else null, "password", password = true)
            Button(
                onClick = {
                    submitted = true
                    if (nic.isNotBlank() && password.isNotBlank()) vm.login(nic, password)
                },
                enabled = !state.busy,
                modifier = Modifier.fillMaxWidth().height(50.dp).testTag("sign_in"),
            ) {
                if (state.busy) CircularProgressIndicator(Modifier.height(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary) else Text("Sign in")
            }
            TextButton(onClick = onRegister, modifier = Modifier.testTag("go_register")) { Text("Create a prosumer account") }
            TextButton(onClick = { showServer = true }) { Text("Server: $server", style = MaterialTheme.typography.labelSmall) }
        }
    }

    if (showServer) {
        var url by rememberSaveable { mutableStateOf(server) }
        AlertDialog(
            onDismissRequest = { showServer = false },
            title = { Text("Server address") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Use http://10.0.2.2:5130/api/ on the emulator, or your computer's Wi-Fi address on a phone.", style = MaterialTheme.typography.bodySmall)
                    OutlinedTextField(url, { url = it }, singleLine = true, modifier = Modifier.fillMaxWidth().testTag("server_url"))
                }
            },
            confirmButton = { TextButton(onClick = { vm.setServerUrl(url); showServer = false }) { Text("Save") } },
            dismissButton = { TextButton(onClick = { showServer = false }) { Text("Cancel") } },
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

    Scaffold { padding ->
        Column(
            Modifier.padding(padding).verticalScroll(rememberScrollState()).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Logo(Modifier.width(180.dp).align(Alignment.CenterHorizontally))
            Text("Create your prosumer account", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 8.dp))
            ErrorBanner(state.error)
            Field("NIC", nic, { nic = it; vm.clearError() }, err("nic"), "reg_nic")
            Field("Full name", name, { name = it }, err("name"), "reg_name")
            Field("Email", email, { email = it }, err("email"), "reg_email", keyboard = KeyboardType.Email)
            Field("Phone number", phone, { phone = it }, err("phone"), "reg_phone", keyboard = KeyboardType.Phone)
            Field("Password", password, { password = it }, err("password"), "reg_password", password = true)
            Field("Confirm password", confirm, { confirm = it }, err("confirm"), "reg_confirm", password = true)
            Button(
                onClick = {
                    submitted = true
                    if (errors.values.all { it == null }) vm.register(nic, name, email, phone, password)
                },
                enabled = !state.busy,
                modifier = Modifier.fillMaxWidth().height(50.dp).testTag("register"),
            ) {
                if (state.busy) CircularProgressIndicator(Modifier.height(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary) else Text("Create account")
            }
            TextButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text("I already have an account") }
        }
    }
}
