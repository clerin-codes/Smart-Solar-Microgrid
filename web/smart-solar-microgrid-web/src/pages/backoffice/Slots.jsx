import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    getAllSlots,
    createSlot,
    updateSlot,
    getSlotsByStation,
} from '../../services/api/slotService'
import { getAllStations } from '../../services/api/stationService'

import SlotForm from './SlotForm'
import InfoBanner from '../../components/common/InfoBanner'
import Pagination from '../../components/common/Pagination'
import useAutoRefresh from '../../hooks/useAutoRefresh'

const SLOT_STATUS = {
    0: 'Available',
    1: 'Full',
    2: 'Closed',
}

function getSlotStatus(status) {
    return SLOT_STATUS[status] ?? 'Unknown'
}

function getStatusStyle(status) {
    switch (status) {
        case 0:
            return 'bg-green-50 text-green-700 border-green-200'
        case 1:
            return 'bg-amber-50 text-amber-700 border-amber-200'
        case 2:
            return 'bg-red-50 text-red-700 border-red-200'
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200'
    }
}

function Slots() {
    const [slots, setSlots] = useState([])
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filters
    const [search, setSearch] = useState('')
    const [stationFilter, setStationFilter] =
        useState('all')

    // Modal State
    const [showForm, setShowForm] = useState(false)
    const [editSlot, setEditSlot] = useState(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // =====================================================
    // Data Loading
    // =====================================================

    const loadData = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true)
                setError('')
            }

            const [slotsData, stationsData] =
                await Promise.all([
                    stationFilter !== 'all'
                        ? getSlotsByStation(stationFilter)
                        : getAllSlots(),
                    getAllStations(),
                ])

            setSlots(
                Array.isArray(slotsData) ? slotsData : []
            )
            setStations(
                Array.isArray(stationsData)
                    ? stationsData
                    : []
            )
            setError('')
        } catch (err) {
            console.error('Failed to load data:', err)
            if (!silent) {
                setError(
                    'Unable to load data. Please check the server connection.'
                )
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }, [stationFilter])

    useEffect(() => {
        loadData()
    }, [loadData])

    const reloadSlots = useCallback(async () => {
        try {
            let data = []
            if (stationFilter !== 'all') {
                data = await getSlotsByStation(
                    stationFilter
                )
            } else {
                data = await getAllSlots()
            }
            setSlots(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Failed to reload slots:', err)
        }
    }, [stationFilter])

    useAutoRefresh(() => loadData(true), {
        enabled: !showForm,
    })

    // =====================================================
    // Search + Filter
    // =====================================================

    const filteredSlots = useMemo(() => {
        return slots.filter((slot) => {
            const station = stations.find((item) => item.id === slot.stationId)
            const searchValue = search.trim().toLowerCase()
            const statusName = getSlotStatus(slot.status)
            const searchable = `${slot.id} ${station?.stationCode || ''} ${station?.stationName || ''} ${slot.slotDate || ''} ${slot.startTime || ''} ${slot.endTime || ''} ${statusName}`.toLowerCase()
            return searchable.includes(searchValue)
        }).sort((a, b) => new Date(b.createdAt || b.slotDate || 0) - new Date(a.createdAt || a.slotDate || 0))
    }, [slots, stations, search])
    const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredSlots.length / pageSize)))
    const pagedSlots = filteredSlots.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // =====================================================
    // Summary Counts
    // =====================================================

    const totalSlots = slots.length
    const availableSlots = slots.filter(
        (s) => s.status === 0
    ).length
    const fullSlots = slots.filter(
        (s) => s.status === 1
    ).length
    const closedSlots = slots.filter(
        (s) => s.status === 2
    ).length

    // =====================================================
    // Handlers
    // =====================================================

    const handleCreate = async (payload) => {
        await createSlot(payload)
        await reloadSlots()
    }

    const handleUpdate = async (payload) => {
        await updateSlot(editSlot.id, payload)
        setEditSlot(null)
        await reloadSlots()
    }

    const openEdit = (slot) => {
        setEditSlot(slot)
        setShowForm(true)
    }

    const openCreate = () => {
        setEditSlot(null)
        setShowForm(true)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditSlot(null)
    }

    const getStationCode = (stationId) => {
        const st = stations.find(
            (s) => s.id === stationId
        )
        return st ? st.stationCode : stationId
    }

    const getStationName = (stationId) => {
        const st = stations.find(
            (s) => s.id === stationId
        )
        return st ? st.stationName : 'Unknown'
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
                        Energy Booking Slots
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage available time slots, capacities, and statuses.
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
                    Add Slot
                </button>
            </div>

            <InfoBanner>Create dated energy windows for active stations. Prosumers can reserve only future, available slots with remaining capacity.</InfoBanner>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Total Slots
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                        {totalSlots}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Available
                    </p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                        {availableSlots}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Full
                    </p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                        {fullSlots}
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <p className="text-sm text-slate-500">
                        Closed
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {closedSlots}
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            placeholder="Search by slot ID..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={stationFilter}
                        onChange={(e) => {
                            setStationFilter(e.target.value)
                            setPage(1)
                        }}
                        className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 md:min-w-[200px]"
                    >
                        <option value="all">
                            All Stations
                        </option>
                        {stations.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.stationCode}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="mt-3 text-slate-500">
                        Loading slots...
                    </p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                </div>
            )}

            {/* Empty State */}
            {!loading &&
                !error &&
                filteredSlots.length === 0 && (
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
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700">
                            No Slots Found
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            We couldn't find any slots matching
                            your criteria.
                        </p>
                    </div>
                )}

            {/* Data Table */}
            {!loading &&
                !error &&
                filteredSlots.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Station
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Date
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Time Window
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Capacity
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Status
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-slate-600">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pagedSlots.map((slot) => (
                                        <tr
                                            key={slot.id}
                                            className="hover:bg-slate-50 transition"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {getStationCode(
                                                            slot.stationId
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {getStationName(
                                                            slot.stationId
                                                        )}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                {slot.slotDate
                                                    ? new Date(
                                                        slot.slotDate
                                                    ).toLocaleDateString()
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                                                {slot.startTime?.substring(
                                                    0,
                                                    5
                                                )}{' '}
                                                -{' '}
                                                {slot.endTime?.substring(0, 5)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-slate-800 font-medium">
                                                        {slot.capacityKw} kW Total
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {
                                                            slot.availableCapacityKw
                                                        }{' '}
                                                        kW Available
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusStyle(
                                                        slot.status
                                                    )}`}
                                                >
                                                    {getSlotStatus(slot.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(slot)}
                                                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={currentPage} pageSize={pageSize} totalItems={filteredSlots.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />
                    </div>
                )}

            {showForm && (
                <SlotForm
                    slot={editSlot}
                    onClose={closeForm}
                    onSubmit={
                        editSlot ? handleUpdate : handleCreate
                    }
                />
            )}
        </div>
    )
}

export default Slots
