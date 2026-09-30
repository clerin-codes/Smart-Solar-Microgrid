import {
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    getAllStations,
    createStation,
    updateStation,
    deactivateStation,
} from '../../services/api/stationService'

import StationForm from './StationForm'

function Stations() {
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] =
        useState('all')

    // Modal state
    const [showForm, setShowForm] = useState(false)
    const [editStation, setEditStation] =
        useState(null)

    // Deactivate confirmation
    const [confirmId, setConfirmId] = useState(null)

    // =====================================================
    // Load Stations
    // =====================================================

    const loadStations = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await getAllStations()

            setStations(
                Array.isArray(data) ? data : []
            )
        } catch (err) {
            console.error(
                'Failed to load stations:',
                err
            )

            setError(
                'Unable to load stations. Please check the server connection.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStations()
    }, [])

    // =====================================================
    // Search + Filter
    // =====================================================

    const filteredStations = useMemo(() => {
        return stations.filter((station) => {
            const code = String(
                station.stationCode ?? ''
            ).toLowerCase()

            const name = String(
                station.stationName ?? ''
            ).toLowerCase()

            const searchValue =
                search.toLowerCase()

            const matchesSearch =
                code.includes(searchValue) ||
                name.includes(searchValue)

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' &&
                    station.isActive) ||
                (statusFilter === 'inactive' &&
                    !station.isActive)

            return matchesSearch && matchesStatus
        })
    }, [stations, search, statusFilter])

    // =====================================================
    // Summary Counts
    // =====================================================

    const totalStations = stations.length

    const activeStations = stations.filter(
        (s) => s.isActive
    ).length

    const inactiveStations = stations.filter(
        (s) => !s.isActive
    ).length

    const totalCapacity = stations
        .filter((s) => s.isActive)
        .reduce(
            (sum, s) => sum + (s.capacityKw ?? 0),
            0
        )

    // =====================================================
    // Handlers
    // =====================================================

    const handleCreate = async (payload) => {
        await createStation(payload)
        await loadStations()
    }

    const handleUpdate = async (payload) => {
        await updateStation(editStation.id, payload)
        setEditStation(null)
        await loadStations()
    }

    const handleDeactivate = async (id) => {
        try {
            await deactivateStation(id)
            setConfirmId(null)
            await loadStations()
        } catch (err) {
            console.error(
                'Failed to deactivate station:',
                err
            )
        }
    }

    const openEdit = (station) => {
        setEditStation(station)
        setShowForm(true)
    }

    const openCreate = () => {
        setEditStation(null)
        setShowForm(true)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditStation(null)
    }

    // =====================================================
    // Render
    // =====================================================

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-blue-600">
                        Backoffice
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        Solar Stations
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Create, update and manage solar energy stations.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition shadow-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                    Add Station
                </button>
            </div>

            {/* =================================================
          Summary Cards
      ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Total */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Total Stations
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                        {totalStations}
                    </p>
                </div>

                {/* Active */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Active
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-600">
                        {activeStations}
                    </p>
                </div>

                {/* Inactive */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Inactive
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {inactiveStations}
                    </p>
                </div>

                {/* Total Capacity */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Total Active Capacity
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-600">
                        {totalCapacity.toFixed(1)} kW
                    </p>
                </div>

            </div>

            {/* =================================================
          Search + Filter
      ================================================= */}

            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-3">

                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search by station code or name..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">
                            All Statuses
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>
                    </select>

                </div>
            </div>

            {/* =================================================
          Loading
      ================================================= */}

            {loading && (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

                    <p className="mt-3 text-slate-500">
                        Loading stations...
                    </p>
                </div>
            )}

            {/* =================================================
          Error
      ================================================= */}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                </div>
            )}

            {/* =================================================
          Empty
      ================================================= */}

            {!loading &&
                !error &&
                filteredStations.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-7 h-7"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-lg font-semibold text-slate-700">
                            No Stations Found
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            {stations.length === 0
                                ? 'Get started by adding your first solar station.'
                                : 'No stations match your current search or filter.'}
                        </p>

                        {stations.length === 0 && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                Add Station
                            </button>
                        )}
                    </div>
                )}

            {/* =================================================
          Stations Table
      ================================================= */}

            {!loading &&
                !error &&
                filteredStations.length > 0 && (

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                {/* Table Header */}
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Code
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Station Name
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Capacity
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Battery Slots
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Available
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Status
                                        </th>

                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody className="divide-y divide-slate-100">

                                    {filteredStations.map(
                                        (station) => (
                                            <tr
                                                key={station.id}
                                                className="hover:bg-slate-50 transition"
                                            >
                                                {/* Code */}
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-800">
                                                        {station.stationCode}
                                                    </p>
                                                </td>

                                                {/* Name */}
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-800">
                                                            {station.stationName}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {station.latitude?.toFixed(
                                                                4
                                                            )}
                                                            ,{' '}
                                                            {station.longitude?.toFixed(
                                                                4
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Capacity */}
                                                <td className="px-6 py-4 text-slate-700">
                                                    {station.capacityKw} kW
                                                </td>

                                                {/* Battery Slots */}
                                                <td className="px-6 py-4 text-slate-700">
                                                    {station.batteryStorageSlots}
                                                </td>

                                                {/* Available */}
                                                <td className="px-6 py-4 text-slate-700">
                                                    {station.availableSlots ??
                                                        '-'}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${station.isActive
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                            }`}
                                                    >
                                                        {station.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    station
                                                                )
                                                            }
                                                            className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                                                        >
                                                            Edit
                                                        </button>

                                                        {station.isActive && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setConfirmId(
                                                                        station.id
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 transition"
                                                            >
                                                                Deactivate
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            {/* =================================================
          Create / Edit Modal
      ================================================= */}

            {showForm && (
                <StationForm
                    station={editStation}
                    onClose={closeForm}
                    onSubmit={
                        editStation
                            ? handleUpdate
                            : handleCreate
                    }
                />
            )}

            {/* =================================================
          Deactivate Confirmation Modal
      ================================================= */}

            {confirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center">

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className="w-7 h-7"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800">
                            Deactivate Station?
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            This will mark the station as inactive. Existing reservations will not be affected.
                        </p>

                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmId(null)
                                }
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleDeactivate(confirmId)
                                }
                                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Stations
