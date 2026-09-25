import { useEffect, useState } from 'react'
import { getAllStations } from '../../services/api/stationService'

function SlotForm({ slot, onClose, onSubmit }) {
    const isEdit = Boolean(slot)

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
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSaving(true)

        try {
            const payload = isEdit
                ? {
                    slotDate: new Date(form.slotDate)
                        .toISOString()
                        .split('T')[0],
                    startTime: form.startTime + ':00',
                    endTime: form.endTime + ':00',
                    capacityKw: Number(form.capacityKw),
                    availableCapacityKw: Number(
                        form.availableCapacityKw
                    ),
                }
                : {
                    stationId: form.stationId,
                    slotDate: new Date(form.slotDate)
                        .toISOString()
                        .split('T')[0],
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
            setError(
                err?.response?.data?.message ??
                'Failed to save slot. Please try again.'
            )
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
                                onChange={(e) =>
                                    handleChange(
                                        'slotDate',
                                        e.target.value
                                    )
                                }
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) =>
                                        handleChange(
                                            'startTime',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    End Time
                                </label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) =>
                                        handleChange(
                                            'endTime',
                                            e.target.value
                                        )
                                    }
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
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
