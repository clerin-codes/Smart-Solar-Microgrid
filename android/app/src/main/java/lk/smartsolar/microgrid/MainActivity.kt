package lk.smartsolar.microgrid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.nav.SunChainRoot
import lk.smartsolar.microgrid.ui.theme.SunChainTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as SunChainApp).container
        setContent {
            CompositionLocalProvider(LocalContainer provides container) {
                SunChainTheme {
                    Surface(color = MaterialTheme.colorScheme.background) { SunChainRoot() }
                }
            }
        }
    }
}
