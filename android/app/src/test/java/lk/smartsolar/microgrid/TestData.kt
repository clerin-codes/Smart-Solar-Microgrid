package lk.smartsolar.microgrid

import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.SlotEntity
import lk.smartsolar.microgrid.data.local.StationEntity

fun reservation(
    id: String = "r1",
    number: String = "RES-1",
    nic: String = "200000000003",
    stationId: String = "s1",
    slotId: String = "slot1",
    date: String = "2026-09-20",
    start: String = "09:00:00",
    end: String = "10:00:00",
    status: Int = 0,
    tx: Int = 0,
    qr: String? = null,
    completedAt: String? = null,
    createdAt: String = "2026-09-19T10:00:00Z",
) = ReservationEntity(
    id = id, number = number, prosumerNic = nic, stationId = stationId, slotId = slotId,
    date = date, startTime = start, endTime = end, status = status, qrToken = qr,
    transactionStatus = tx, approvedBy = null, completedBy = null, completedAt = completedAt, createdAt = createdAt,
)

fun station(id: String = "s1", name: String = "Jaffna Solar Station", code: String = "SS-JFN-001", active: Boolean = true) = StationEntity(
    id = id, code = code, name = name, latitude = 9.66, longitude = 80.02, capacityKw = 100.0,
    batterySlots = 10, availableSlots = 10, isActive = active, schedule = "",
)

fun slot(id: String = "slot1", status: Int = 0, available: Double = 20.0) = SlotEntity(
    id = id, stationId = "s1", date = "2026-09-20", startTime = "09:00:00", endTime = "10:00:00",
    capacityKw = 20.0, availableKw = available, status = status,
)
