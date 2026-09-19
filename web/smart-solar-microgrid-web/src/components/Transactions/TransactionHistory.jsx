import { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { dateOnly, downloadCsv, formatTime } from '../../utils/formatters'
import { Button, EmptyState, ErrorMessage, LinkButton, PageHeader, Spinner, inputClass } from '../Common/ui'
import TransactionTable from './TransactionTable'

// Searchable transaction history with date filters and CSV export.
export default function TransactionHistory() {
  const { transactions, capacityOf, nameOf, loading, error, reload } = useTransactions()
  const [status, setStatus] = useState('Completed')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  const rows = transactions
    .filter((r) => {
      if (status !== 'all' && enumName(TRANSACTION_STATUS, r.transactionStatus) !== status) return false
      const d = dateOnly(r.reservationDate)
      if (from && d < from) return false
      if (to && d > to) return false
      return `${r.reservationNumber} ${r.prosumerNIC} ${nameOf(r.stationId)}`.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => (b.completedAt ?? b.updatedAt ?? '').localeCompare(a.completedAt ?? a.updatedAt ?? ''))

  const exportCsv = () =>
    downloadCsv('transaction-history.csv', [
      ['Reservation', 'Prosumer NIC', 'Station', 'Date', 'Start', 'End', 'Slot capacity (kW)', 'Status', 'Completed by', 'Completed at'],
      ...rows.map((r) => [
        r.reservationNumber,
        r.prosumerNIC,
        nameOf(r.stationId),
        dateOnly(r.reservationDate),
        formatTime(r.startTime),
        formatTime(r.endTime),
        capacityOf(r) ?? '',
        enumName(TRANSACTION_STATUS, r.transactionStatus),
        r.completedBy ?? '',
        r.completedAt ?? '',
      ]),
    ])

  return (
    <>
      <PageHeader
        title="Transaction History"
        subtitle="Search past energy transfers"
        actions={
          <>
            <LinkButton to="/transactions" variant="secondary">
              Back
            </LinkButton>
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-40`}>
          <option value="Completed">Completed</option>
          <option value="Verified">Verified</option>
          <option value="all">Any status</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} max-w-40`} aria-label="From date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputClass} max-w-40`} aria-label="To date" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reservation, NIC, station"
          className={`${inputClass} max-w-xs`}
        />
      </div>

      {loading && <Spinner />}
      <ErrorMessage message={error} onRetry={reload} />
      {!loading && !error && rows.length === 0 && <EmptyState title="No transactions match your search" />}
      {rows.length > 0 && <TransactionTable rows={rows} capacityOf={capacityOf} nameOf={nameOf} />}
    </>
  )
}
