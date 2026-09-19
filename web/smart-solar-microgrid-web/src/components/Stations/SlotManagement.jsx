import { useState } from 'react'
import toast from 'react-hot-toast'
import { useForm } from '../../hooks/useForm'
import { slotService } from '../../services/stationService'
import { dateOnly, errorMessage } from '../../utils/formatters'
import { positiveNumber, required } from '../../utils/validators'
import Modal from '../Common/Modal'
import { Button, Field, inputClass } from '../Common/ui'

const toTimeSpan = (hhmm) => (hhmm.length === 5 ? `${hhmm}:00` : hhmm)

function SlotForm({ stationId, slot, onDone, onCancel }) {
  const editing = Boolean(slot)
  const [saving, setSaving] = useState(false)
  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm(
    editing
      ? {
          slotDate: dateOnly(slot.slotDate),
          startTime: slot.startTime.slice(0, 5),
          endTime: slot.endTime.slice(0, 5),
          capacityKw: String(slot.capacityKw),
          availableCapacityKw: String(slot.availableCapacityKw),
        }
      : { slotDate: '', startTime: '', endTime: '', capacityKw: '' },
    {
      slotDate: [required],
      startTime: [required],
      endTime: [required, (v, all) => (all.startTime && v <= all.startTime ? 'End time must be after start time.' : '')],
      capacityKw: [positiveNumber],
      ...(editing
        ? {
            availableCapacityKw: [
              (v, all) =>
                Number(v) < 0 || Number(v) > Number(all.capacityKw) ? 'Must be between 0 and the slot capacity.' : '',
            ],
          }
        : {}),
    },
  )

  const onSubmit = async (v) => {
    setSaving(true)
    const body = {
      slotDate: `${v.slotDate}T00:00:00Z`,
      startTime: toTimeSpan(v.startTime),
      endTime: toTimeSpan(v.endTime),
      capacityKw: Number(v.capacityKw),
    }
    try {
      if (editing) await slotService.update(slot.id, { ...body, availableCapacityKw: Number(v.availableCapacityKw) })
      else await slotService.create({ ...body, stationId })
      toast.success(editing ? 'Slot updated' : 'Slot created')
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Date" error={errors.slotDate}>
        <input type="date" name="slotDate" value={values.slotDate} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time" error={errors.startTime}>
          <input type="time" name="startTime" value={values.startTime} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
        </Field>
        <Field label="End time" error={errors.endTime}>
          <input type="time" name="endTime" value={values.endTime} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
        </Field>
      </div>
      <Field label="Capacity (kW)" error={errors.capacityKw}>
        <input type="number" step="any" name="capacityKw" value={values.capacityKw} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      {editing && (
        <Field label="Available capacity (kW)" error={errors.availableCapacityKw}>
          <input
            type="number"
            step="any"
            name="availableCapacityKw"
            value={values.availableCapacityKw}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputClass}
          />
        </Field>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save slot' : 'Add slot'}
        </Button>
      </div>
    </form>
  )
}

// Modal wrapper used from the station detail page.
export function SlotModal({ open, stationId, slot, onClose, onSaved }) {
  return (
    <Modal open={open} title={slot ? 'Edit slot' : 'Add slot'} onClose={onClose}>
      {open && <SlotForm stationId={stationId} slot={slot} onCancel={onClose} onDone={onSaved} />}
    </Modal>
  )
}
