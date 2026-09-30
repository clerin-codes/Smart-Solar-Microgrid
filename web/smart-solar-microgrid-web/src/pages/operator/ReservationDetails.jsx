import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getReservationById,
  approveReservation,
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
  return RESERVATION_STATUS[status] ?? 'Unknown'
}

function getTransactionStatus(status) {
  return TRANSACTION_STATUS[status] ?? 'Unknown'
}

function getReservationStatusStyle(status) {
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

function getTransactionStatusStyle(status) {
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

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString()
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function ReservationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)

  const [approving, setApproving] = useState(false)

  const [error, setError] = useState('')
  const [approveError, setApproveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // =====================================================
  // Load Reservation
  // =====================================================

  const loadReservation = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getReservationById(id)

      setReservation(data)
    } catch (err) {
      console.error(
        'Failed to load reservation:',
        err
      )

      setError(
        'Unable to load reservation details.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // Initial Load
  // =====================================================

  useEffect(() => {
    if (id) {
      loadReservation()
    }
  }, [id])

  // =====================================================
  // Approve Reservation
  // =====================================================

  const handleApprove = async () => {
    try {
      setApproving(true)
      setApproveError('')
      setSuccessMessage('')

      await approveReservation(id)

      setSuccessMessage(
        'Reservation approved successfully.'
      )

      // Reload reservation from backend
      await loadReservation()
    } catch (err) {
      console.error(
        'Failed to approve reservation:',
        err
      )

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        'Unable to approve reservation.'

      setApproveError(message)
    } finally {
      setApproving(false)
    }
  }

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">
          Loading reservation details...
        </p>
      </div>
    )
  }

  // =====================================================
  // Error
  // =====================================================

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate('/operator/reservations')
          }
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Reservations
        </button>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      </div>
    )
  }

  // =====================================================
  // Reservation Not Found
  // =====================================================

  if (!reservation) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() =>
            navigate('/operator/reservations')
          }
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Back to Reservations
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-700">
            Reservation Not Found
          </h2>
        </div>
      </div>
    )
  }

  // =====================================================
  // Page
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          Header
      ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>

          <button
            type="button"
            onClick={() =>
              navigate('/operator/reservations')
            }
            className="text-sm text-slate-500 hover:text-slate-800 mb-3"
          >
            ← Back to Reservations
          </button>

          <h1 className="text-2xl font-bold text-slate-800">
            Reservation Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage reservation information
          </p>

        </div>
      </div>

      {/* =================================================
          Success Message
      ================================================= */}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-700">
            {successMessage}
          </p>
        </div>
      )}

      {/* =================================================
          Approve Error
      ================================================= */}

      {approveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700">
            {approveError}
          </p>
        </div>
      )}

      {/* =================================================
          Reservation Summary
      ================================================= */}

      <div className="bg-white border border-slate-200 rounded-xl p-6">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

          <div>

            <p className="text-sm text-slate-500">
              Reservation Number
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-800">
              {reservation.reservationNumber}
            </h2>

          </div>

          {/* Status Badges */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Reservation Status */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Reservation Status
              </span>

              <span
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-sm font-medium ${getReservationStatusStyle(
                  reservation.status
                )}`}
              >
                {getReservationStatus(
                  reservation.status
                )}
              </span>
            </div>

            {/* Transaction Status */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Transaction Status
              </span>

              <span
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full border text-sm font-medium ${getTransactionStatusStyle(
                  reservation.transactionStatus
                )}`}
              >
                {getTransactionStatus(
                  reservation.transactionStatus
                )}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          Reservation Information
      ================================================= */}

      <div className="bg-white border border-slate-200 rounded-xl p-6">

        <h2 className="text-lg font-semibold text-slate-800 mb-5">
          Reservation Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Prosumer NIC */}
          <div>
            <p className="text-sm text-slate-500">
              Prosumer NIC
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {reservation.prosumerNIC || '-'}
            </p>
          </div>

          {/* Station */}
          <div>
            <p className="text-sm text-slate-500">
              Station ID
            </p>

            <p className="mt-1 font-medium text-slate-800 break-all">
              {reservation.stationId || '-'}
            </p>
          </div>

          {/* Slot */}
          <div>
            <p className="text-sm text-slate-500">
              Slot ID
            </p>

            <p className="mt-1 font-medium text-slate-800 break-all">
              {reservation.slotId || '-'}
            </p>
          </div>

          {/* Reservation Date */}
          <div>
            <p className="text-sm text-slate-500">
              Reservation Date
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {formatDate(
                reservation.reservationDate
              )}
            </p>
          </div>

          {/* Start Time */}
          <div>
            <p className="text-sm text-slate-500">
              Start Time
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {reservation.startTime || '-'}
            </p>
          </div>

          {/* End Time */}
          <div>
            <p className="text-sm text-slate-500">
              End Time
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {reservation.endTime || '-'}
            </p>
          </div>

        </div>

      </div>

      {/* =================================================
          Processing Information
      ================================================= */}

      <div className="bg-white border border-slate-200 rounded-xl p-6">

        <h2 className="text-lg font-semibold text-slate-800 mb-5">
          Processing Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Approved By */}
          <div>
            <p className="text-sm text-slate-500">
              Approved By
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {reservation.approvedBy || '-'}
            </p>
          </div>

          {/* Completed By */}
          <div>
            <p className="text-sm text-slate-500">
              Completed By
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {reservation.completedBy || '-'}
            </p>
          </div>

          {/* Completed At */}
          <div>
            <p className="text-sm text-slate-500">
              Completed At
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {formatDateTime(
                reservation.completedAt
              )}
            </p>
          </div>

          {/* Created At */}
          <div>
            <p className="text-sm text-slate-500">
              Created At
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {formatDateTime(
                reservation.createdAt
              )}
            </p>
          </div>

        </div>

      </div>

      {/* =================================================
          Actions
      ================================================= */}

      <div className="flex flex-wrap gap-3">

        {/* Approve */}
        {reservation.status === 0 && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={approving}
            className={`px-5 py-2.5 text-white rounded-lg transition font-medium ${
              approving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {approving
              ? 'Approving...'
              : 'Approve Reservation'}
          </button>
        )}

        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate('/operator/reservations')
          }
          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
        >
          Back
        </button>

      </div>

    </div>
  )
}

export default ReservationDetails