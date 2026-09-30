package lk.smartsolar.microgrid

import lk.smartsolar.microgrid.notifications.ChangeDetector
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChangeDetectorTest {
    private fun before(vararg r: lk.smartsolar.microgrid.data.local.ReservationEntity) = r.associateBy { it.id }

    @Test
    fun prosumer_toldWhenApproved() {
        val notices = ChangeDetector.changes(before(reservation(status = 0)), listOf(reservation(status = 1)), isProsumer = true)
        assertEquals(1, notices.size)
        assertEquals("Reservation approved", notices.single().title)
    }

    @Test
    fun prosumer_toldWhenQrVerified() {
        val notices = ChangeDetector.changes(before(reservation(status = 1, tx = 0)), listOf(reservation(status = 1, tx = 1)), isProsumer = true)
        assertEquals("QR code verified", notices.single().title)
    }

    @Test
    fun prosumer_toldWhenCompleted() {
        val notices = ChangeDetector.changes(before(reservation(status = 1, tx = 1)), listOf(reservation(status = 4, tx = 2)), isProsumer = true)
        assertEquals(listOf("Energy transfer complete"), notices.map { it.title })
    }

    @Test
    fun prosumer_toldWhenRejected() {
        val notices = ChangeDetector.changes(before(reservation(status = 0)), listOf(reservation(status = 2)), isProsumer = true)
        assertEquals("Reservation rejected", notices.single().title)
    }

    @Test
    fun prosumer_noNoticeWhenNothingChanged_orForCancellingOwnReservation() {
        assertTrue(ChangeDetector.changes(before(reservation(status = 1)), listOf(reservation(status = 1)), true).isEmpty())
        assertTrue(ChangeDetector.changes(before(reservation(status = 0)), listOf(reservation(status = 3)), true).isEmpty())
    }

    @Test
    fun prosumer_noNoticeForReservationsSeenForTheFirstTime() {
        assertTrue(ChangeDetector.changes(emptyMap(), listOf(reservation(status = 1)), isProsumer = true).isEmpty())
    }

    @Test
    fun operator_toldAboutNewPendingReservations() {
        val notices = ChangeDetector.changes(
            before(reservation(id = "old", status = 1)),
            listOf(reservation(id = "old", status = 1), reservation(id = "new", number = "RES-NEW", status = 0)),
            isProsumer = false,
        )
        assertEquals(1, notices.size)
        assertEquals("new", notices.single().reservationId)
    }

    @Test
    fun operator_notToldAboutExistingReservationsChangingState() {
        val notices = ChangeDetector.changes(before(reservation(status = 0)), listOf(reservation(status = 1)), isProsumer = false)
        assertTrue(notices.isEmpty())
    }
}
