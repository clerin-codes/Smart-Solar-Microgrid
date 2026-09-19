import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { Stat } from '../Common/ui'

export default function TransactionStats({ reservations }) {
  const status = (r) => enumName(RESERVATION_STATUS, r.status)
  const tx = (r) => enumName(TRANSACTION_STATUS, r.transactionStatus)
  const today = new Date().toDateString()

  const completed = reservations.filter((r) => status(r) === 'Completed')
  const completedToday = completed.filter((r) => r.completedAt && new Date(r.completedAt).toDateString() === today)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Stat label="Pending approval" value={reservations.filter((r) => status(r) === 'Pending').length} tone="text-yellow-600" />
      <Stat
        label="Awaiting QR scan"
        value={reservations.filter((r) => status(r) === 'Approved' && tx(r) === 'NotStarted').length}
        tone="text-blue-600"
        to="/qr-scanner"
      />
      <Stat
        label="Verified, not transferred"
        value={reservations.filter((r) => tx(r) === 'Verified' && status(r) !== 'Completed').length}
        to="/transactions"
      />
      <Stat label="Completed today" value={completedToday.length} tone="text-green-600" to="/transactions/history" />
      <Stat label="Completed in total" value={completed.length} to="/transactions/history" />
    </div>
  )
}
