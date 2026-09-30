package lk.smartsolar.microgrid

import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import kotlin.random.Random
import lk.smartsolar.microgrid.util.Fmt
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ProsumerFlowTest : AppTestBase() {

    @Test
    fun registerThenBookASlot_reservationIsPending() {
        val slot = TestApi.createSlot(daysAhead = 2)
        val nic = "77" + (1..10).joinToString("") { Random.nextInt(10).toString() }

        waitForTag("go_register")
        click("go_register")
        type("reg_nic", nic)
        type("reg_name", "Nimal Perera")
        type("reg_email", "nimal@test.lk")
        type("reg_phone", "0771234567")
        type("reg_password", "Tester@1234")
        type("reg_confirm", "Tester@1234")
        click("register")

        waitForTag("greeting")
        rule.onNodeWithTag("greeting").assertTextContains("Nimal Perera", substring = true)

        tab("stations")
        waitForTag("station_SS-JFN-001")
        click("station_SS-JFN-001")
        waitForTag("reserve_${slot.id}")
        click("reserve_${slot.id}")
        waitForTag("review")
        click("review")
        clickText("Reserve")

        waitForTag("reservation_number")
        waitForTag("tracking")
        rule.onNodeWithTag("tracking").assertTextContains("Waiting for a Grid Operator", substring = true)
        waitForText("Pending")
    }

    @Test
    fun registrationRejectsBadInput() {
        waitForTag("go_register")
        click("go_register")
        waitForTag("register")
        click("register")
        waitForText("NIC is required.")
        waitForText("Full name is required.")
        waitForText("Enter a valid email address.")
        waitForText("Password must be at least 8 characters.")
    }

    @Test
    fun approvedReservationShowsQrCodeAndVerificationTracking() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))
        TestApi.approve(res.id)
        val token = TestApi.get(res.id, p.token).getString("qrToken")

        signIn(p.nic, p.password)
        tab("reservations")
        waitForText(res.number)
        clickText(res.number)

        waitForTag("qr_image")
        rule.onNodeWithTag("qr_token").assertTextEquals(token)
        rule.onNodeWithTag("tracking").assertTextContains("Show your QR code", substring = true)
        waitForTag("save_qr")
        waitForTag("share_qr")
    }

    @Test
    fun cancelReservation() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 4))

        signIn(p.nic, p.password)
        tab("reservations")
        waitForText(res.number)
        clickText(res.number)
        waitForTag("cancel")
        click("cancel")
        clickText("Cancel reservation")

        waitForText("Reservation cancelled")
        waitForText("Cancelled")
        assertEquals(3, TestApi.get(res.id, p.token).getInt("status"))
    }

    @Test
    fun editReservation_movesItToAnotherSlot() {
        val p = TestApi.registerProsumer()
        val slotA = TestApi.createSlot(daysAhead = 3)
        val slotB = TestApi.createSlot(daysAhead = 3)
        val res = TestApi.createReservation(p.token, slotA)

        signIn(p.nic, p.password)
        tab("reservations")
        waitForText(res.number)
        clickText(res.number)
        waitForTag("edit")
        click("edit")

        waitForTag("slot_${slotB.id}")
        click("slot_${slotB.id}")
        click("review")
        clickText("Save")

        waitForText(Fmt.range(slotB.start, slotB.end))
        assertEquals(slotB.id, TestApi.get(res.id, p.token).getString("slotId"))
    }

    @Test
    fun profile_canBeUpdated() {
        val p = TestApi.registerProsumer()
        signIn(p.nic, p.password)
        tab("profile")
        waitForTag("profile_name")
        rule.onNodeWithTag("profile_name").performTextReplacement("Updated Name")
        click("save_profile")
        waitForText("Profile updated")
    }

    @Test
    fun history_listsCompletedTransfers() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))
        TestApi.approve(res.id)
        val token = TestApi.get(res.id, p.token).getString("qrToken")
        TestApi.completeViaApi(token, res.id)

        signIn(p.nic, p.password)
        tab("history")
        waitForText(res.number)
        waitForText("1 completed transfer", substring = true)
    }

    @Test
    fun offline_cachedReservationsStayVisible() {
        val p = TestApi.registerProsumer()
        val res = TestApi.createReservation(p.token, TestApi.createSlot(daysAhead = 3))

        signIn(p.nic, p.password)
        tab("reservations")
        waitForText(res.number)

        // Lose the server: the next refresh fails, but the saved copy must still be shown.
        container.session.setBaseUrl("http://10.0.2.2:1/api/")
        tab("profile")
        waitForTag("sync_now")
        click("sync_now")
        waitForText("No connection", substring = true)

        tab("reservations")
        waitForText(res.number)
        container.session.setBaseUrl(TestApi.BASE)
    }
}
