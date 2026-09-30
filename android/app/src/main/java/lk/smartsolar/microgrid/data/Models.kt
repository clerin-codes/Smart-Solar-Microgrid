package lk.smartsolar.microgrid.data

import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.SlotEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.ReservationDto
import lk.smartsolar.microgrid.data.remote.SlotDto
import lk.smartsolar.microgrid.data.remote.StationDto
import lk.smartsolar.microgrid.util.TimeRules

/** The API serialises enums as their numeric value. */
enum class ReservationStatus { Pending, Approved, Rejected, Cancelled, Completed;

    companion object {
        fun from(value: Int) = entries.getOrElse(value) { Pending }
    }
}

enum class SlotStatus { Available, Full, Closed;

    companion object {
        fun from(value: Int) = entries.getOrElse(value) { Closed }
    }
}

enum class TxStatus { NotStarted, Verified, Completed;

    companion object {
        fun from(value: Int) = entries.getOrElse(value) { NotStarted }
    }
}

val ReservationEntity.statusEnum get() = ReservationStatus.from(status)
val ReservationEntity.tx get() = TxStatus.from(transactionStatus)
val SlotEntity.statusEnum get() = SlotStatus.from(status)

/** A slot can be booked when it is open and has capacity left. */
val SlotEntity.isBookable get() = statusEnum == SlotStatus.Available && availableKw > 0

data class ScheduleItem(val day: String, val opening: String, val closing: String, val available: Boolean)

/** A reservation whose QR has been verified or whose transfer is complete. */
val ReservationEntity.isTransaction get() = tx != TxStatus.NotStarted

/**
 * The Sri Lanka calendar day of an API timestamp. The server may send "2026-09-20T00:00:00Z" (slots) or
 * "2026-09-19T18:30:00Z" (a reservation stored at Sri Lanka midnight); both mean 20 September.
 */
fun dayOf(value: String): String =
    runCatching { java.time.Instant.parse(value).atOffset(TimeRules.SRI_LANKA).toLocalDate().toString() }
        .getOrElse { value.take(10) }

fun StationDto.toEntity() = StationEntity(
    id = id,
    code = stationCode,
    name = stationName,
    latitude = latitude,
    longitude = longitude,
    capacityKw = capacityKw,
    batterySlots = batteryStorageSlots,
    availableSlots = availableSlots,
    isActive = isActive,
    schedule = encodeSchedule(schedules.orEmpty().map { ScheduleItem(it.day, it.openingTime, it.closingTime, it.isAvailable) }),
)

fun SlotDto.toEntity() = SlotEntity(
    id = id,
    stationId = stationId,
    date = dayOf(slotDate),
    startTime = startTime,
    endTime = endTime,
    capacityKw = capacityKw,
    availableKw = availableCapacityKw,
    status = status,
)

fun ReservationDto.toEntity() = ReservationEntity(
    id = id,
    number = reservationNumber,
    prosumerNic = prosumerNIC,
    stationId = stationId,
    slotId = slotId,
    date = dayOf(reservationDate),
    startTime = startTime,
    endTime = endTime,
    status = status,
    qrToken = qrToken,
    transactionStatus = transactionStatus,
    approvedBy = approvedBy,
    completedBy = completedBy,
    completedAt = completedAt,
    createdAt = createdAt,
)

fun encodeSchedule(items: List<ScheduleItem>): String =
    items.joinToString(";") { "${it.day}|${it.opening}|${it.closing}|${if (it.available) 1 else 0}" }

fun decodeSchedule(value: String): List<ScheduleItem> =
    value.split(";").filter { it.isNotBlank() }.mapNotNull {
        val p = it.split("|")
        if (p.size == 4) ScheduleItem(p[0], p[1], p[2], p[3] == "1") else null
    }
