import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useStationLookup } from '../../hooks/useStationLookup'
import { reservationService } from '../../services/reservationService'
import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { errorMessage, formatDate, formatTime } from '../../utils/formatters'
import { Button, Card, EmptyState } from '../Common/ui'

function Row({ r, stationName, action }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to={`/reservations/${r.id}`} className="font-medium text-primary-700 hover:underline">
          {r.reservationNumber}
        </Link>
        <div className="text-sm text-gray-500">
          {r.prosumerNIC} &middot; {stationName} &middot; {formatDate(r.reservationDate)} &middot;{' '}
          {formatTime(r.startTime)} - {formatTime(r.endTime)}
        </div>
      </div>
      {action}
    </Card>
  )
}

function Section({ title, empty, children }) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {items.filter(Boolean).length === 0 ? <EmptyState title={empty} /> : <div className="space-y-3">{children}</div>}
    </section>
  )
}

// Work queue for the operator: reservations to approve, QR codes waiting to be scanned, transfers left to complete.
export default function PendingVerifications({ reservations, onChanged }) {
  const stations = useStationLookup()
  const [busyId, setBusyId] = useState(null)

  const status = (r) => enumName(RESERVATION_STATUS, r.status)
  const tx = (r) => enumName(TRANSACTION_STATUS, r.transactionStatus)
  const pending = reservations.filter((r) => status(r) === 'Pending')
  const awaitingScan = reservations.filter((r) => status(r) === 'Approved' && tx(r) === 'NotStarted')
  const verified = reservations.filter((r) => tx(r) === 'Verified' && status(r) !== 'Completed')

  const approve = async (id) => {
    setBusyId(id)
    try {
      await reservationService.approve(id)
      toast.success('Reservation approved. QR code generated.')
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <Section title="Awaiting approval" empty="Nothing waiting for approval">
        {pending.map((r) => (
          <Row
            key={r.id}
            r={r}
            stationName={stations.nameOf(r.stationId)}
            action={
              <Button onClick={() => approve(r.id)} disabled={busyId === r.id}>
                {busyId === r.id ? 'Approving...' : 'Approve'}
              </Button>
            }
          />
        ))}
      </Section>

      <Section title="Waiting for QR scan" empty="No approved reservations are waiting to be scanned">
        {awaitingScan.map((r) => (
          <Row key={r.id} r={r} stationName={stations.nameOf(r.stationId)} />
        ))}
      </Section>

      <Section title="Verified, transfer not completed" empty="No verified reservations are waiting for transfer">
        {verified.map((r) => (
          <Row
            key={r.id}
            r={r}
            stationName={stations.nameOf(r.stationId)}
            action={
              <Link to={`/reservations/${r.id}`} className="text-sm font-medium text-primary-700 hover:underline">
                Complete transfer &rarr;
              </Link>
            }
          />
        ))}
      </Section>
    </div>
  )
}
