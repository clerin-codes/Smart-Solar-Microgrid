import { useState } from 'react'
import toast from 'react-hot-toast'
import { transactionService } from '../../services/transactionService'
import { errorMessage, formatDate, formatTime } from '../../utils/formatters'
import Modal from '../Common/Modal'
import { Button } from '../Common/ui'

// Final confirmation before the energy transfer is recorded.
export default function VerificationDialog({ open, reservation, stationName, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleTransfer = async () => {
    setBusy(true)
    setError('')
    try {
      const completed = await transactionService.transferEnergy(reservation.id)
      toast.success('Energy transfer completed')
      onConfirm(completed)
    } catch (err) {
      setError(errorMessage(err, 'Energy transfer failed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  const cancel = () => {
    setError('')
    onCancel()
  }

  const r = reservation
  return (
    <Modal open={open} title="Confirm energy transfer" onClose={busy ? () => {} : cancel}>
      {r && (
        <>
          <dl className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
            {[
              ['Reservation', r.reservationNumber],
              ['Prosumer NIC', r.prosumerNIC],
              ['Station', stationName],
              ['Date', formatDate(r.reservationDate)],
              ['Slot', `${formatTime(r.startTime)} - ${formatTime(r.endTime)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Confirming marks this reservation as completed. This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={busy}>
              {busy ? 'Processing...' : 'Confirm transfer'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
