package lk.smartsolar.microgrid.ui.common

import java.time.Instant
import java.time.LocalDate
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.TxStatus
import lk.smartsolar.microgrid.data.isTransaction
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.statusEnum
import lk.smartsolar.microgrid.data.tx
import lk.smartsolar.microgrid.util.TimeRules

enum class ViewFilter(val label: String) { All("All"), Active("Active"), History("History") }

private val HISTORY = setOf(ReservationStatus.Completed, ReservationStatus.Cancelled, ReservationStatus.Rejected)

/** Filters for the reservation lists: active/history, free-text search over number, NIC and station. */
fun filterReservations(
    list: List<ReservationEntity>,
    view: ViewFilter,
    query: String,
    stationName: (String) -> String,
): List<ReservationEntity> = list.filter { r ->
    val inHistory = r.statusEnum in HISTORY
    val viewOk = when (view) {
        ViewFilter.All -> true
        ViewFilter.Active -> !inHistory
        ViewFilter.History -> inHistory
    }
    viewOk && (query.isBlank() || "${r.number} ${r.prosumerNic} ${stationName(r.stationId)}".contains(query.trim(), ignoreCase = true))
}

/** Prosumer history: completed transfers only, optionally limited to the last [days] days and one station. */
fun completedTransfers(
    list: List<ReservationEntity>,
    days: Int?,
    stationId: String?,
    today: LocalDate = TimeRules.today(),
): List<ReservationEntity> = list.filter { r ->
    r.statusEnum == ReservationStatus.Completed &&
        (stationId == null || r.stationId == stationId) &&
        (days == null || !LocalDate.parse(r.date).isBefore(today.minusDays(days.toLong())))
}.sortedByDescending { it.completedAt ?: it.createdAt }

enum class TxFilter(val label: String) { All("All"), Verified("Verified"), Completed("Completed") }

/** Operator transaction list: verified or completed reservations, filtered by status, day and free text. */
fun operatorTransactions(
    list: List<ReservationEntity>,
    filter: TxFilter,
    todayOnly: Boolean,
    query: String,
    now: Instant = Instant.now(),
    zone: java.time.ZoneId = java.time.ZoneId.systemDefault(),
): List<ReservationEntity> {
    val today = now.atZone(zone).toLocalDate()
    return list.filter { it.isTransaction }
        .filter {
            when (filter) {
                TxFilter.All -> true
                TxFilter.Verified -> it.tx == TxStatus.Verified && it.statusEnum != ReservationStatus.Completed
                TxFilter.Completed -> it.statusEnum == ReservationStatus.Completed
            }
        }
        .filter { !todayOnly || completedOrUpdatedToday(it, today, zone) }
        .filter { query.isBlank() || "${it.number} ${it.prosumerNic}".contains(query.trim(), ignoreCase = true) }
        .sortedByDescending { it.completedAt ?: it.createdAt }
}

private fun completedOrUpdatedToday(r: ReservationEntity, today: LocalDate, zone: java.time.ZoneId): Boolean {
    val stamp = r.completedAt ?: return false
    return runCatching { Instant.parse(stamp).atZone(zone).toLocalDate() == today }.getOrDefault(false)
}

data class OperatorStats(val pending: Int, val awaitingScan: Int, val verified: Int, val completedToday: Int) {
    companion object {
        fun from(list: List<ReservationEntity>, now: Instant = Instant.now(), zone: java.time.ZoneId = java.time.ZoneId.systemDefault()): OperatorStats {
            val today = now.atZone(zone).toLocalDate()
            return OperatorStats(
                pending = list.count { it.statusEnum == ReservationStatus.Pending },
                awaitingScan = list.count { it.statusEnum == ReservationStatus.Approved && it.tx == TxStatus.NotStarted },
                verified = list.count { it.tx == TxStatus.Verified && it.statusEnum != ReservationStatus.Completed },
                completedToday = list.count { it.statusEnum == ReservationStatus.Completed && completedOrUpdatedToday(it, today, zone) },
            )
        }
    }
}
