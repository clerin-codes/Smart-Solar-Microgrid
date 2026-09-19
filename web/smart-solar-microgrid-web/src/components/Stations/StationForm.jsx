import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useFetch } from '../../hooks/useFetch'
import { useForm } from '../../hooks/useForm'
import { stationService } from '../../services/stationService'
import { errorMessage } from '../../utils/formatters'
import { latitude, longitude, positiveNumber, required } from '../../utils/validators'
import { Button, Card, ErrorMessage, Field, PageHeader, Spinner, inputClass } from '../Common/ui'

const EMPTY = { stationCode: '', stationName: '', latitude: '', longitude: '', capacityKw: '', batteryStorageSlots: '' }

function StationFormBody({ id, initial }) {
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const { values, setValues, errors, handleChange, handleBlur, handleSubmit } = useForm(initial, {
    ...(editing ? {} : { stationCode: [required] }),
    stationName: [required],
    latitude: [latitude],
    longitude: [longitude],
    capacityKw: [positiveNumber],
    batteryStorageSlots: [positiveNumber],
  })

  useEffect(() => setValues(initial), [initial, setValues])

  const onSubmit = async (v) => {
    setSaving(true)
    const body = {
      stationName: v.stationName.trim(),
      latitude: Number(v.latitude),
      longitude: Number(v.longitude),
      capacityKw: Number(v.capacityKw),
      batteryStorageSlots: Number(v.batteryStorageSlots),
    }
    try {
      const saved = editing
        ? await stationService.update(id, body)
        : await stationService.create({ ...body, stationCode: v.stationCode.trim() })
      toast.success(editing ? 'Station updated' : 'Station created')
      navigate(`/stations/${saved?.id ?? id}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const input = (name, label, props = {}) => (
    <Field label={label} error={errors[name]}>
      <input name={name} value={values[name]} onChange={handleChange} onBlur={handleBlur} className={inputClass} {...props} />
    </Field>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      {input('stationCode', 'Station code', { disabled: editing, placeholder: 'SS-COL-001' })}
      {input('stationName', 'Station name')}
      {input('latitude', 'Latitude', { type: 'number', step: 'any' })}
      {input('longitude', 'Longitude', { type: 'number', step: 'any' })}
      {input('capacityKw', 'Capacity (kW)', { type: 'number', step: 'any' })}
      {input('batteryStorageSlots', 'Battery storage slots', { type: 'number' })}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Create station'}
        </Button>
      </div>
    </form>
  )
}

export default function StationForm() {
  const { id } = useParams()
  const { data, loading, error, reload } = useFetch(
    () => (id ? stationService.getById(id) : Promise.resolve(null)),
    [id],
  )

  const initial = data
    ? {
        stationCode: data.stationCode,
        stationName: data.stationName,
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        capacityKw: String(data.capacityKw),
        batteryStorageSlots: String(data.batteryStorageSlots),
      }
    : EMPTY

  return (
    <>
      <PageHeader title={id ? 'Edit station' : 'New station'} />
      <Card>
        {loading && <Spinner />}
        <ErrorMessage message={error} onRetry={reload} />
        {!loading && !error && <StationFormBody id={id} initial={initial} />}
      </Card>
    </>
  )
}
