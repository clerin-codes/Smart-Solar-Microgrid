import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  getAllReservations,
} from '../../services/api/reservationService'

import {
  getAllStations,
} from '../../services/api/stationService'

import {
  getAllSlots,
} from '../../services/api/slotService'

import useAuth from '../../hooks/useAuth'

const AUTO_REFRESH_MS = 5000

/* =====================================================
   Helpers
===================================================== */

function normalizeReservationStatus(status) {
  if (
    status === 0 ||
    status === '0'
  ) {
    return 'Pending'
  }

  if (
    status === 1 ||
    status === '1'
  ) {
    return 'Approved'
  }

  if (
    status === 2 ||
    status === '2'
  ) {
    return 'Rejected'
  }

  if (
    status === 3 ||
    status === '3'
  ) {
    return 'Cancelled'
  }

  if (
    status === 4 ||
    status === '4'
  ) {
    return 'Completed'
  }

  return status || 'Unknown'
}

function normalizeTransactionStatus(status) {
  if (
    status === 0 ||
    status === '0'
  ) {
    return 'NotStarted'
  }

  if (
    status === 1 ||
    status === '1'
  ) {
    return 'Verified'
  }

  if (
    status === 2 ||
    status === '2'
  ) {
    return 'Completed'
  }

  return status || 'Unknown'
}

function normalizeSlotStatus(status) {
  if (
    status === 0 ||
    status === '0'
  ) {
    return 'Available'
  }

  if (
    status === 1 ||
    status === '1'
  ) {
    return 'Full'
  }

  if (
    status === 2 ||
    status === '2'
  ) {
    return 'Closed'
  }

  return status || 'Unknown'
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function formatTime(value) {
  if (!value) {
    return '—'
  }

  if (
    typeof value ===
    'string'
  ) {
    return value.slice(
      0,
      5,
    )
  }

  return String(value)
}

function formatNumber(value) {
  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 1,
    },
  ).format(
    Number(value) || 0,
  )
}

function getPercentage(
  value,
  total,
) {
  if (
    !total ||
    total <= 0
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.round(
      (value / total) *
        100,
    ),
  )
}

function isToday(value) {
  if (!value) {
    return false
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false
  }

  const today =
    new Date()

  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  )
}

/* =====================================================
   Icons
===================================================== */

function ReservationIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
      />

      <path d="M8 3v4M16 3v4M4 10h16" />

      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}

function PendingIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <path d="M12 8v4l2.5 1.5" />
    </svg>
  )
}

function ApprovedIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  )
}

function VerifiedIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />

      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function CompletedIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  )
}

function StationIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 21s6-5 6-11a6 6 0 1 0-12 0c0 6 6 11 6 11Z" />

      <circle
        cx="12"
        cy="10"
        r="2"
      />
    </svg>
  )
}

function SlotIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
      />

      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  )
}

function EnergyIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z" />
    </svg>
  )
}

function ArrowIcon({
  className = 'h-4 w-4',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  )
}

function QueueIcon({
  className = 'h-5 w-5',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M6 6h12M6 12h12M6 18h7" />

      <circle
        cx="18"
        cy="18"
        r="2"
      />
    </svg>
  )
}

/* =====================================================
   Stat Card
===================================================== */

function StatCard({
  title,
  value,
  description,
  icon,
  tone = 'blue',
}) {
  const styles = {
    blue:
      'bg-blue-100 text-blue-700',

    amber:
      'bg-amber-100 text-amber-700',

    green:
      'bg-emerald-100 text-emerald-700',

    purple:
      'bg-violet-100 text-violet-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            styles[tone] ??
            styles.blue
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">
            {title}
          </p>

          <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.04em] text-slate-950">
            {value}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =====================================================
   Reservation Status Donut
===================================================== */

function ReservationStatusDonut({
  items,
  total,
}) {
  const size = 210
  const strokeWidth = 23

  const radius =
    (size -
      strokeWidth) /
    2

  const circumference =
    2 *
    Math.PI *
    radius

  let cumulative = 0

  return (
    <div className="relative flex h-[210px] w-[210px] items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={
            size / 2
          }
          cy={
            size / 2
          }
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={
            strokeWidth
          }
        />

        {items.map(
          (
            item,
          ) => {
            const fraction =
              total > 0
                ? item.value /
                  total
                : 0

            const dash =
              fraction *
              circumference

            const offset =
              -cumulative *
              circumference

            cumulative +=
              fraction

            return (
              <circle
                key={
                  item.key
                }
                cx={
                  size / 2
                }
                cy={
                  size / 2
                }
                r={radius}
                fill="none"
                stroke={
                  item.color
                }
                strokeWidth={
                  strokeWidth
                }
                strokeDasharray={`${dash} ${
                  circumference -
                  dash
                }`}
                strokeDashoffset={
                  offset
                }
              />
            )
          },
        )}
      </svg>

      <div className="absolute text-center">
        <p className="text-[34px] font-bold tracking-[-0.05em] text-slate-950">
          {total}
        </p>

        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          Reservations
        </p>
      </div>
    </div>
  )
}

