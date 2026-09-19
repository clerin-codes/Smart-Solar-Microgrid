import { useFetch } from '../../hooks/useFetch'
import { reservationService } from '../../services/reservationService'
import { ErrorMessage, Spinner } from '../Common/ui'
import PendingVerifications from './PendingVerifications'
import QuickActions from './QuickActions'
import TransactionStats from './TransactionStats'

const REFRESH_MS = 15000

export default function GridOperatorDashboard() {
  const { data, loading, error, reload, updatedAt } = useFetch(reservationService.getAll, [], { pollMs: REFRESH_MS })

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  return (
    <div className="space-y-8">
      <p className="text-xs text-gray-500" aria-live="polite">
        Live &middot; refreshes every {REFRESH_MS / 1000}s &middot; last updated {updatedAt?.toLocaleTimeString()}
      </p>
      <TransactionStats reservations={data} />
      <QuickActions />
      <PendingVerifications reservations={data} onChanged={reload} />
    </div>
  )
}
