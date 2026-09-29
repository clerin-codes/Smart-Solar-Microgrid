import { useEffect, useState } from 'react'

const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

const DEFAULT_SCHEDULE = DAYS.map((day) => ({
    day,
    openingTime: '08:00:00',
    closingTime: '18:00:00',
    isAvailable: true,
}))

function StationForm({
    station,
    onClose,
    onSubmit,
}) {
    const isEdit = Boolean(station)

    const [form, setForm] = useState({
        stationCode: '',
        stationName: '',
        latitude: 0,
        longitude: 0,
        capacityKw: 0,
        batteryStorageSlots: 0,
        schedules: DEFAULT_SCHEDULE,
    })

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Pre-fill on edit
    useEffect(() => {
        if (station) {
            setForm({
                stationCode: station.stationCode ?? '',
                stationName: station.stationName ?? '',
                latitude: station.latitude ?? 0,
                longitude: station.longitude ?? 0,
                capacityKw: station.capacityKw ?? 0,
                batteryStorageSlots:
                    station.batteryStorageSlots ?? 0,
                schedules:
                    station.schedules?.length > 0
                        ? station.schedules.map((s) => ({
                            day: s.day,
                            openingTime: s.openingTime ?? '08:00:00',
                            closingTime: s.closingTime ?? '18:00:00',
                            isAvailable: s.isAvailable ?? true,
                        }))
                        : DEFAULT_SCHEDULE,
            })
        }
    }, [station])

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleScheduleChange = (
        index,
        field,
        value
    ) => {
        setForm((prev) => {
            const updated = [...prev.schedules]

            updated[index] = {
                ...updated[index],
                [field]: value,
            }

            return { ...prev, schedules: updated }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)

        try {
            const payload = isEdit
                ? {
                    stationName: form.stationName,
                    latitude: Number(form.latitude),
                    longitude: Number(form.longitude),
                    capacityKw: Number(form.capacityKw),
                    batteryStorageSlots: Number(
                        form.batteryStorageSlots
                    ),
                    schedules: form.schedules,
                }
                : {
                    stationCode: form.stationCode,
                    stationName: form.stationName,
                    latitude: Number(form.latitude),
                    longitude: Number(form.longitude),
                    capacityKw: Number(form.capacityKw),
                    batteryStorageSlots: Number(
                        form.batteryStorageSlots
                    ),
                    schedules: form.schedules,
                }

            await onSubmit(payload)
            onClose()
        } catch (err) {
            console.error('Station save error:', err)

            setError(
                err?.response?.data?.message ??
                'Failed to save station. Please try again.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {isEdit
                            ? 'Edit Station'
                            : 'Add New Station'}
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

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Station Code (create only) */}
                        {!isEdit && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Station Code
                                </label>

                                <input
                                    type="text"
                                    value={form.stationCode}
                                    onChange={(e) =>
                                        handleChange(
                                            'stationCode',
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. SS-001"
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        {/* Station Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Station Name
                            </label>

                            <input
                                type="text"
                                value={form.stationName}
                                onChange={(e) =>
                                    handleChange(
                                        'stationName',
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Colombo Central Solar Hub"
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Lat / Lng */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Latitude
                                </label>

                                <input
                                    type="number"
                                    step="any"
                                    value={form.latitude}
                                    onChange={(e) =>
                                        handleChange(
                                            'latitude',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Longitude
                                </label>

                                <input
                                    type="number"
                                    step="any"
                                    value={form.longitude}
                                    onChange={(e) =>
                                        handleChange(
                                            'longitude',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Capacity / Battery */}
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

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Battery Storage Slots
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    value={form.batteryStorageSlots}
                                    onChange={(e) =>
                                        handleChange(
                                            'batteryStorageSlots',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Schedules */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">
                                Weekly Schedule
                            </label>

                            <div className="space-y-2">
                                {form.schedules.map(
                                    (schedule, index) => (
                                        <div
                                            key={schedule.day}
                                            className={`flex items-center gap-3 rounded-xl p-3 transition ${schedule.isAvailable
                                                    ? 'bg-slate-50'
                                                    : 'bg-slate-100 opacity-60'
                                                }`}
                                        >
                                            {/* Toggle */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleScheduleChange(
                                                        index,
                                                        'isAvailable',
                                                        !schedule.isAvailable
                                                    )
                                                }
                                                className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${schedule.isAvailable
                                                        ? 'bg-green-500'
                                                        : 'bg-slate-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.isAvailable
                                                            ? 'translate-x-4'
                                                            : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>

                                            {/* Day Name */}
                                            <span className="w-24 text-sm font-medium text-slate-700">
                                                {schedule.day}
                                            </span>

                                            {/* Opening Time */}
                                            <input
                                                type="time"
                                                value={schedule.openingTime?.substring(
                                                    0,
                                                    5
                                                )}
                                                onChange={(e) =>
                                                    handleScheduleChange(
                                                        index,
                                                        'openingTime',
                                                        e.target.value + ':00'
                                                    )
                                                }
                                                disabled={
                                                    !schedule.isAvailable
                                                }
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            />

                                            <span className="text-xs text-slate-400">
                                                to
                                            </span>

                                            {/* Closing Time */}
                                            <input
                                                type="time"
                                                value={schedule.closingTime?.substring(
                                                    0,
                                                    5
                                                )}
                                                onChange={(e) =>
                                                    handleScheduleChange(
                                                        index,
                                                        'closingTime',
                                                        e.target.value + ':00'
                                                    )
                                                }
                                                disabled={
                                                    !schedule.isAvailable
                                                }
                                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            />
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                        >
                            {saving
                                ? 'Saving...'
                                : isEdit
                                    ? 'Update Station'
                                    : 'Create Station'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default StationForm