/* =====================================================
   Status Legend
===================================================== */

function StatusLegend({
  colorClassName,
  title,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${colorClassName}`}
        />

        <span className="text-sm font-medium text-slate-600">
          {title}
        </span>
      </div>

      <span className="text-[15px] font-bold text-slate-950">
        {value}
      </span>
    </div>
  )
}

/* =====================================================
   Workflow Step
===================================================== */

function WorkflowStep({
  title,
  value,
  description,
  icon,
  tone,
}) {
  const styles = {
    blue: {
      outer:
        'border-blue-100 bg-blue-50/70',

      icon:
        'bg-blue-100 text-blue-700',

      value:
        'text-blue-800',
    },

    violet: {
      outer:
        'border-violet-100 bg-violet-50/70',

      icon:
        'bg-violet-100 text-violet-700',

      value:
        'text-violet-800',
    },

    green: {
      outer:
        'border-emerald-100 bg-emerald-50/70',

      icon:
        'bg-emerald-100 text-emerald-700',

      value:
        'text-emerald-800',
    },
  }

  const selected =
    styles[tone]

  return (
    <div
      className={`relative flex-1 rounded-2xl border p-4 ${selected.outer}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected.icon}`}
        >
          {icon}
        </div>

        <p
          className={`text-[27px] font-bold leading-none tracking-[-0.04em] ${selected.value}`}
        >
          {value}
        </p>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

/* =====================================================
   Readiness Progress
===================================================== */

function ReadinessProgress({
  label,
  value,
  total,
  description,
  barClassName,
}) {
  const percent =
    getPercentage(
      value,
      total,
    )

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label}
          </p>

          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-950">
            {value}

            <span className="font-medium text-slate-400">
              {' / '}

              {total}
            </span>
          </p>

          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
            {percent}%
          </p>
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
          style={{
            width:
              `${percent}%`,
          }}
        />
      </div>
    </div>
  )
}

/* =====================================================
   Badge Components
===================================================== */

function ReservationBadge({
  status,
}) {
  const normalized =
    normalizeReservationStatus(
      status,
    )

  const styles = {
    Pending:
      'border-amber-200 bg-amber-50 text-amber-700',

    Approved:
      'border-blue-200 bg-blue-50 text-blue-700',

    Rejected:
      'border-red-200 bg-red-50 text-red-700',

    Cancelled:
      'border-slate-200 bg-slate-100 text-slate-600',

    Completed:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold ${
        styles[
          normalized
        ] ??
        'border-slate-200 bg-slate-100 text-slate-600'
      }`}
    >
      {normalized}
    </span>
  )
}

