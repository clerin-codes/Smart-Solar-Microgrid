import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  getAllReservations,
} from '../../services/api/reservationService'

const RESERVATION_STATUS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Cancelled',
  4: 'Completed',
}

const TRANSACTION_STATUS = {
  0: 'Not Started',
  1: 'Verified',
  2: 'Completed',
}

function getReservationStatus(status) {
  return (
    RESERVATION_STATUS[status] ??
    'Unknown'
  )
}

function getTransactionStatus(status) {
  return (
    TRANSACTION_STATUS[status] ??
    'Unknown'
  )
}

function getStatusStyle(status) {
  switch (status) {
    case 0:
      return 'bg-amber-50 text-amber-700 border-amber-200'

    case 1:
      return 'bg-blue-50 text-blue-700 border-blue-200'

    case 2:
      return 'bg-red-50 text-red-700 border-red-200'

    case 3:
      return 'bg-slate-100 text-slate-600 border-slate-200'

    case 4:
      return 'bg-green-50 text-green-700 border-green-200'

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function getTransactionStyle(status) {
  switch (status) {
    case 0:
      return 'bg-slate-100 text-slate-600 border-slate-200'

    case 1:
      return 'bg-blue-50 text-blue-700 border-blue-200'

    case 2:
      return 'bg-green-50 text-green-700 border-green-200'

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function Reservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const navigate = useNavigate()

  // =====================================================
  // Load Reservations
  // =====================================================

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await getAllReservations()

        setReservations(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (err) {
        console.error(
          'Failed to load reservations:',
          err
        )

        setError(
          'Unable to load reservations. Please check the server connection.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  // =====================================================
  // Search + Filter
  // =====================================================

  const filteredReservations = useMemo(() => {
    return reservations.filter(
      (reservation) => {
        const reservationId =
          String(
            reservation.id ?? ''
          ).toLowerCase()

        const reservationNumber =
          String(
            reservation.reservationNumber ?? ''
          ).toLowerCase()

        const searchValue =
          search.toLowerCase()

        const matchesSearch =
          reservationId.includes(
            searchValue
          ) ||
          reservationNumber.includes(
            searchValue
          )

        const matchesStatus =
          statusFilter === 'all' ||
          String(
            reservation.status
          ) === statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )
  }, [
    reservations,
    search,
    statusFilter,
  ])

  // =====================================================
  // Summary Counts
  // =====================================================

  const totalReservations =
    reservations.length

  const pendingReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === 0
    ).length

  const approvedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === 1
    ).length

  const completedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === 4
    ).length

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Reservations
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage solar energy reservations
        </p>
      </div>

      {/* =================================================
          Summary Cards
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Total Reservations
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalReservations}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {pendingReservations}
          </p>
        </div>

        {/* Approved */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {approvedReservations}
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-500">
            Completed
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {completedReservations}
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
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by reservation ID or number..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">
              All Statuses
            </option>

            <option value="0">
              Pending
            </option>

            <option value="1">
              Approved
            </option>

            <option value="2">
              Rejected
            </option>

            <option value="3">
              Cancelled
            </option>

            <option value="4">
              Completed
            </option>
          </select>

        </div>

      </div>

      {/* =================================================
          Loading
      ================================================= */}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-500">
            Loading reservations...
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
        filteredReservations.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

            <h2 className="text-lg font-semibold text-slate-700">
              No Reservations Found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No reservations match your current search or filter.
            </p>

          </div>
        )}

      {/* =================================================
          Reservations Table
      ================================================= */}

      {!loading &&
        !error &&
        filteredReservations.length > 0 && (

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                {/* Table Header */}
                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Reservation
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Prosumer
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Transaction
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100">

                  {filteredReservations.map(
                    (reservation) => (

                      <tr
                        key={reservation.id}
                        className="hover:bg-slate-50 transition"
                      >

                        {/* Reservation Number */}
                        <td className="px-6 py-4">

                          <div>
                            <p className="font-medium text-slate-800">
                              {reservation.reservationNumber ||
                                '-'}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {reservation.id}
                            </p>
                          </div>

                        </td>

                        {/* Prosumer NIC */}
                        <td className="px-6 py-4">

                          <span className="text-slate-700">
                            {reservation.prosumerNIC ||
                              '-'}
                          </span>

                        </td>

                        {/* Reservation Status */}
                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusStyle(
                              reservation.status
                            )}`}
                          >
                            {getReservationStatus(
                              reservation.status
                            )}
                          </span>

                        </td>

                        {/* Transaction Status */}
                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${getTransactionStyle(
                              reservation.transactionStatus
                            )}`}
                          >
                            {getTransactionStatus(
                              reservation.transactionStatus
                            )}
                          </span>

                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">

                          {reservation.reservationDate
                            ? new Date(
                                reservation.reservationDate
                              ).toLocaleDateString()
                            : '-'}

                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/operator/reservations/${reservation.id}`
                              )
                            }
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

    </div>
  )
}

export default Reservations