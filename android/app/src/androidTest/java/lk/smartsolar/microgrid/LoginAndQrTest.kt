package lk.smartsolar.microgrid

import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlinx.coroutines.runBlocking
import lk.smartsolar.microgrid.util.QrCodes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LoginAndQrTest : AppTestBase() {

    @Test
    fun wrongPasswordShowsServerMessage() {
        signIn("200000000003", "wrong-password")
        waitForText("Invalid NIC or password.")
    }

    @Test
    fun emptyFieldsAreValidatedBeforeCallingTheServer() {
        waitForTag("sign_in")
        click("sign_in")
        waitForText("NIC is required.")
        waitForText("Password is required.")
    }

    @Test
    fun adminAccountsAreSentToTheWebPortal() {
        signIn("200000000001", "Admin@123")
        waitForText("Admin accounts use the SunChain web portal", substring = true)
    }

    @Test
    fun unreachableServerGivesAClearMessage() {
        waitForTag("sign_in")
        container.session.setBaseUrl("http://10.0.2.2:1/api/")
        type("nic", "200000000003")
        type("password", "Prosumer@123")
        click("sign_in")
        waitForText("No connection to the server", substring = true)
    }

    @Test
    fun sessionSurvivesRecreation_andLogoutClearsIt() {
        val p = TestApi.registerProsumer()
        signIn(p.nic, p.password)
        waitForTag("greeting")

        rule.activityRule.scenario.recreate()
        waitForTag("greeting")

        tab("profile")
        waitForTag("logout")
        click("logout")
        rule.onAllNodesWithText("Log out").onLast().performClick()
        waitForTag("sign_in")
        assertNull(container.session.token)
    }

    @Test
    fun qrCode_roundTripsThroughTheDeviceScanner() {
        val token = "B8pMDGBUnzmFFTHFlwcSay2ITCXpCwqnpCukiJAp8uM="
        val decoded = runBlocking { QrCodes.decode(QrCodes.encode(token)) }
        assertEquals(token, decoded)
    }
}
