package lk.smartsolar.microgrid

import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Test
import org.junit.runner.RunWith

/** Walks the main screens of both roles and saves a screenshot of each (used for documentation and eyeballing). */
@RunWith(AndroidJUnit4::class)
class ScreenshotsTest : AppTestBase() {
    private fun shot(name: String) {
        rule.waitForIdle()
        Thread.sleep(600)
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val dir = File(instrumentation.targetContext.getExternalFilesDir(null), "shots").apply { mkdirs() }
        instrumentation.uiAutomation.takeScreenshot()?.let { bmp ->
            File(dir, "$name.png").outputStream().use { bmp.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
        }
    }

    @Test
    fun prosumerScreens() {
        val p = TestApi.registerProsumer()
        val pending = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))
        val approved = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 4))
        TestApi.approve(approved.id)
        val done = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 2))
        TestApi.approve(done.id)
        TestApi.completeViaApi(TestApi.get(done.id, p.token).getString("qrToken"), done.id)

        waitForTag("sign_in")
        shot("01-login")
        click("go_register")
        waitForTag("register")
        shot("02-register")
        rule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }
        signIn(p.nic, p.password)
        waitForTag("greeting")
        waitForText(pending.number)
        shot("03-home")

        tab("stations")
        waitForTag("station_SS-JFN-001")
        shot("04-stations")
        click("station_SS-JFN-001")
        waitForTag("open_maps")
        shot("05-station-detail")
        rule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }

        tab("reservations")
        waitForText(pending.number)
        shot("06-reservations")
        clickText(approved.number)
        waitForTag("qr_image")
        shot("07-reservation-qr")
        rule.activityRule.scenario.onActivity { it.onBackPressedDispatcher.onBackPressed() }

        tab("history")
        waitForText(done.number)
        shot("08-history")

        tab("profile")
        waitForTag("profile_name")
        shot("09-profile")
    }

    @Test
    fun operatorScreens() {
        val p = TestApi.registerProsumer()
        TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))
        val done = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 2))
        TestApi.approve(done.id)
        val token = TestApi.get(done.id, p.token).getString("qrToken")

        signIn("200000000002", "Operator@123")
        waitForTag("stat_pending")
        Thread.sleep(1500)
        shot("10-operator-dashboard")

        tab("scanner")
        waitForTag("token_input")
        shot("11-scanner")
        rule.onNodeWithTag("token_input").performTextInput(token)
        click("verify_token")
        waitForTag("phase_valid")
        shot("12-verified")
        click("proceed_transfer")
        Thread.sleep(500)
        shot("13-confirm-dialog")
        clickText("Confirm transfer")
        waitForTag("phase_completed")
        shot("14-completed")

        tab("transactions")
        waitForTag("tx_search")
        click("tx_recent")
        waitForText(done.number)
        shot("15-transactions")
    }
}
