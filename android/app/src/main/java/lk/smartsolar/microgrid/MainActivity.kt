package lk.smartsolar.microgrid

import android.content.pm.PackageManager
import android.os.Build
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.nav.SunChainRoot
import lk.smartsolar.microgrid.ui.theme.SunChainTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // The design is light-only, so keep dark system-bar icons even when the phone is in dark mode.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
        )
        requestLocalNetworkAccess()
        val container = (application as SunChainApp).container
        setContent {
            CompositionLocalProvider(LocalContainer provides container) {
                SunChainTheme {
                    Surface(color = MaterialTheme.colorScheme.background) { SunChainRoot() }
                }
            }
        }
    }

    /**
     * Android 17 (API 37) blocks apps from connecting to private addresses (the emulator's 10.0.2.2 host
     * alias, or a backend on the local Wi-Fi) until the user grants local network access; without it
     * connections time out. Older versions have no such permission.
     */
    private fun requestLocalNetworkAccess() {
        if (Build.VERSION.SDK_INT < 37) return
        if (ContextCompat.checkSelfPermission(this, LOCAL_NETWORK) == PackageManager.PERMISSION_GRANTED) return
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }.launch(LOCAL_NETWORK)
    }

    private companion object {
        const val LOCAL_NETWORK = "android.permission.ACCESS_LOCAL_NETWORK"
    }
}
