package lk.smartsolar.microgrid

import java.time.Instant
import java.time.LocalDate
import lk.smartsolar.microgrid.util.TimeRules
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TimeRulesTest {
    // 09:00 in Sri Lanka (UTC+5:30) on 20 Sep is 03:30 UTC.
    private val startUtc = Instant.parse("2026-09-20T03:30:00Z")

    @Test
    fun hoursUntilStart_usesSriLankaTime() {
        val now = Instant.parse("2026-09-19T21:30:00Z")
        assertEquals(6.0, TimeRules.hoursUntilStart("2026-09-20", "09:00:00", now), 0.001)
    }

    @Test
    fun hoursUntilStart_ignoresTimePartOfDate() {
        val now = Instant.parse("2026-09-19T21:30:00Z")
        assertEquals(6.0, TimeRules.hoursUntilStart("2026-09-20T00:00:00Z", "09:00:00", now), 0.001)
    }

    @Test
    fun lock_exactlyTwelveHoursIsStillAllowed() {
        val r = reservation()
        assertFalse(TimeRules.isLocked(r, startUtc.minusSeconds(12 * 3600)))
    }

    @Test
    fun lock_justUnderTwelveHoursIsLocked() {
        val r = reservation()
        assertTrue(TimeRules.isLocked(r, startUtc.minusSeconds(12 * 3600 - 60)))
    }

    @Test
    fun canEdit_onlyPending() {
        val early = startUtc.minusSeconds(48 * 3600)
        assertTrue(TimeRules.canEdit(reservation(status = 0), early))
        assertFalse(TimeRules.canEdit(reservation(status = 1), early))
        assertFalse(TimeRules.canEdit(reservation(status = 4), early))
    }

    @Test
    fun canEdit_falseInsideLockWindow() {
        assertFalse(TimeRules.canEdit(reservation(status = 0), startUtc.minusSeconds(3 * 3600)))
    }

    @Test
    fun canCancel_pendingAndApprovedOnly() {
        val early = startUtc.minusSeconds(48 * 3600)
        assertTrue(TimeRules.canCancel(reservation(status = 0), early))
        assertTrue(TimeRules.canCancel(reservation(status = 1), early))
        assertFalse(TimeRules.canCancel(reservation(status = 2), early))
        assertFalse(TimeRules.canCancel(reservation(status = 3), early))
        assertFalse(TimeRules.canCancel(reservation(status = 4), early))
    }

    @Test
    fun today_isTheSriLankanDayNotTheUtcDay() {
        // 20:00 UTC on 19 Sep is already 01:30 on 20 Sep in Sri Lanka.
        assertEquals(LocalDate.parse("2026-09-20"), TimeRules.today(Instant.parse("2026-09-19T20:00:00Z")))
        assertEquals(LocalDate.parse("2026-09-19"), TimeRules.today(Instant.parse("2026-09-19T17:00:00Z")))
    }

    @Test
    fun bookingWindow_isTodayPlusSevenDays() {
        val window = TimeRules.bookingWindow(Instant.parse("2026-09-19T10:00:00Z"))
        assertEquals(8, window.size)
        assertEquals(LocalDate.parse("2026-09-19"), window.first())
        assertEquals(LocalDate.parse("2026-09-26"), window.last())
    }
}
