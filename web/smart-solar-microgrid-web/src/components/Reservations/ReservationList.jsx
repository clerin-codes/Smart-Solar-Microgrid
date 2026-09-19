import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { useStationLookup } from '../../hooks/useStationLookup'
import { reservationService } from '../../services/reservationService'
import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { dateOnly, downloadCsv, formatDate, formatTime } from '../../utils/formatters'
import {
  Button,
  EmptyState,
  ErrorMessage,
  PageHeader,
  Pagination,
  Spinner,
  StatusBadge,
  Table,
  inputClass,
} from '../Common/ui'

const PAGE_SIZE = 10
const HISTORY = ['Completed', 'Cancelled', 'Rejected']

export default function ReservationList() {
  const { data, loading, error, reload } = useFetch(reservationService.getAll)
  const stations = useStationLookup()

  const [view, setView] = useState('all') // all | active | history
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => {
    return (data ?? [])
      .filter((r) => {
        const st = enumName(RESERVATION_STATUS, r.status)
        if (view === 'active' && HISTORY.includes(st)) return false
        if (view === 'history' && !HISTORY.includes(st)) return false
        if (status !== 'all' && st !== status) return false
        const d = dateOnly(r.reservationDate)
        if (from && d < from) return false
        if (to && d > to) return false
        const text = `${r.reservationNumber} ${r.prosumerNIC} ${stations.nameOf(r.stationId)}`.toLowerCase()
        return text.includes(search.toLowerCase())
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data, view, status, from, to, search, stations])

  const reset = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const exportCsv = () =>
    downloadCsv('reservations.csv', [
      ['Reservation', 'Prosumer NIC', 'Station', 'Date', 'Start', 'End', 'Status', 'Transaction'],
      ...rows.map((r) => [
        r.reservationNumber,
        r.prosumerNIC,
        stations.nameOf(r.stationId),
        dateOnly(r.reservationDate),
        formatTime(r.startTime),
        formatTime(r.endTime),
        enumName(RESERVATION_STATUS, r.status),
        enumName(TRANSACTION_STATUS, r.transactionStatus),
      ]),
    ])

  return (
    <>
      <PageHeader
        title="Reservations"
        subtitle="All reservations in the system"
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={view} onChange={reset(setView)} className={`${inputClass} max-w-40`}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="history">History</option>
        </select>
        <select value={status} onChange={reset(setStatus)} className={`${inputClass} max-w-40`}>
          <option value="all">Any status</option>
          {RESERVATION_STATUS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={reset(setFrom)} className={`${inputClass} max-w-40`} aria-label="From date" />
        <input type="date" value={to} onChange={reset(setTo)} className={`${inputClass} max-w-40`} aria-label="To date" />
        <input value={search} onChange={reset(setSearch)} placeholder="Search number, NIC, station" className={`${inputClass} max-w-xs`} />
      </div>

      {loading && <Spinner />}
      <ErrorMessage message={error || stations.error} onRetry={reload} />
      {data && rows.length === 0 && (
        <EmptyState
          title="No reservations found"
          hint="Adjust your filters."
        />
      )}
      {rows.length > 0 && (
        <>
          <Table headers={['Prosumer', 'Reservation', 'Station', 'Date', 'Time', 'Status', 'Transaction', '']}>
            {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.prosumerNIC}</td>
                <td className="px-4 py-3 font-medium">{r.reservationNumber}</td>
                <td className="px-4 py-3">{stations.nameOf(r.stationId)}</td>
                <td className="px-4 py-3">{formatDate(r.reservationDate)}</td>
                <td className="px-4 py-3">
                  {formatTime(r.startTime)} - {formatTime(r.endTime)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={enumName(RESERVATION_STATUS, r.status)} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={enumName(TRANSACTION_STATUS, r.transactionStatus)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/reservations/${r.id}`} className="font-medium text-primary-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
        </>
      )}
    </>
  )
}
