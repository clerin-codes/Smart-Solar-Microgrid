import { useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { slotService, stationService } from '../../services/stationService'
import { ROLES, SLOT_STATUS, enumName } from '../../utils/constants'
import { errorMessage, formatDate, formatKw, formatTime } from '../../utils/formatters'
import ConfirmDialog from '../Common/ConfirmDialog'
import {
  Button,
  Card,
  Detail,
  EmptyState,
  ErrorMessage,
  LinkButton,
  PageHeader,
  Spinner,
  StatusBadge,
  Table,
} from '../Common/ui'
import { SlotModal } from './SlotManagement'
import StationMap from './StationMap'

export default function StationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user.role === ROLES.BACKOFFICE

  const station = useFetch(() => stationService.getById(id), [id])
  const slots = useFetch(() => slotService.getByStation(id), [id])
  const [slotModal, setSlotModal] = useState(null) // { slot } (null slot = create)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [busy, setBusy] = useState(false)

  if (station.loading) return <Spinner />
  if (station.error) return <ErrorMessage message={station.error} onRetry={station.reload} />
  const s = station.data

  const deactivate = async () => {
    setBusy(true)
    try {
      await stationService.deactivate(id)
      toast.success('Station deactivated')
      setConfirmDeactivate(false)
      station.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const sortedSlots = [...(slots.data ?? [])].sort((a, b) =>
    `${a.slotDate}${a.startTime}`.localeCompare(`${b.slotDate}${b.startTime}`),
  )

  return (
    <>
      <PageHeader
        title={s.stationName}
        subtitle={s.stationCode}
        actions={
          <>
            <StatusBadge status={s.isActive ? 'Active' : 'Inactive'} />
            {isAdmin && (
              <>
                <LinkButton to={`/stations/${id}/edit`} variant="secondary">
                  Edit
                </LinkButton>
                {s.isActive && (
                  <Button variant="danger" onClick={() => setConfirmDeactivate(true)}>
                    Deactivate
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <dl className="grid grid-cols-2 gap-4">
            <Detail label="Capacity">{formatKw(s.capacityKw)}</Detail>
            <Detail label="Battery slots">
              {s.availableSlots} / {s.batteryStorageSlots} available
            </Detail>
            <Detail label="Latitude">{s.latitude}</Detail>
            <Detail label="Longitude">{s.longitude}</Detail>
          </dl>
          <h3 className="mt-5 mb-2 text-sm font-semibold text-gray-700">Opening hours</h3>
          <ul className="divide-y divide-gray-100 text-sm">
            {s.schedules.map((d) => (
              <li key={d.day} className="flex justify-between py-1.5">
                <span>{d.day}</span>
                <span className={d.isAvailable ? '' : 'text-gray-400'}>
                  {d.isAvailable ? `${formatTime(d.openingTime)} - ${formatTime(d.closingTime)}` : 'Closed'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <StationMap latitude={s.latitude} longitude={s.longitude} name={s.stationName} className="h-72 lg:h-full" />
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Energy slots</h2>
        {isAdmin && <Button onClick={() => setSlotModal({ slot: null })}>+ Add slot</Button>}
      </div>

      {slots.loading && <Spinner />}
      <ErrorMessage message={slots.error} onRetry={slots.reload} />
      {slots.data && sortedSlots.length === 0 && <EmptyState title="No slots have been created for this station" />}
      {sortedSlots.length > 0 && (
        <Table headers={['Date', 'Time', 'Available', 'Status', '']}>
          {sortedSlots.map((slot) => {
            const status = enumName(SLOT_STATUS, slot.status)
            return (
              <tr key={slot.id}>
                <td className="px-4 py-3">{formatDate(slot.slotDate)}</td>
                <td className="px-4 py-3">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </td>
                <td className="px-4 py-3">
                  {formatKw(slot.availableCapacityKw)} of {formatKw(slot.capacityKw)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  {isAdmin && (
                    <Button variant="secondary" onClick={() => setSlotModal({ slot })}>
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      <SlotModal
        open={Boolean(slotModal)}
        stationId={id}
        slot={slotModal?.slot}
        onClose={() => setSlotModal(null)}
        onSaved={() => {
          setSlotModal(null)
          slots.reload()
        }}
      />
      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate this station?"
        message="The station will no longer accept new reservations. Stations with active reservations cannot be deactivated."
        confirmLabel="Deactivate"
        busy={busy}
        onConfirm={deactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </>
  )
}