function TransactionBadge({
  status,
}) {
  const normalized =
    normalizeTransactionStatus(
      status,
    )

  const labels = {
    NotStarted:
      'Not Started',

    Verified:
      'QR Verified',

    Completed:
      'Completed',
  }

  const styles = {
    NotStarted:
      'bg-slate-100 text-slate-600',

    Verified:
      'bg-violet-50 text-violet-700',

    Completed:
      'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${
        styles[
          normalized
        ] ??
        'bg-slate-100 text-slate-600'
      }`}
    >
      {labels[
        normalized
      ] ??
        normalized}
    </span>
  )
}

/* =====================================================
   Today Card
===================================================== */

function TodayMetric({
  title,
  value,
  tone,
}) {
  const styles = {
    blue:
      'bg-blue-50 text-blue-700',

    violet:
      'bg-violet-50 text-violet-700',

    green:
      'bg-emerald-50 text-emerald-700',

    slate:
      'bg-slate-100 text-slate-700',
  }

  return (
    <div
      className={`rounded-xl px-4 py-4 text-center ${
        styles[tone]
      }`}
    >
      <p className="text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {title}
      </p>
    </div>
  )
}

/* =====================================================
   Operator Dashboard
===================================================== */

function OperatorDashboard() {
  const auth =
    useAuth()

  const user =
    auth?.user ??
    auth?.currentUser ??
    auth?.authUser ??
    null

  const navigate =
    useNavigate()

  const [
    reservations,
    setReservations,
  ] = useState([])

  const [
    stations,
    setStations,
  ] = useState([])

  const [
    slots,
    setSlots,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    warning,
    setWarning,
  ] = useState('')

  const requestInFlightRef =
    useRef(false)

  /* ===================================================
     Load Dashboard Data
  ==================================================== */

  const loadOverview =
    useCallback(
      async ({
        showLoader = false,
      } = {}) => {
        if (
          requestInFlightRef.current
        ) {
          return
        }

        requestInFlightRef.current =
          true

        if (
          showLoader
        ) {
          setLoading(true)
        }

        try {
          const results =
            await Promise.allSettled([
              getAllReservations(),
              getAllStations(),
              getAllSlots(),
            ])

          const [
            reservationResult,
            stationResult,
            slotResult,
          ] = results

          if (
            reservationResult.status ===
            'fulfilled'
          ) {
            setReservations(
              Array.isArray(
                reservationResult.value,
              )
                ? reservationResult.value
                : [],
            )
          }

          if (
            stationResult.status ===
            'fulfilled'
          ) {
            setStations(
              Array.isArray(
                stationResult.value,
              )
                ? stationResult.value
                : [],
            )
          }

          if (
            slotResult.status ===
            'fulfilled'
          ) {
            setSlots(
              Array.isArray(
                slotResult.value,
              )
                ? slotResult.value
                : [],
            )
          }

          const failures =
            results.filter(
              (
                result,
              ) =>
                result.status ===
                'rejected',
            ).length

          if (
            failures > 0
          ) {
            setWarning(
              'Some operational information is temporarily unavailable. Available information is still shown.',
            )
          } else {
            setWarning('')
          }
        } finally {
          requestInFlightRef.current =
            false

          if (
            showLoader
          ) {
            setLoading(false)
          }
        }
      },
      [],
    )

  /* ===================================================
     Initial Load
  ==================================================== */

  useEffect(() => {
    loadOverview({
      showLoader: true,
    })
  }, [
    loadOverview,
  ])

  /* ===================================================
     Automatic Background Refresh
  ==================================================== */

  useEffect(() => {
    function refreshData() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadOverview()
      }
    }

    const intervalId =
      window.setInterval(
        refreshData,
        AUTO_REFRESH_MS,
      )

    window.addEventListener(
      'focus',
      refreshData,
    )

    document.addEventListener(
      'visibilitychange',
      refreshData,
    )

    return () => {
      window.clearInterval(
        intervalId,
      )

      window.removeEventListener(
        'focus',
        refreshData,
      )

      document.removeEventListener(
        'visibilitychange',
        refreshData,
      )
    }
  }, [
    loadOverview,
  ])

  /* ===================================================
     Reservation Statistics
  ==================================================== */

  const reservationStats =
    useMemo(() => {
      const pending =
        reservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Pending',
        ).length

      const approved =
        reservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Approved',
        ).length

      const rejected =
        reservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Rejected',
        ).length

      const cancelled =
        reservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Cancelled',
        ).length

      const completed =
        reservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
              'Completed' ||
            normalizeTransactionStatus(
              item.transactionStatus,
            ) ===
              'Completed',
        ).length

      const verified =
        reservations.filter(
          (
            item,
          ) =>
            normalizeTransactionStatus(
              item.transactionStatus,
            ) ===
            'Verified',
        ).length

      return {
        total:
          reservations.length,

        pending,

        approved,

        rejected,

        cancelled,

        completed,

        verified,
      }
    }, [
      reservations,
    ])

  /* ===================================================
     Today's Statistics
  ==================================================== */

  const todayStats =
    useMemo(() => {
      const todayReservations =
        reservations.filter(
          (
            item,
          ) =>
            isToday(
              item.reservationDate,
            ),
        )

      const pending =
        todayReservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Pending',
        ).length

      const approved =
        todayReservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
            'Approved',
        ).length

      const verified =
        todayReservations.filter(
          (
            item,
          ) =>
            normalizeTransactionStatus(
              item.transactionStatus,
            ) ===
            'Verified',
        ).length

      const completed =
        todayReservations.filter(
          (
            item,
          ) =>
            normalizeReservationStatus(
              item.status,
            ) ===
              'Completed' ||
            normalizeTransactionStatus(
              item.transactionStatus,
            ) ===
              'Completed',
        ).length

      return {
        total:
          todayReservations.length,

        pending,

        approved,

        verified,

        completed,
      }
    }, [
      reservations,
    ])

  /* ===================================================
     Grid Statistics
  ==================================================== */

  const gridStats =
    useMemo(() => {
      const activeStations =
        stations.filter(
          (
            station,
          ) =>
            station.isActive !==
            false,
        )

      const inactiveStations =
        stations.length -
        activeStations.length

      const availableSlots =
        slots.filter(
          (
            slot,
          ) =>
            normalizeSlotStatus(
              slot.status,
            ) ===
            'Available',
        )

      const fullSlots =
        slots.filter(
          (
            slot,
          ) =>
            normalizeSlotStatus(
              slot.status,
            ) ===
            'Full',
        )

      const closedSlots =
        slots.filter(
          (
            slot,
          ) =>
            normalizeSlotStatus(
              slot.status,
            ) ===
            'Closed',
        )

      const totalCapacity =
        activeStations.reduce(
          (
            total,
            station,
          ) =>
            total +
            Number(
              station.capacityKw ??
                station.capacityKW ??
                station.capacity ??
                0,
            ),
          0,
        )

      return {
        totalStations:
          stations.length,

        activeStations:
          activeStations.length,

        inactiveStations,

        totalSlots:
          slots.length,

        availableSlots:
          availableSlots.length,

        fullSlots:
          fullSlots.length,

        closedSlots:
          closedSlots.length,

        totalCapacity,
      }
    }, [
      stations,
      slots,
    ])

  /* ===================================================
     Pending Queue
  ==================================================== */

  const pendingQueue =
    useMemo(
      () =>
        reservations
          .filter(
            (
              item,
            ) =>
              normalizeReservationStatus(
                item.status,
              ) ===
              'Pending',
          )
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                first.reservationDate ??
                  first.createdAt ??
                  0,
              ).getTime() -
              new Date(
                second.reservationDate ??
                  second.createdAt ??
                  0,
              ).getTime(),
          )
          .slice(
            0,
            5,
          ),
      [
        reservations,
      ],
    )

  /* ===================================================
     Recent Reservations
  ==================================================== */

  const recentReservations =
    useMemo(
      () =>
        [
          ...reservations,
        ]
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                second.createdAt ??
                  second.reservationDate ??
                  0,
              ).getTime() -
              new Date(
                first.createdAt ??
                  first.reservationDate ??
                  0,
              ).getTime(),
          )
          .slice(
            0,
            6,
          ),
      [
        reservations,
      ],
    )

  /* ===================================================
     Chart Data
  ==================================================== */

  const statusChartData =
    useMemo(
      () => [
        {
          key:
            'pending',

          label:
            'Pending',

          value:
            reservationStats.pending,

          color:
            '#f59e0b',

          dot:
            'bg-amber-500',
        },

        {
          key:
            'approved',

          label:
            'Approved',

          value:
            reservationStats.approved,

          color:
            '#2563eb',

          dot:
            'bg-blue-600',
        },

        {
          key:
            'completed',

          label:
            'Completed',

          value:
            reservationStats.completed,

          color:
            '#10b981',

          dot:
            'bg-emerald-500',
        },

        {
          key:
            'rejected',

          label:
            'Rejected',

          value:
            reservationStats.rejected,

          color:
            '#ef4444',

          dot:
            'bg-red-500',
        },

        {
          key:
            'cancelled',

          label:
            'Cancelled',

          value:
            reservationStats.cancelled,

          color:
            '#94a3b8',

          dot:
            'bg-slate-400',
        },
      ],
      [
        reservationStats,
      ],
    )

  return (
    <div className="space-y-6">
      {/* =================================================
          PAGE HEADER
      ================================================== */}

      <section>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
          Overview
        </h1>

        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
          Welcome
          {user?.fullName
            ? `, ${user.fullName}`
            : ''}
          . Monitor reservation processing, energy-transfer activity and microgrid readiness.
        </p>
      </section>

      {/* =================================================
          WARNING
      ================================================== */}

      {warning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {warning}
        </div>
      )}

      {/* =================================================
          PRIMARY STATS
      ================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Reservations"
          value={
            loading
              ? '—'
              : reservationStats.total
          }
          description="Reservations across the microgrid"
          tone="blue"
          icon={
            <ReservationIcon />
          }
        />

        <StatCard
          title="Pending Approval"
          value={
            loading
              ? '—'
              : reservationStats.pending
          }
          description="Waiting for Grid Operator review"
          tone="amber"
          icon={
            <PendingIcon />
          }
        />

        <StatCard
          title="Active Stations"
          value={
            loading
              ? '—'
              : gridStats.activeStations
          }
          description={`${gridStats.totalStations} total stations registered`}
          tone="green"
          icon={
            <StationIcon />
          }
        />

        <StatCard
          title="Available Energy Slots"
          value={
            loading
              ? '—'
              : gridStats.availableSlots
          }
          description={`${gridStats.totalSlots} total slots configured`}
          tone="purple"
          icon={
            <SlotIcon />
          }
        />
      </section>

      {/* =================================================
          STATUS + GRID READINESS
      ================================================== */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        {/* =================================================
            RESERVATION STATUS
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                Reservation Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current distribution of reservation states.
              </p>
            </div>

            <Link
              to="/operator/reservations"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-blue-700 transition hover:text-blue-900"
            >
              View all

              <ArrowIcon />
            </Link>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[230px_1fr]">
            <div className="flex justify-center">
              <ReservationStatusDonut
                items={
                  statusChartData
                }
                total={
                  reservationStats.total
                }
              />
            </div>

            <div>
              {statusChartData.map(
                (
                  item,
                ) => (
                  <StatusLegend
                    key={
                      item.key
                    }
                    colorClassName={
                      item.dot
                    }
                    title={
                      item.label
                    }
                    value={
                      item.value
                    }
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            GRID READINESS
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                Grid Readiness
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current infrastructure available for energy transfers.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <EnergyIcon />
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600/70">
                    Active Network Capacity
                  </p>

                  <p className="mt-2 text-[32px] font-bold tracking-[-0.045em] text-slate-950">
                    {loading
                      ? '—'
                      : formatNumber(
                          gridStats.totalCapacity,
                        )}

                    {!loading && (
                      <span className="ml-1.5 text-sm font-semibold text-slate-500">
                        kW
                      </span>
                    )}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Combined capacity of active stations
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm ring-1 ring-slate-200">
                  <EnergyIcon className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <ReadinessProgress
                label="Station Availability"
                value={
                  gridStats.activeStations
                }
                total={
                  gridStats.totalStations
                }
                description="Active solar stations"
                barClassName="bg-emerald-500"
              />

              <ReadinessProgress
                label="Energy Slot Availability"
                value={
                  gridStats.availableSlots
                }
                total={
                  gridStats.totalSlots
                }
                description="Slots available for reservations"
                barClassName="bg-blue-600"
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-100 px-3 py-3.5 text-center">
                <p className="text-xl font-bold text-slate-800">
                  {
                    gridStats.inactiveStations
                  }
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Inactive Stations
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 px-3 py-3.5 text-center">
                <p className="text-xl font-bold text-orange-700">
                  {
                    gridStats.fullSlots
                  }
                </p>

                <p className="mt-1 text-sm font-semibold text-orange-600">
                  Full Slots
                </p>
              </div>

              <div className="rounded-xl bg-red-50 px-3 py-3.5 text-center">
                <p className="text-xl font-bold text-red-700">
                  {
                    gridStats.closedSlots
                  }
                </p>

                <p className="mt-1 text-sm font-semibold text-red-600">
                  Closed Slots
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          TRANSFER WORKFLOW
      ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Energy Transfer Workflow
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Operational progress from reservation approval to completed transfer.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <VerifiedIcon />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <WorkflowStep
            title="Approved"
            value={
              reservationStats.approved
            }
            description="Reservations approved and ready for operation."
            icon={
              <ApprovedIcon />
            }
            tone="blue"
          />

          <WorkflowStep
            title="QR Verified"
            value={
              reservationStats.verified
            }
            description="Reservation QR verified before energy transfer."
            icon={
              <VerifiedIcon />
            }
            tone="violet"
          />

          <WorkflowStep
            title="Completed"
            value={
              reservationStats.completed
            }
            description="Energy transfer successfully completed."
            icon={
              <CompletedIcon />
            }
            tone="green"
          />
        </div>
      </section>

      {/* =================================================
          PENDING QUEUE + TODAY
      ================================================== */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        {/* =================================================
            PENDING QUEUE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <QueueIcon />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                    Pending Approval Queue
                  </h2>

                  {!loading &&
                    reservationStats.pending >
                      0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {
                          reservationStats.pending
                        }
                      </span>
                    )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Reservations waiting for Grid Operator review.
                </p>
              </div>
            </div>

            <Link
              to="/operator/reservations"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View all

              <ArrowIcon />
            </Link>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading approval queue...
              </p>
            </div>
          ) : pendingQueue.length ===
            0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ApprovedIcon />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-800">
                No pending reservations
              </p>

              <p className="mt-1 text-sm text-slate-500">
                The approval queue is currently clear.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingQueue.map(
                (
                  reservation,
                ) => (
                  <div
                    key={
                      reservation.id
                    }
                    className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50/60 md:flex-row md:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <PendingIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {reservation.reservationNumber ??
                            'Reservation'}
                        </p>

                        <ReservationBadge
                          status={
                            reservation.status
                          }
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Prosumer NIC:{' '}

                        <span className="font-semibold text-slate-700">
                          {reservation.prosumerNIC ??
                            '—'}
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0 md:min-w-[170px]">
                      <p className="text-sm font-semibold text-slate-700">
                        {formatDate(
                          reservation.reservationDate,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTime(
                          reservation.startTime,
                        )}

                        {' – '}

                        {formatTime(
                          reservation.endTime,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/operator/reservations/${reservation.id}`,
                        )
                      }
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                    >
                      Review

                      <ArrowIcon />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* =================================================
            TODAY'S OPERATIONS
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Today's Operations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reservation and transfer activity scheduled for today.
            </p>
          </div>

          <div className="p-5">
            <div className="rounded-2xl bg-slate-50 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Today's Reservations
              </p>

              <p className="mt-2 text-[36px] font-bold tracking-[-0.05em] text-slate-950">
                {
                  todayStats.total
                }
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <TodayMetric
                title="Pending"
                value={
                  todayStats.pending
                }
                tone="slate"
              />

              <TodayMetric
                title="Approved"
                value={
                  todayStats.approved
                }
                tone="blue"
              />

              <TodayMetric
                title="QR Verified"
                value={
                  todayStats.verified
                }
                tone="violet"
              />

              <TodayMetric
                title="Completed"
                value={
                  todayStats.completed
                }
                tone="green"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          RECENT RESERVATIONS
      ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Recent Reservation Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest reservation activity across the microgrid.
            </p>
          </div>

          <Link
            to="/operator/reservations"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
          >
            View all

            <ArrowIcon />
          </Link>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading reservations...
            </p>
          </div>
        ) : recentReservations.length ===
          0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <ReservationIcon />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800">
              No reservation activity
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Reservation activity will appear here when available.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto xl:overflow-x-visible">
            <table className="w-full min-w-[900px] table-auto xl:min-w-0">
              <colgroup>
                <col className="w-[20%]" />

                <col className="w-[18%]" />

                <col className="w-[24%]" />

                <col className="w-[14%]" />

                <col className="w-[15%]" />

                <col className="w-[9%]" />
              </colgroup>

              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80">
                  <th className="px-5 py-4 text-left text-sm font-bold text-slate-800">
                    Reservation
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">
                    Prosumer
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">
                    Schedule
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">
                    Status
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">
                    Transaction
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentReservations.map(
                  (
                    reservation,
                  ) => (
                    <tr
                      key={
                        reservation.id
                      }
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <ReservationIcon className="h-4 w-4" />
                          </div>

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {reservation.reservationNumber ??
                              '—'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                        {reservation.prosumerNIC ??
                          '—'}
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(
                            reservation.reservationDate,
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatTime(
                            reservation.startTime,
                          )}

                          {' – '}

                          {formatTime(
                            reservation.endTime,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <ReservationBadge
                          status={
                            reservation.status
                          }
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <TransactionBadge
                          status={
                            reservation.transactionStatus
                          }
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/operator/reservations/${reservation.id}`,
                            )
                          }
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default OperatorDashboard