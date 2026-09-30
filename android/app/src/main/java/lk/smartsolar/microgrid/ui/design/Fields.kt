package lk.smartsolar.microgrid.ui.design

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldColors
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import lk.smartsolar.microgrid.ui.theme.ErrorRed
import lk.smartsolar.microgrid.ui.theme.Shapes
import lk.smartsolar.microgrid.ui.theme.SunChainBlue
import lk.smartsolar.microgrid.ui.theme.TextSecondary

@Composable
private fun fieldColors(): TextFieldColors = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = SunChainBlue,
    unfocusedBorderColor = Color(0xFFD3DBE8),
    errorBorderColor = ErrorRed,
    focusedContainerColor = Color.White.copy(alpha = 0.92f),
    unfocusedContainerColor = Color.White.copy(alpha = 0.70f),
    errorContainerColor = Color(0xFFFFF5F5),
    focusedLabelColor = SunChainBlue,
    unfocusedLabelColor = TextSecondary,
    errorLabelColor = ErrorRed,
    cursorColor = SunChainBlue,
    focusedLeadingIconColor = SunChainBlue,
    unfocusedLeadingIconColor = TextSecondary,
)

/** Rounded input with a floating label, brand focus ring, helper-text errors and an optional password toggle. */
@Composable
fun SunChainTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    error: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    password: Boolean = false,
    leadingIcon: ImageVector? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    placeholder: String? = null,
    textStyle: TextStyle = MaterialTheme.typography.bodyLarge,
    enabled: Boolean = true,
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        isError = error != null,
        supportingText = if (error != null) ({ Text(error) }) else null,
        singleLine = singleLine,
        minLines = minLines,
        enabled = enabled,
        textStyle = textStyle,
        shape = Shapes.medium,
        colors = fieldColors(),
        keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboardType, imeAction = imeAction),
        visualTransformation = if (password && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        leadingIcon = leadingIcon?.let { { Icon(it, contentDescription = null) } },
        trailingIcon = if (password) ({
            IconButton(onClick = { visible = !visible }) {
                Icon(if (visible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility, contentDescription = if (visible) "Hide password" else "Show password")
            }
        }) else null,
        modifier = modifier.fillMaxWidth(),
    )
}

/** Search box with a leading magnifier and a clear button once there is text. */
@Composable
fun SunChainSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = TextSecondary) },
        singleLine = true,
        shape = Shapes.medium,
        colors = fieldColors(),
        textStyle = MaterialTheme.typography.bodyLarge,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
        trailingIcon = if (value.isNotEmpty()) ({
            IconButton(onClick = { onValueChange("") }) { Icon(Icons.Rounded.Close, contentDescription = "Clear search") }
        }) else null,
        modifier = modifier.fillMaxWidth(),
    )
}
