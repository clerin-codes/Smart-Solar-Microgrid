import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

import {
  getUsers,
} from '../../services/api/userService'

import {
  getAllStations,
} from '../../services/api/stationService'

import {
  getAllSlots,
} from '../../services/api/slotService'

/* =====================================================
   Helpers
===================================================== */

function normalizeAccountStatus(status) {
  if (
    status === 0 ||
    status === '0'
  ) {
    return 'Active'
  }

  if (
    status === 1 ||
    status === '1'
  ) {
    return 'PendingActivation'
  }

  if (
    status === 2 ||
    status === '2'
  ) {
    return 'DeactivationRequested'
  }

  if (
    status === 3 ||
    status === '3'
  ) {
    return 'Deactivated'
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

/* =====================================================
   Icons
===================================================== */

function UsersIcon({
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
        cx="9"
        cy="8"
        r="3"
      />

      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />

      <path d="M16 6.5a2.5 2.5 0 0 1 0 5" />

      <path d="M17 14a5 5 0 0 1 4 5" />
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

function WarningIcon({
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
      <path d="M12 4 3 20h18L12 4Z" />

      <path d="M12 9v5M12 17h.01" />
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

/* =====================================================
   Stat Card
===================================================== */

function StatCard({
  title,
  value,
  description,
  icon,
  iconClassName,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-slate-600">
            {title}
          </p>

          <p className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>

          <p className="mt-1.5 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

/* =====================================================
   Account Status Donut
===================================================== */

function AccountStatusDonut({
  data,
  total,
}) {
  const size =
    206

  const strokeWidth =
    23

  const radius =
    (size -
      strokeWidth) /
    2

  const circumference =
    2 *
    Math.PI *
    radius

  let cumulative =
    0

  const colors = {
    Active:
      '#10b981',

    PendingActivation:
      '#f59e0b',

    DeactivationRequested:
      '#ef4444',

    Deactivated:
      '#94a3b8',
  }

  return (
    <div className="relative flex h-[206px] w-[206px] items-center justify-center">
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

        {data.map(
          (
            item,
          ) => {
            const part =
              total > 0
                ? item.value /
                  total
                : 0

            const dash =
              part *
              circumference

            const offset =
              -cumulative *
              circumference

            cumulative +=
              part

            return (
              <circle
                key={
                  item.status
                }
                cx={
                  size /
                  2
                }
                cy={
                  size /
                  2
                }
                r={
                  radius
                }
                fill="none"
                stroke={
                  colors[
                    item.status
                  ]
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
        <p className="text-[32px] font-bold tracking-[-0.045em] text-slate-950">
          {total}
        </p>

        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          Accounts
        </p>
      </div>
    </div>
  )
}

/* =====================================================
   Legend Row
===================================================== */

function LegendRow({
  dotClassName,
  title,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotClassName}`}
        />

        <p className="text-sm font-medium text-slate-600">
          {title}
        </p>
      </div>

      <p className="text-[15px] font-bold text-slate-950">
        {value}
      </p>
    </div>
  )
}

/* =====================================================
   Account Type Graph
===================================================== */

function AccountTypeChart({
  data,
}) {
  const maximum =
    Math.max(
      ...data.map(
        (item) =>
          item.value,
      ),
      1,
    )

  return (
    <div className="pt-3">
      <div className="relative h-[238px]">
        {/* Background guide lines */}

        <div className="absolute inset-x-0 top-5 h-px bg-slate-100" />

        <div className="absolute inset-x-0 top-[65px] h-px bg-slate-100" />

        <div className="absolute inset-x-0 top-[115px] h-px bg-slate-100" />

        <div className="absolute inset-x-0 top-[165px] h-px bg-slate-100" />

        <div className="absolute inset-x-0 bottom-[40px] h-px bg-slate-200" />

        <div className="relative flex h-[198px] items-end justify-around gap-7 px-5">
          {data.map(
            (
              item,
            ) => {
              const barHeight =
                item.value >
                0
                  ? Math.max(
                      25,
                      (item.value /
                        maximum) *
                        160,
                    )
                  : 5

              return (
                <div
                  key={
                    item.label
                  }
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <span
                    className={`mb-2 inline-flex min-w-[34px] items-center justify-center rounded-lg px-2 py-1 text-sm font-bold ${item.numberClassName}`}
                  >
                    {
                      item.value
                    }
                  </span>

                  <div
                    className={`w-full max-w-[76px] rounded-t-xl ${item.barClassName}`}
                    style={{
                      height:
                        `${barHeight}px`,
                    }}
                  />
                </div>
              )
            },
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-around gap-7 px-5">
          {data.map(
            (
              item,
            ) => (
              <p
                key={
                  item.label
                }
                className="flex-1 text-center text-sm font-medium text-slate-600"
              >
                {
                  item.label
                }
              </p>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

/* =====================================================
   Station Availability Ring
===================================================== */

function StationAvailabilityRing({
  active,
  inactive,
}) {
  const total =
    active +
    inactive

  const activePercentage =
    getPercentage(
      active,
      total,
    )

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full"
        style={{
          background:
            `conic-gradient(
              #10b981 0% ${activePercentage}%,
              #e2e8f0 ${activePercentage}% 100%
            )`,
        }}
      >
        <div className="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <p className="text-[27px] font-bold tracking-[-0.04em] text-slate-950">
            {activePercentage}%
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-400">
            Available
          </p>
        </div>
      </div>

      {/*
        Left side = gray/inactive half
        Right side = green/active half
      */}

      <div className="mt-5 grid w-full max-w-[220px] grid-cols-[1fr_auto_1fr] items-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />

            <p className="text-sm font-medium text-slate-500">
              Inactive
            </p>
          </div>

          <p className="mt-1 text-xl font-bold text-slate-950">
            {inactive}
          </p>
        </div>

        <div className="h-10 w-px bg-slate-200" />

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <p className="text-sm font-medium text-slate-500">
              Active
            </p>
          </div>

          <p className="mt-1 text-xl font-bold text-slate-950">
            {active}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =====================================================
   Energy Slot Availability
===================================================== */

function SlotAvailabilityGraph({
  available,
  full,
  closed,
}) {
  const total =
    available +
    full +
    closed

  const availablePercent =
    total > 0
      ? (available /
          total) *
        100
      : 0

  const fullPercent =
    total > 0
      ? (full /
          total) *
        100
      : 0

  const closedPercent =
    total > 0
      ? (closed /
          total) *
        100
      : 0

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
            Total Energy Slots
          </p>

          <p className="mt-2 text-[30px] font-bold tracking-[-0.045em] text-slate-950">
            {total}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-3 py-2 text-right">
          <p className="text-[18px] font-bold text-blue-700">
            {
              Math.round(
                availablePercent,
              )
            }
            %
          </p>

          <p className="text-sm font-semibold text-blue-600">
            Available
          </p>
        </div>
      </div>

      {/* Stacked graph */}

      <div className="mt-6">
        <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
          {available >
            0 && (
            <div
              className="h-full bg-blue-600"
              style={{
                width:
                  `${availablePercent}%`,
              }}
            />
          )}

          {full > 0 && (
            <div
              className="h-full bg-orange-500"
              style={{
                width:
                  `${fullPercent}%`,
              }}
            />
          )}

          {closed >
            0 && (
            <div
              className="h-full bg-red-500"
              style={{
                width:
                  `${closedPercent}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Numeric status */}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-blue-50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />

            <p className="text-sm font-semibold text-blue-700">
              Available
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-blue-900">
            {available}
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />

            <p className="text-sm font-semibold text-orange-700">
              Full
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-orange-900">
            {full}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

            <p className="text-sm font-semibold text-red-700">
              Closed
            </p>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-900">
            {closed}
          </p>
        </div>
      </div>
    </div>
  )
}

/* =====================================================
   Action Row
===================================================== */

function ActionRow({
  to,
  icon,
  iconClassName,
  title,
  description,
  value,
  valueClassName,
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 transition-all duration-200 hover:border-blue-200 hover:bg-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)]"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">
          {title}
        </p>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p
          className={`text-[22px] font-bold ${valueClassName}`}
        >
          {value}
        </p>

        <span className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-700">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

/* =====================================================
   Large Quick Access Card
===================================================== */

function QuickAccessCard({
  to,
  icon,
  iconClassName,
  title,
  description,
  footer,
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-6 shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          {icon}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
          <ArrowIcon />
        </div>
      </div>

      <h3 className="mt-5 text-[17px] font-bold tracking-[-0.02em] text-slate-950">
        {title}
      </h3>

      <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 transition group-hover:text-blue-700">
          {footer}
        </p>
      </div>
    </Link>
  )
}

/* =====================================================
   Backoffice Dashboard
===================================================== */

function BackofficeDashboard() {
  const auth =
    useAuth()

  const currentUser =
    auth?.user ??
    auth?.currentUser ??
    auth?.authUser ??
    null

  const [
    users,
    setUsers,
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

  /* ===================================================
     Load Data
  ==================================================== */

  const loadOverview =
    useCallback(
      async () => {
        const results =
          await Promise.allSettled([
            getUsers({}),
            getAllStations(),
            getAllSlots(),
          ])

        const [
          usersResult,
          stationsResult,
          slotsResult,
        ] = results

        if (
          usersResult.status ===
          'fulfilled'
        ) {
          setUsers(
            Array.isArray(
              usersResult.value,
            )
              ? usersResult.value
              : [],
          )
        }

        if (
          stationsResult.status ===
          'fulfilled'
        ) {
          setStations(
            Array.isArray(
              stationsResult.value,
            )
              ? stationsResult.value
              : [],
          )
        }

        if (
          slotsResult.status ===
          'fulfilled'
        ) {
          setSlots(
            Array.isArray(
              slotsResult.value,
            )
              ? slotsResult.value
              : [],
          )
        }

        const failed =
          results.filter(
            (result) =>
              result.status ===
              'rejected',
          ).length

        if (
          failed > 0
        ) {
          setWarning(
            'Some overview information is temporarily unavailable.',
          )
        } else {
          setWarning('')
        }

        setLoading(false)
      },
      [],
    )

  /* ===================================================
     Automatic Background Refresh
  ==================================================== */

  useEffect(() => {
    loadOverview()

    const interval =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            'visible'
          ) {
            loadOverview()
          }
        },
        10000,
      )

    function handleFocus() {
      loadOverview()
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadOverview()
      }
    }

    window.addEventListener(
      'focus',
      handleFocus,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      window.clearInterval(
        interval,
      )

      window.removeEventListener(
        'focus',
        handleFocus,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [loadOverview])

  /* ===================================================
     Account Statistics
  ==================================================== */

  const accounts =
    useMemo(() => {
      const active =
        users.filter(
          (user) =>
            normalizeAccountStatus(
              user.status,
            ) ===
            'Active',
        ).length

      const pending =
        users.filter(
          (user) =>
            normalizeAccountStatus(
              user.status,
            ) ===
            'PendingActivation',
        ).length

      const deactivationRequested =
        users.filter(
          (user) =>
            normalizeAccountStatus(
              user.status,
            ) ===
            'DeactivationRequested',
        ).length

      const deactivated =
        users.filter(
          (user) =>
            normalizeAccountStatus(
              user.status,
            ) ===
            'Deactivated',
        ).length

      const backoffice =
        users.filter(
          (user) =>
            user.role ===
            'Backoffice',
        ).length

      const gridOperators =
        users.filter(
          (user) =>
            user.role ===
            'GridOperator',
        ).length

      const prosumers =
        users.filter(
          (user) =>
            user.role ===
            'Prosumer',
        ).length

      return {
        total:
          users.length,

        active,

        pending,

        deactivationRequested,

        deactivated,

        backoffice,

        gridOperators,

        prosumers,
      }
    }, [users])

  /* ===================================================
     Infrastructure Statistics
  ==================================================== */

  const infrastructure =
    useMemo(() => {
      const activeStations =
        stations.filter(
          (station) =>
            station.isActive !==
            false,
        )

      const inactiveStations =
        stations.length -
        activeStations.length

      const availableSlots =
        slots.filter(
          (slot) =>
            normalizeSlotStatus(
              slot.status,
            ) ===
            'Available',
        )

      const fullSlots =
        slots.filter(
          (slot) =>
            normalizeSlotStatus(
              slot.status,
            ) ===
            'Full',
        )

      const closedSlots =
        slots.filter(
          (slot) =>
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
        activeStations:
          activeStations.length,

        inactiveStations,

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
     Account Status Graph Data
  ==================================================== */

  const accountStatusData =
    useMemo(
      () => [
        {
          status:
            'Active',

          value:
            accounts.active,
        },

        {
          status:
            'PendingActivation',

          value:
            accounts.pending,
        },

        {
          status:
            'DeactivationRequested',

          value:
            accounts.deactivationRequested,
        },

        {
          status:
            'Deactivated',

          value:
            accounts.deactivated,
        },
      ],
      [accounts],
    )

  /* ===================================================
     Account Type Graph Data
  ==================================================== */

  const accountTypeData =
    useMemo(
      () => [
        {
          label:
            'Backoffice',

          value:
            accounts.backoffice,

          barClassName:
            'bg-blue-600',

          numberClassName:
            'bg-blue-50 text-blue-700',
        },

        {
          label:
            'Grid Operators',

          value:
            accounts.gridOperators,

          barClassName:
            'bg-violet-500',

          numberClassName:
            'bg-violet-50 text-violet-700',
        },

        {
          label:
            'Prosumers',

          value:
            accounts.prosumers,

          barClassName:
            'bg-emerald-500',

          numberClassName:
            'bg-emerald-50 text-emerald-700',
        },
      ],
      [accounts],
    )

  const actionCount =
    accounts.pending +
    accounts.deactivationRequested

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================== */}

      <section>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
          Overview
        </h1>

        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
          Welcome
          {currentUser?.fullName
            ? `, ${currentUser.fullName}`
            : ''}
          . Monitor accounts, stations, energy slots and current administrative activity.
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
          STAT CARDS
      ================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Registered Accounts"
          value={
            loading
              ? '—'
              : accounts.total
          }
          description="All platform users"
          icon={
            <UsersIcon />
          }
          iconClassName="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Active Stations"
          value={
            loading
              ? '—'
              : infrastructure.activeStations
          }
          description={`${stations.length} total stations registered`}
          icon={
            <StationIcon />
          }
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Available Energy Slots"
          value={
            loading
              ? '—'
              : infrastructure.availableSlots
          }
          description={`${slots.length} total slots configured`}
          icon={
            <SlotIcon />
          }
          iconClassName="bg-violet-50 text-violet-700"
        />

        <StatCard
          title="Network Capacity"
          value={
            loading
              ? '—'
              : `${formatNumber(
                  infrastructure.totalCapacity,
                )} kW`
          }
          description="Combined active station capacity"
          icon={
            <EnergyIcon />
          }
          iconClassName="bg-orange-50 text-orange-700"
        />
      </section>

      {/* =================================================
          ACCOUNT GRAPHS
      ================================================== */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Account Status */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Account Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lifecycle status of all registered accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 p-5 sm:grid-cols-[225px_1fr]">
            <div className="flex justify-center">
              <AccountStatusDonut
                data={
                  accountStatusData
                }
                total={
                  accounts.total
                }
              />
            </div>

            <div>
              <LegendRow
                dotClassName="bg-emerald-500"
                title="Active"
                value={
                  accounts.active
                }
              />

              <LegendRow
                dotClassName="bg-amber-500"
                title="Pending Activation"
                value={
                  accounts.pending
                }
              />

              <LegendRow
                dotClassName="bg-red-500"
                title="Deactivation Requested"
                value={
                  accounts.deactivationRequested
                }
              />

              <LegendRow
                dotClassName="bg-slate-400"
                title="Deactivated"
                value={
                  accounts.deactivated
                }
              />
            </div>
          </div>
        </div>

        {/* Account Type */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Account Type Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Number of users registered under each account type.
            </p>
          </div>

          <div className="px-5 pb-5 pt-2">
            <AccountTypeChart
              data={
                accountTypeData
              }
            />
          </div>
        </div>
      </section>

      {/* =================================================
          INFRASTRUCTURE AVAILABILITY
      ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Infrastructure Availability
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current availability of solar stations and energy booking slots.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <EnergyIcon />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          {/* Station availability */}

          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <StationIcon className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">
                    Station Availability
                  </h3>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Operational status of registered solar stations
                  </p>
                </div>
              </div>
            </div>

            <StationAvailabilityRing
              active={
                infrastructure.activeStations
              }
              inactive={
                infrastructure.inactiveStations
              }
            />

            <div className="mt-5 text-center">
              <Link
                to="/backoffice/stations"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Manage stations

                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* Energy slots */}

          <div className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <SlotIcon className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-[17px] font-bold tracking-[-0.02em] text-slate-950">
                  Energy Slot Availability
                </h3>

                <p className="mt-0.5 text-sm text-slate-500">
                  Current availability across all energy booking slots
                </p>
              </div>
            </div>

            <SlotAvailabilityGraph
              available={
                infrastructure.availableSlots
              }
              full={
                infrastructure.fullSlots
              }
              closed={
                infrastructure.closedSlots
              }
            />

            <div className="mt-5 text-right">
              <Link
                to="/backoffice/slots"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Manage energy slots

                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          ACTION CENTER
      ================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
              Action Center
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Account requests currently waiting for Backoffice action.
            </p>
          </div>

          {actionCount >
          0 ? (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {actionCount}{' '}
              requiring action
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              All clear
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-2">
          <ActionRow
            to="/backoffice/users/pending"
            icon={
              <PendingIcon />
            }
            iconClassName="bg-amber-50 text-amber-700"
            title="Pending Activations"
            description="New Prosumer accounts waiting for approval."
            value={
              accounts.pending
            }
            valueClassName="text-amber-700"
          />

          <ActionRow
            to="/backoffice/users/deactivation-requests"
            icon={
              <WarningIcon />
            }
            iconClassName="bg-red-50 text-red-700"
            title="Deactivation Requests"
            description="Prosumer account requests waiting for final processing."
            value={
              accounts.deactivationRequested
            }
            valueClassName="text-red-700"
          />
        </div>
      </section>

      {/* =================================================
          QUICK ACCESS
      ================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
            Quick Access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Access the main Backoffice management areas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickAccessCard
            to="/backoffice/users"
            icon={
              <UsersIcon className="h-6 w-6" />
            }
            iconClassName="bg-blue-50 text-blue-700"
            title="Users & Accounts"
            description="Manage Backoffice users, Grid Operators and Prosumer accounts."
            footer="Open account management"
          />

          <QuickAccessCard
            to="/backoffice/stations"
            icon={
              <StationIcon className="h-6 w-6" />
            }
            iconClassName="bg-emerald-50 text-emerald-700"
            title="Solar Stations"
            description="Manage microgrid stations, capacity details and operational status."
            footer="Open station management"
          />

          <QuickAccessCard
            to="/backoffice/slots"
            icon={
              <SlotIcon className="h-6 w-6" />
            }
            iconClassName="bg-violet-50 text-violet-700"
            title="Energy Slots"
            description="Manage energy booking schedules, availability and slot status."
            footer="Open energy slot management"
          />
        </div>
      </section>
    </div>
  )
}

export default BackofficeDashboard