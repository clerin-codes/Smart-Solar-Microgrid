import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import toast from 'react-hot-toast'
import { errorMessage, formatDate, formatDateTime, formatKw, formatTime } from '../../utils/formatters'
import { exportReceiptPdf } from '../../utils/pdf'
import { Button, Card, Detail, StatusBadge } from '../Common/ui'

// Printable / downloadable receipt for a transaction.
export default function TransactionReceipt({ reservation: r, stationName, capacityKw }) {
  const completed = enumName(RESERVATION_STATUS, r.status) === 'Completed'

  const download = async () => {
    try {
      await exportReceiptPdf({
        title: 'Energy Transfer Receipt',
        reference: r.reservationNumber,
        filename: `receipt-${r.reservationNumber}.pdf`,
        fields: [
          ['Reservation', r.reservationNumber],
          ['Prosumer NIC', r.prosumerNIC],
          ['Station', stationName],
          ['Slot date', formatDate(r.reservationDate)],
          ['Slot time', `${formatTime(r.startTime)} - ${formatTime(r.endTime)}`],
          ['Slot capacity', capacityKw != null ? formatKw(capacityKw) : '-'],
          ['Approved by', r.approvedBy ?? '-'],
          ['Completed by', r.completedBy ?? '-'],
          ['Completed at', r.completedAt ? formatDateTime(r.completedAt) : '-'],
        ],
      })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the PDF.'))
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Energy transfer receipt</div>
          <div className="text-lg font-semibold">{r.reservationNumber}</div>
        </div>
        <StatusBadge status={enumName(TRANSACTION_STATUS, r.transactionStatus)} />
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Station">{stationName}</Detail>
        <Detail label="Prosumer NIC">{r.prosumerNIC}</Detail>
        <Detail label="Slot date">{formatDate(r.reservationDate)}</Detail>
        <Detail label="Slot time">
          {formatTime(r.startTime)} - {formatTime(r.endTime)}
        </Detail>
        <Detail label="Slot capacity">{capacityKw != null ? formatKw(capacityKw) : '-'}</Detail>
        <Detail label="Reservation status">
          <StatusBadge status={enumName(RESERVATION_STATUS, r.status)} />
        </Detail>
        <Detail label="Approved by">{r.approvedBy}</Detail>
        <Detail label="Completed by">{r.completedBy}</Detail>
        <Detail label="Completed at">{r.completedAt ? formatDateTime(r.completedAt) : '-'}</Detail>
      </dl>
      {completed ? (
        <div className="no-print mt-6 flex gap-2">
          <Button onClick={() => window.print()}>Print receipt</Button>
          <Button variant="secondary" onClick={download}>
            Download PDF
          </Button>
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          This transaction has been verified but the energy transfer is not complete yet. A receipt is available once it is.
        </p>
      )}
    </Card>
  )
}
