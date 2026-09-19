package lk.smartsolar.microgrid

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OperatorFlowTest : AppTestBase() {

    @Test
    fun approveVerifyAndCompleteATransfer() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))

        signIn("200000000002", "Operator@123")
        waitForTag("approve_${res.number}")
        click("approve_${res.number}")
        waitForText("Reservation approved", substring = true)

        val token = TestApi.get(res.id, p.token).getString("qrToken")
        tab("scanner")
        waitForTag("token_input")
        rule.onNodeWithTag("token_input").performTextInput(token)
        click("verify_token")

        waitForTag("phase_valid")
        click("proceed_transfer")
        clickText("Confirm transfer")
        waitForTag("phase_completed")

        val server = TestApi.get(res.id, p.token)
        assertEquals(4, server.getInt("status"))
        assertEquals(2, server.getInt("transactionStatus"))
        waitForTag("view_receipt")
    }

    @Test
    fun invalidTokenIsRejected_andScanningCanRestart() {
        signIn("200000000002", "Operator@123")
        tab("scanner")
        waitForTag("token_input")
        rule.onNodeWithTag("token_input").performTextInput("not-a-real-token")
        click("verify_token")

        waitForTag("phase_invalid")
        waitForText("Invalid QR token.")
        click("scan_again")
        waitForTag("token_input")
    }

    @Test
    fun dashboardShowsNewReservationsWithoutReloading() {
        signIn("200000000002", "Operator@123")
        waitForTag("stat_pending")

        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))

        // The dashboard polls every 15 seconds.
        waitForTag("approve_${res.number}", timeoutMs = 40_000)
    }

    @Test
    fun completedTransferAppearsInTransactions() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))
        TestApi.approve(res.id)
        TestApi.completeViaApi(TestApi.get(res.id, p.token).getString("qrToken"), res.id)

        signIn("200000000002", "Operator@123")
        tab("transactions")
        waitForTag("tx_search")
        click("tx_recent")
        rule.onNodeWithTag("tx_search").performTextInput(res.number)
        waitForText(res.number)
        waitForText("Completed")
    }

    @Test
    fun operatorCanOpenAReservationAndSeeProsumerDetails() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))

        signIn("200000000002", "Operator@123")
        waitForText(res.number)
        clickText(res.number)
        waitForTag("reservation_number")
        rule.onNodeWithTag("reservation_number").assertTextContains(res.number)
        waitForText(p.nic)
        waitForTag("approve")
    }
}
