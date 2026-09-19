import { RESERVATION_STATUS, enumName } from './constants'
import { dateOnly } from './formatters'

const statusOf = (r) => enumName(RESERVATION_STATUS, r.status)

export const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const defaultRange = () => {
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const to = new Date()
  to.setDate(to.getDate() + 7)
  return { from: toIsoDate(from), to: toIsoDate(to) }
}

export const filterByRange = (reservations, from, to) =>
  reservations.filter((r) => {
    const d = dateOnly(r.reservationDate)
    return (!from || d >= from) && (!to || d <= to)
  })

export const countByStatus = (reservations) =>
  RESERVATION_STATUS.map((status) => ({
    status,
    count: reservations.filter((r) => statusOf(r) === status).length,
  }))

// One row per calendar day in [from, to] (capped at 92 days), with requested and completed counts.
export const perDay = (reservations, from, to) => {
  if (!from || !to || from > to) return []
  const rows = []
  const cursor = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  for (let i = 0; cursor <= end && i < 92; i += 1) {
    const day = toIsoDate(cursor)
    const dayRows = reservations.filter((r) => dateOnly(r.reservationDate) === day)
    rows.push({
      day,
      label: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
      requested: dayRows.length,
      completed: dayRows.filter((r) => statusOf(r) === 'Completed').length,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return rows
}

// Per-station totals. Capacity is the slot capacity (kW) of completed reservations.
export const perStation = (reservations, stationName, capacityOf) => {
  const byStation = new Map()
  for (const r of reservations) {
    const row = byStation.get(r.stationId) ?? {
      station: stationName(r.stationId),
      reservations: 0,
      completed: 0,
      capacityKw: 0,
    }
    row.reservations += 1
    if (statusOf(r) === 'Completed') {
      row.completed += 1
      row.capacityKw += capacityOf(r) ?? 0
    }
    byStation.set(r.stationId, row)
  }
  return [...byStation.values()].sort((a, b) => b.reservations - a.reservations)
}

export const summarise = (reservations, capacityOf) => {
  const completed = reservations.filter((r) => statusOf(r) === 'Completed')
  const cancelled = reservations.filter((r) => statusOf(r) === 'Cancelled')
  const pct = (n) => (reservations.length ? Math.round((n / reservations.length) * 100) : 0)
  return {
    total: reservations.length,
    completed: completed.length,
    completionRate: pct(completed.length),
    cancellationRate: pct(cancelled.length),
    capacityKw: completed.reduce((sum, r) => sum + (capacityOf(r) ?? 0), 0),
  }
}
