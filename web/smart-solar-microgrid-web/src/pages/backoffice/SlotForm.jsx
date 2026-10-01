import { useEffect, useState } from 'react'
import { getAllStations } from '../../services/api/stationService'

const getSriLankaToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date())

    const value = (type) =>
        parts.find((part) => part.type === type)?.value

    return `${value('year')}-${value('month')}-${value('day')}`
}

const getWeekday = (date) =>
    date
        ? new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            timeZone: 'UTC',
        }).format(new Date(`${date}T00:00:00Z`))
        : ''

const shortTime = (time) => time?.substring(0, 5) ?? ''

function SlotForm({ slot, onClose, onSubmit }) {
    const isEdit = Boolean(slot)
    const today = getSriLankaToday()

    const [form, setForm] = useState({
        stationId: '',
        slotDate: '',
        startTime: '',
        endTime: '',
        capacityKw: 0,
        availableCapacityKw: 0,
    })

    const [stations, setStations] = useState([])
    const [loadingStations, setLoadingStations] =
        useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const selectedStation = stations.find(
        (station) => station.id === form.stationId
    )
    const selectedDay = getWeekday(form.slotDate)
    const selectedSchedule = selectedStation?.schedules?.find(
        (schedule) =>
            schedule.day?.toLowerCase() ===
            selectedDay.toLowerCase()
    )

    // Load stations for dropdown
    useEffect(() => {
        if (!isEdit) {
            const fetchStations = async () => {
                setLoadingStations(true)
                try {
                    const data = await getAllStations()
                    setStations(
                        Array.isArray(data)
                            ? data.filter((s) => s.isActive)
                            : []
                    )
                } catch (err) {
                    console.error(
                        'Failed to load stations:',
                        err
                    )
                } finally {
                    setLoadingStations(false)
                }
            }
            fetchStations()
        }
    }, [isEdit])

    // Pre-fill on edit
    useEffect(() => {
        if (slot) {
            setForm({
                stationId: slot.stationId ?? '',
                slotDate: slot.slotDate
                    ? new Date(slot.slotDate)
                        .toISOString()
                        .split('T')[0]
                    : '',
                startTime: slot.startTime
                    ? slot.startTime.substring(0, 5)
                    : '',
                endTime: slot.endTime
                    ? slot.endTime.substring(0, 5)
                    : '',
                capacityKw: slot.capacityKw ?? 0,
                availableCapacityKw:
                    slot.availableCapacityKw ??
                    slot.capacityKw ??
                    0,
            })
        }
    }, [slot])

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
        setFieldErrors((prev) =>
            field === 'stationId' || field === 'slotDate'
                ? {
                    ...prev,
                    slotDate: '',
                    startTime: '',
                    endTime: '',
                }
                : {
                    ...prev,
                    [field]: '',
                }
        )
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const validationErrors = {}

        if (!form.slotDate || form.slotDate < today) {
            validationErrors.slotDate = form.slotDate
                ? 'Slot date cannot be in the past.'
                : 'Slot date is required.'
        }

        if (
            !isEdit &&
            form.stationId &&
            form.slotDate &&
            !validationErrors.slotDate &&
            (!selectedSchedule || !selectedSchedule.isAvailable)
        ) {
            validationErrors.slotDate = `The station is unavailable on ${selectedDay}.`
        }

        if (
            !isEdit &&
            selectedSchedule?.isAvailable &&
            form.startTime &&
            form.startTime < shortTime(selectedSchedule.openingTime)
        ) {
            validationErrors.startTime = `Start time cannot be before ${shortTime(selectedSchedule.openingTime)}.`
        }

        if (
            !isEdit &&
            selectedSchedule?.isAvailable &&
            form.endTime &&
            form.endTime > shortTime(selectedSchedule.closingTime)
        ) {
            validationErrors.endTime = `End time cannot be after ${shortTime(selectedSchedule.closingTime)}.`
        }

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors)
            setError('Please correct the highlighted field.')
            return
        }

        setSaving(true)

        try {
            const payload = isEdit
                ? {
                    slotDate: form.slotDate,
                    startTime: form.startTime + ':00',
                    endTime: form.endTime + ':00',
                    capacityKw: Number(form.capacityKw),
                    availableCapacityKw: Number(
                        form.availableCapacityKw
                    ),
                }
                : {
                    stationId: form.stationId,
                    slotDate: form.slotDate,
                    startTime: form.startTime + ':00',
                    endTime: form.endTime + ':00',
                    capacityKw: Number(form.capacityKw),
                    availableCapacityKw: Number(
                        form.capacityKw
                    ),
                }

            await onSubmit(payload)
            onClose()
        } catch (err) {
            console.error('Slot save error:', err)
            const message =
                err?.response?.data?.message ??
                'Failed to save slot. Please try again.'

            if (/slot date|past/i.test(message)) {
                setFieldErrors((prev) => ({
                    ...prev,
                    slotDate: message,
                }))
            }

            if (/slot time|schedule/i.test(message)) {
                setFieldErrors((prev) => ({
                    ...prev,
                    startTime: message,
                    endTime: message,
                }))
            }

            if (/station is unavailable/i.test(message)) {
                setFieldErrors((prev) => ({
                    ...prev,
                    slotDate: message,
                }))
            }

            setError(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isEdit
                            ? 'Edit Energy Slot'
                            : 'Add New Slot'}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>
                            </div>
                        )}

                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Station
                                </label>
                                <select
                                    value={form.stationId}
                                    onChange={(e) =>
                                        handleChange(
                                            'stationId',
                                            e.target.value
                                        )
                                    }
                                    required
                                    disabled={loadingStations}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                >
                                    <option value="" disabled>
                                        {loadingStations
                                            ? 'Loading stations...'
                                            : 'Select a station'}
                                    </option>
                                    {stations.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.stationCode} -{' '}
                                            {s.stationName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Slot Date
                            </label>
                            <input
                                type="date"
                                value={form.slotDate}
                                min={today}
                                onChange={(e) =>
                                    handleChange(
                                        'slotDate',
                                        e.target.value
                                    )
                                }
                                required
                                aria-invalid={Boolean(
                                    fieldErrors.slotDate
                                )}
                                aria-describedby="slot-date-help"
                                className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 ${
                                    fieldErrors.slotDate
                                        ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                            />
                            <p
                                id="slot-date-help"
                                className={`mt-1.5 text-xs ${
                                    fieldErrors.slotDate
                                        ? 'text-red-600'
                                        : 'text-slate-500'
                                }`}
                            >
                                {fieldErrors.slotDate ||
                                    'Choose today or a future date.'}
                            </p>

                            {!isEdit &&
                                form.stationId &&
                                form.slotDate && (
                                    <div
                                        className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                                            selectedSchedule?.isAvailable
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border-amber-200 bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {selectedSchedule?.isAvailable
                                            ? `${selectedDay} schedule: ${shortTime(selectedSchedule.openingTime)} to ${shortTime(selectedSchedule.closingTime)}. The slot must stay within these hours.`
                                            : `This station is unavailable on ${selectedDay}. Choose another date.`}
                                    </div>
                                )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    min={
                                        selectedSchedule?.isAvailable
                                            ? shortTime(
                                                selectedSchedule.openingTime
                                            )
                                            : undefined
                                    }
                                    max={
                                        selectedSchedule?.isAvailable
                                            ? shortTime(
                                                selectedSchedule.closingTime
                                            )
                                            : undefined
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            'startTime',
                                            e.target.value
                                        )
                                    }
                                    required
                                    aria-invalid={Boolean(
                                        fieldErrors.startTime
                                    )}
                                    className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 ${
                                        fieldErrors.startTime
                                            ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                />
                                {fieldErrors.startTime && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {fieldErrors.startTime}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    min={
                                        selectedSchedule?.isAvailable
                                            ? shortTime(
                                                selectedSchedule.openingTime
                                            )
                                            : undefined
                                    }
                                    max={
                                        selectedSchedule?.isAvailable
                                            ? shortTime(
                                                selectedSchedule.closingTime
                                            )
                                            : undefined
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            'endTime',
                                            e.target.value
                                        )
                                    }
                                    required
                                    aria-invalid={Boolean(
                                        fieldErrors.endTime
                                    )}
                                    className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 ${
                                        fieldErrors.endTime
                                            ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                                            : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                />
                                {fieldErrors.endTime && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {fieldErrors.endTime}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Capacity (kW)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.capacityKw}
                                    onChange={(e) =>
                                        handleChange(
                                            'capacityKw',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {isEdit && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Avail. Capacity (kW)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={form.capacityKw}
                                        value={
                                            form.availableCapacityKw
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                'availableCapacityKw',
                                                e.target.value
                                            )
                                        }
                                        required
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition shadow-sm"
                        >
                            {saving
                                ? 'Saving...'
                                : isEdit
                                    ? 'Update Slot'
                                    : 'Create Slot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SlotForm
