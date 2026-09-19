import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { useStationLookup } from '../../hooks/useStationLookup'
import { reservationService } from '../../services/reservationService'
import { RESERVATION_STATUS, ROLES, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { errorMessage, formatDate, formatDateTime, formatTime } from '../../utils/formatters'
import ConfirmDialog from '../Common/ConfirmDialog'
import { Button, Card, Detail, ErrorMessage, LinkButton, PageHeader, Spinner, StatusBadge } from '../Common/ui'

export function ReservationTimeline({ reservation }) {
  const status = enumName(RESERVATION_STATUS, reservation.status)
  const tx = enumName(TRANSACTION_STATUS, reservation.transactionStatus)
  const ended = status === 'Cancelled' || status === 'Rejected'

  const steps = [
    { label: 'Requested', done: true, at: reservation.createdAt },
    { label: 'Approved', done: ['Approved', 'Completed'].includes(status) || tx !== 'NotStarted', at: reservation.qrGeneratedAt },
    { label: 'QR verified', done: tx === 'Verified' || tx === 'Completed' },
    { label: 'Energy transferred', done: status === 'Completed', at: reservation.completedAt },
  ]

  return (
    <ol className="space-y-4">
      {steps.map((s) => (
        <li key={s.label} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white ${s.done ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            {s.done ? '✓' : ''}
          </span>
          <div>
            <div className={`text-sm font-medium ${s.done ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</div>
            {s.done && s.at && <div className="text-xs text-gray-500">{formatDateTime(s.at)}</div>}
          </div>
        </li>
      ))}
      {ended && (
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            &#10005;
          </span>
          <div className="text-sm font-medium text-red-700">{status}</div>
        </li>
      )}
    </ol>
  )
}

export default function ReservationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: r, loading, error, reload } = useFetch(() => reservationService.getById(id), [id])
  const stations = useStationLookup()
  const [confirm, setConfirm] = useState(null) // 'approve' | 'complete'
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const status = enumName(RESERVATION_STATUS, r.status)
  const tx = enumName(TRANSACTION_STATUS, r.transactionStatus)
  const isOperator = user.role === ROLES.GRID_OPERATOR

  const actions = {
    approve: {
      title: 'Approve this reservation?',
      message: 'A QR code will be generated for the prosumer.',
      label: 'Approve',
      variant: 'primary',
      run: () => reservationService.approve(id),
      done: 'Reservation approved',
    },
    complete: {
      title: 'Complete energy transfer?',
      message: 'Confirm that the energy transfer has been carried out. This closes the reservation.',
      label: 'Complete transfer',
      variant: 'info',
      run: () => reservationService.complete(id),
      done: 'Energy transfer completed',
    },
  }

  const runAction = async () => {
    const a = actions[confirm]
    setBusy(true)
    try {
      await a.run()
      toast.success(a.done)
      setConfirm(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title={r.reservationNumber}
        subtitle={`${stations.nameOf(r.stationId)} · ${formatDate(r.reservationDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            {isOperator && status === 'Pending' && <Button onClick={() => setConfirm('approve')}>Approve</Button>}
            {isOperator && tx === 'Verified' && status !== 'Completed' && (
              <Button variant="info" onClick={() => setConfirm('complete')}>
                Complete transfer
              </Button>
            )}
            {tx !== 'NotStarted' && (
              <LinkButton to={`/transactions/${id}`} variant="secondary">
                {status === 'Completed' ? 'Receipt' : 'Transaction'}
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Status">
              <StatusBadge status={status} />
            </Detail>
            <Detail label="Transaction">
              <StatusBadge status={tx} />
            </Detail>
            <Detail label="Station">{stations.nameOf(r.stationId)}</Detail>
            <Detail label="Prosumer NIC">{r.prosumerNIC}</Detail>
            <Detail label="Date">{formatDate(r.reservationDate)}</Detail>
            <Detail label="Time">
              {formatTime(r.startTime)} - {formatTime(r.endTime)}
            </Detail>
            <Detail label="Created">{formatDateTime(r.createdAt)}</Detail>
            {r.approvedBy && <Detail label="Approved by">{r.approvedBy}</Detail>}
            {r.completedBy && <Detail label="Completed by">{r.completedBy}</Detail>}
            {r.completedAt && <Detail label="Completed at">{formatDateTime(r.completedAt)}</Detail>}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Progress</h2>
          <ReservationTimeline reservation={{ ...r, status, transactionStatus: tx }} />
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm ? actions[confirm].title : ''}
        message={confirm ? actions[confirm].message : ''}
        confirmLabel={confirm ? actions[confirm].label : ''}
        variant={confirm ? actions[confirm].variant : 'primary'}
        busy={busy}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
