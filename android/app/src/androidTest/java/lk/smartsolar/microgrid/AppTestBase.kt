package lk.smartsolar.microgrid

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.printToString
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestWatcher
import org.junit.runner.Description

/** Signs the app out and points it at the emulator's host machine before every test. */
abstract class AppTestBase {
    @get:Rule
    val rule: AndroidComposeTestRule<ActivityScenarioRule<MainActivity>, MainActivity> = createAndroidComposeRule<MainActivity>()

    /** On failure, logs the UI tree (tag EVIDENCE) so the failure can be read without re-running by hand. */
    @get:Rule
    val evidence: TestWatcher = object : TestWatcher() {
        override fun failed(e: Throwable?, description: Description) {
            runCatching {
                rule.onRoot().printToString(maxDepth = 40).lines().forEach { android.util.Log.e("EVIDENCE", "${description.methodName}: $it") }
            }
        }
    }

    protected val container: AppContainer
        get() = (InstrumentationRegistry.getInstrumentation().targetContext.applicationContext as SunChainApp).container

    @Before
    fun resetApp() {
        // A system permission dialog would cover the app and hide it from Compose, so grant up front.
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        listOf("android.permission.POST_NOTIFICATIONS", "android.permission.CAMERA").forEach {
            runCatching { instrumentation.uiAutomation.grantRuntimePermission(instrumentation.targetContext.packageName, it) }
        }
        container.session.setBaseUrl(TestApi.BASE)
        container.session.clear()
        runBlocking { withContext(Dispatchers.IO) { container.db.clearAllTables() } }
        rule.waitForIdle()
    }

    protected fun waitForTag(tag: String, timeoutMs: Long = 20_000) {
        rule.waitUntil(timeoutMs) { rule.onAllNodesWithTagSafe(tag) }
    }

    protected fun waitForText(text: String, timeoutMs: Long = 20_000, substring: Boolean = false) {
        rule.waitUntil(timeoutMs) {
            rule.onAllNodes(androidx.compose.ui.test.hasText(text, substring = substring)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun AndroidComposeTestRule<*, *>.onAllNodesWithTagSafe(tag: String) =
        onAllNodes(androidx.compose.ui.test.hasTestTag(tag)).fetchSemanticsNodes().isNotEmpty()

    protected fun tagStartsWith(prefix: String) =
        SemanticsMatcher("tag starts with $prefix") { it.config.getOrNull(SemanticsProperties.TestTag)?.startsWith(prefix) == true }

    /** Scrolls the node into view when it sits in a scrollable container; otherwise it is already reachable. */
    private fun SemanticsNodeInteraction.scrolledIntoView(): SemanticsNodeInteraction {
        runCatching { performScrollTo() }
        return this
    }

    protected fun type(tag: String, text: String) {
        rule.onNodeWithTag(tag).scrolledIntoView().performTextInput(text)
    }

    protected fun click(tag: String) {
        rule.onNodeWithTag(tag).scrolledIntoView().performClick()
    }

    protected fun clickText(text: String) {
        rule.onNodeWithText(text).performClick()
    }

    protected fun signIn(nic: String, password: String) {
        waitForTag("sign_in")
        type("nic", nic)
        type("password", password)
        click("sign_in")
    }

    protected fun tab(route: String) {
        waitForTag("tab_$route")
        click("tab_$route")
    }
}
