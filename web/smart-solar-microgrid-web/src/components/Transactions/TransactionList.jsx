import { useState } from 'react'
import { useTransactions } from '../../hooks/useTransactions'
import { TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { EmptyState, ErrorMessage, LinkButton, PageHeader, Spinner, inputClass } from '../Common/ui'
import TransactionTable from './TransactionTable'

// Latest transactions, filtered by status. TransactionHistory has search, dates and export.
export default function TransactionList() {
  const { transactions, capacityOf, nameOf, loading, error, reload } = useTransactions()
  const [status, setStatus] = useState('all')

  const rows = transactions
    .filter((r) => status === 'all' || enumName(TRANSACTION_STATUS, r.transactionStatus) === status)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Verified QR scans and completed energy transfers"
        actions={
          <LinkButton to="/transactions/history" variant="secondary">
            Search history
          </LinkButton>
        }
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} mb-4 max-w-40`}>
        <option value="all">Any status</option>
        <option value="Verified">Verified</option>
        <option value="Completed">Completed</option>
      </select>

      {loading && <Spinner />}
      <ErrorMessage message={error} onRetry={reload} />
      {!loading && !error && rows.length === 0 && (
        <EmptyState title="No transactions yet" hint="Transactions appear once a QR code has been verified." />
      )}
      {rows.length > 0 && <TransactionTable rows={rows} capacityOf={capacityOf} nameOf={nameOf} />}
    </>
  )
}
