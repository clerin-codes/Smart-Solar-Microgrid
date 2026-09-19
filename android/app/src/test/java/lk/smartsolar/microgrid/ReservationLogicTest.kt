package lk.smartsolar.microgrid

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import lk.smartsolar.microgrid.ui.common.OperatorStats
import lk.smartsolar.microgrid.ui.common.TxFilter
import lk.smartsolar.microgrid.ui.common.ViewFilter
import lk.smartsolar.microgrid.ui.common.completedTransfers
import lk.smartsolar.microgrid.ui.common.filterReservations
import lk.smartsolar.microgrid.ui.common.operatorTransactions
import org.junit.Assert.assertEquals
import org.junit.Test

class ReservationLogicTest {
    private val names = mapOf("s1" to "Jaffna Solar Station", "s2" to "Malabe Solar Station")
    private val name = { id: String -> names[id] ?: "" }

    private val all = listOf(
        reservation(id = "a", number = "RES-A", status = 0),
        reservation(id = "b", number = "RES-B", status = 1),
        reservation(id = "c", number = "RES-C", status = 4, stationId = "s2"),
        reservation(id = "d", number = "RES-D", status = 3),
        reservation(id = "e", number = "RES-E", status = 2),
    )

    @Test
    fun activeView_excludesCompletedCancelledRejected() {
        assertEquals(listOf("a", "b"), filterReservations(all, ViewFilter.Active, "", name).map { it.id })
    }

    @Test
    fun historyView_onlyEndedReservations() {
        assertEquals(listOf("c", "d", "e"), filterReservations(all, ViewFilter.History, "", name).map { it.id })
    }

    @Test
    fun search_matchesNumberStationAndNic_caseInsensitive() {
        assertEquals(listOf("a"), filterReservations(all, ViewFilter.All, "res-a", name).map { it.id })
        assertEquals(listOf("c"), filterReservations(all, ViewFilter.All, "MALABE", name).map { it.id })
        assertEquals(5, filterReservations(all, ViewFilter.All, "200000000003", name).size)
        assertEquals(0, filterReservations(all, ViewFilter.All, "nothing", name).size)
    }

    @Test
    fun completedTransfers_limitsByDaysAndStation() {
        val today = LocalDate.parse("2026-09-20")
        val list = listOf(
            reservation(id = "old", status = 4, date = "2026-08-01", completedAt = "2026-08-01T10:00:00Z"),
            reservation(id = "recent", status = 4, date = "2026-09-18", completedAt = "2026-09-18T10:00:00Z"),
            reservation(id = "other", status = 4, date = "2026-09-19", stationId = "s2", completedAt = "2026-09-19T10:00:00Z"),
            reservation(id = "pending", status = 0, date = "2026-09-19"),
        )
        assertEquals(listOf("other", "recent", "old"), completedTransfers(list, null, null, today).map { it.id })
        assertEquals(listOf("other", "recent"), completedTransfers(list, 30, null, today).map { it.id })
        assertEquals(listOf("other"), completedTransfers(list, 30, "s2", today).map { it.id })
        assertEquals(listOf("other", "recent"), completedTransfers(list, 7, null, today).map { it.id })
    }

    private val now = Instant.parse("2026-09-20T12:00:00Z")
    private val tx = listOf(
        reservation(id = "none", status = 1, tx = 0),
        reservation(id = "verified", number = "RES-V", status = 1, tx = 1),
        reservation(id = "doneToday", number = "RES-D1", status = 4, tx = 2, completedAt = "2026-09-20T08:00:00Z"),
        reservation(id = "doneOld", number = "RES-D2", status = 4, tx = 2, completedAt = "2026-09-10T08:00:00Z"),
    )

    @Test
    fun operatorTransactions_excludesReservationsWithoutQrVerification() {
        val ids = operatorTransactions(tx, TxFilter.All, false, "", now, ZoneOffset.UTC).map { it.id }
        assertEquals(setOf("verified", "doneToday", "doneOld"), ids.toSet())
    }

    @Test
    fun operatorTransactions_statusFilter() {
        assertEquals(listOf("verified"), operatorTransactions(tx, TxFilter.Verified, false, "", now, ZoneOffset.UTC).map { it.id })
        assertEquals(listOf("doneToday", "doneOld"), operatorTransactions(tx, TxFilter.Completed, false, "", now, ZoneOffset.UTC).map { it.id })
    }

    @Test
    fun operatorTransactions_todayOnlyKeepsTodaysCompletions() {
        assertEquals(listOf("doneToday"), operatorTransactions(tx, TxFilter.All, true, "", now, ZoneOffset.UTC).map { it.id })
    }

    @Test
    fun operatorTransactions_searchByReservationId() {
        assertEquals(listOf("verified"), operatorTransactions(tx, TxFilter.All, false, "res-v", now, ZoneOffset.UTC).map { it.id })
    }

    @Test
    fun operatorStats_countsEachQueue() {
        val list = tx + reservation(id = "p", status = 0) + reservation(id = "p2", status = 0)
        val stats = OperatorStats.from(list, now, ZoneOffset.UTC)
        assertEquals(2, stats.pending)
        assertEquals(1, stats.awaitingScan)
        assertEquals(1, stats.verified)
        assertEquals(1, stats.completedToday)
    }
}
