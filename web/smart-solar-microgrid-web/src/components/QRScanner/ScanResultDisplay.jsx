import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { formatDate, formatTime } from '../../utils/formatters'
import { Button, Card, Detail, LinkButton, StatusBadge } from '../Common/ui'

// Reservation details for a verified QR, with the next action for the operator.
export default function ScanResultDisplay({ reservation: r, stationName, completed, onProceed, onRescan }) {
  return (
    <Card>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Reservation">{r.reservationNumber}</Detail>
        <Detail label="Prosumer NIC">{r.prosumerNIC}</Detail>
        <Detail label="Station">{stationName}</Detail>
        <Detail label="Date">{formatDate(r.reservationDate)}</Detail>
        <Detail label="Time">
          {formatTime(r.startTime)} - {formatTime(r.endTime)}
        </Detail>
        <Detail label="Status">
          <StatusBadge status={enumName(RESERVATION_STATUS, r.status)} />
        </Detail>
        <Detail label="Transaction">
          <StatusBadge status={enumName(TRANSACTION_STATUS, r.transactionStatus)} />
        </Detail>
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        {completed ? (
          <LinkButton to={`/transactions/${r.id}`} variant="info">
            View receipt
          </LinkButton>
        ) : (
          <Button onClick={onProceed}>Proceed to transfer</Button>
        )}
        <Button variant="secondary" onClick={onRescan}>
          {completed ? 'Scan another' : 'Rescan'}
        </Button>
      </div>
    </Card>
  )
}
