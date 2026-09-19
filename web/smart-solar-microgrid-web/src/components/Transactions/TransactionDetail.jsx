import { useParams } from 'react-router-dom'
import { useFetch } from '../../hooks/useFetch'
import { useStationLookup } from '../../hooks/useStationLookup'
import { slotService } from '../../services/stationService'
import { transactionService } from '../../services/transactionService'
import { RESERVATION_STATUS, TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { Card, ErrorMessage, LinkButton, PageHeader, Spinner } from '../Common/ui'
import { ReservationTimeline } from '../Reservations/ReservationDetail'
import TransactionReceipt from './TransactionReceipt'

export default function TransactionDetail() {
  const { id } = useParams()
  const { data: r, loading, error, reload } = useFetch(() => transactionService.getById(id), [id])
  const slots = useFetch(slotService.getAll)
  const stations = useStationLookup()

  if (loading) return <Spinner />
  if (error) return <ErrorMessage message={error} onRetry={reload} />

  const slot = (slots.data ?? []).find((s) => s.id === r.slotId)

  return (
    <>
      <PageHeader
        title="Transaction"
        subtitle={r.reservationNumber}
        actions={
          <>
            <LinkButton to="/transactions" variant="secondary" className="no-print">
              Back to list
            </LinkButton>
            <LinkButton to={`/reservations/${id}`} variant="secondary" className="no-print">
              View reservation
            </LinkButton>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionReceipt reservation={r} stationName={stations.nameOf(r.stationId)} capacityKw={slot?.capacityKw} />
        </div>
        <Card className="no-print">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Progress</h2>
          <ReservationTimeline
            reservation={{
              ...r,
              status: enumName(RESERVATION_STATUS, r.status),
              transactionStatus: enumName(TRANSACTION_STATUS, r.transactionStatus),
            }}
          />
        </Card>
      </div>
    </>
  )
}
