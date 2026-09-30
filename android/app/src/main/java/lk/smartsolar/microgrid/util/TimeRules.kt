package lk.smartsolar.microgrid.util

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneOffset
import lk.smartsolar.microgrid.data.ReservationStatus
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.statusEnum

/** Booking rules, mirroring what the API enforces (Sri Lanka time, 7-day window, 12-hour lock). */
object TimeRules {
    val SRI_LANKA: ZoneOffset = ZoneOffset.ofHoursMinutes(5, 30)
    const val LOCK_HOURS = 12
    const val WINDOW_DAYS = 7

    fun today(now: Instant = Instant.now()): LocalDate = now.atOffset(SRI_LANKA).toLocalDate()

    /** Today plus the next [WINDOW_DAYS] days, the range a reservation may fall in. */
    fun bookingWindow(now: Instant = Instant.now()): List<LocalDate> {
        val start = today(now)
        return (0..WINDOW_DAYS).map { start.plusDays(it.toLong()) }
    }

    fun startInstant(date: String, startTime: String): Instant =
        LocalDateTime.of(LocalDate.parse(date.take(10)), LocalTime.parse(startTime))
            .toInstant(SRI_LANKA)

    fun hoursUntilStart(date: String, startTime: String, now: Instant = Instant.now()): Double =
        (startInstant(date, startTime).toEpochMilli() - now.toEpochMilli()) / 3_600_000.0

    fun isLocked(r: ReservationEntity, now: Instant = Instant.now()): Boolean =
        hoursUntilStart(r.date, r.startTime, now) < LOCK_HOURS

    /** Only pending reservations can be moved to another slot. */
    fun canEdit(r: ReservationEntity, now: Instant = Instant.now()): Boolean =
        r.statusEnum == ReservationStatus.Pending && !isLocked(r, now)

    fun canCancel(r: ReservationEntity, now: Instant = Instant.now()): Boolean =
        (r.statusEnum == ReservationStatus.Pending || r.statusEnum == ReservationStatus.Approved) && !isLocked(r, now)
}
