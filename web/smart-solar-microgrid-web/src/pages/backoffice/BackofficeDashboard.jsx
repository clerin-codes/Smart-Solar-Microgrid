import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import Alert from '../../components/common/Alert'
import StatusBadge from '../../components/common/StatusBadge'

import {
  ArrowRightIcon,
  ClockIcon,
  SlotsIcon,
  StationIcon,
  UserMinusIcon,
  UsersIcon,
} from '../../components/common/Icons'

import {
  getUsers,
} from '../../services/api/userService'

import {
  formatDate,
  getRoleLabel,
  normalizeStatus,
} from '../../utils/userFormat'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  to,
  title,
  description,
  icon: Icon,
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
        Open

        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

export default function BackofficeDashboard() {
  const [
    users,
    setUsers,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')

        const data =
          await getUsers()

        if (active) {
          setUsers(
            Array.isArray(data)
              ? data
              : []
          )
        }
      } catch {
        if (active) {
          setError(
            'Unable to load account statistics.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const stats =
    useMemo(() => {
      return {
        total:
          users.length,

        active:
          users.filter(
            (user) =>
              normalizeStatus(
                user.status
              ) === 'Active'
          ).length,

        pending:
          users.filter(
            (user) =>
              normalizeStatus(
                user.status
              ) ===
              'PendingActivation'
          ).length,

        requests:
          users.filter(
            (user) =>
              normalizeStatus(
                user.status
              ) ===
              'DeactivationRequested'
          ).length,
      }
    }, [users])

  const recentUsers =
    useMemo(
      () =>
        [...users]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt ?? 0
              ) -
              new Date(
                a.createdAt ?? 0
              )
          )
          .slice(0, 5),
      [users]
    )

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Backoffice
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Administration Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor account lifecycle
            activity and manage the
            microgrid administration
            workspace.
          </p>
        </div>

        <Link
          to="/backoffice/users"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <UsersIcon className="h-4 w-4" />
          Manage users
        </Link>
      </header>

      <Alert type="error">
        {error}
      </Alert>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={
            loading
              ? '—'
              : stats.total
          }
          description="All registered system accounts"
          icon={UsersIcon}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Accounts"
          value={
            loading
              ? '—'
              : stats.active
          }
          description="Accounts currently allowed to authenticate"
          icon={UsersIcon}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Pending Activation"
          value={
            loading
              ? '—'
              : stats.pending
          }
          description="Prosumer registrations awaiting review"
          icon={ClockIcon}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Deactivation Requests"
          value={
            loading
              ? '—'
              : stats.requests
          }
          description="Prosumer requests awaiting Backoffice action"
          icon={UserMinusIcon}
          iconClass="bg-orange-50 text-orange-600"
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quick access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Open key administration
            modules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickLink
            to="/backoffice/users"
            title="User Management"
            description="Create and maintain Backoffice, Grid Operator and Prosumer accounts."
            icon={UsersIcon}
          />

          <QuickLink
            to="/backoffice/users/pending"
            title="Pending Activations"
            description="Review and approve newly registered Prosumer accounts."
            icon={ClockIcon}
          />

          <QuickLink
            to="/backoffice/stations"
            title="Solar Stations"
            description="Open the station management workspace maintained by the station module."
            icon={StationIcon}
          />

          <QuickLink
            to="/backoffice/slots"
            title="Energy Slots"
            description="Open station schedule and energy slot management."
            icon={SlotsIcon}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent accounts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest registered accounts
              from the backend.
            </p>
          </div>

          <Link
            to="/backoffice/users"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading accounts...
          </div>
        ) : recentUsers.length ===
          0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentUsers.map(
                  (account) => (
                    <tr
                      key={
                        account.nic
                      }
                      className="hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            account.fullName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {account.nic}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getRoleLabel(
                          account.role
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            account.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(
                          account.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}