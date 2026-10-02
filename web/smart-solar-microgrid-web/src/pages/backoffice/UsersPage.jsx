import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import ConfirmDialog from '../../components/common/ConfirmDialog'
import UserFormModal from '../../components/users/UserFormModal'
import {
  activateUser,
  createUser,
  deactivateUser,
  getUsers,
  reactivateUser,
  updateUser,
} from '../../services/api/userService'
import { getApiErrorMessage } from '../../utils/apiError'

const STATUS_STYLES = {
  Active:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  PendingActivation:
    'border-amber-200 bg-amber-50 text-amber-700',
  DeactivationRequested:
    'border-orange-200 bg-orange-50 text-orange-700',
  Deactivated:
    'border-slate-200 bg-slate-100 text-slate-600',
}

const ROLE_STYLES = {
  Backoffice: 'bg-violet-50 text-violet-700',
  GridOperator: 'bg-blue-50 text-blue-700',
  Prosumer: 'bg-cyan-50 text-cyan-700',
}

function prettyStatus(status = '') {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function roleLabel(role) {
  return role === 'GridOperator'
    ? 'Grid Operator'
    : role
}

function StatCard({
  title,
  value,
  accent = 'blue',
  description,
}) {
  const accentMap = {
    blue: 'from-blue-600 to-sky-500 shadow-blue-200',
    emerald:
      'from-emerald-600 to-green-500 shadow-emerald-200',
    amber:
      'from-amber-500 to-orange-500 shadow-amber-200',
    violet:
      'from-violet-600 to-fuchsia-500 shadow-violet-200',
  }

  return (
    <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-2xl bg-gradient-to-r px-4 py-2 text-lg font-bold text-white shadow-lg ${accentMap[accent]}`}
      >
        {value}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  )
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState({
    open: false,
    mode: 'create',
    user: null,
  })
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] =
    useState(false)

  async function loadUsers() {
    setLoading(true)
    setPageError('')

    try {
      const data = await getUsers({ role, status })
      setUsers(data)
    } catch (error) {
      setPageError(
        getApiErrorMessage(
          error,
          'Unable to load users.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status])

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) return users

    return users.filter((user) =>
      [
        user.fullName,
        user.nic,
        user.email,
        user.phoneNumber,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value),
        ),
    )
  }, [users, search])

  const summary = useMemo(() => {
    const active = users.filter(
      (user) => user.status === 'Active',
    ).length
    const pending = users.filter(
      (user) => user.status === 'PendingActivation',
    ).length
    const webUsers = users.filter((user) =>
      ['Backoffice', 'GridOperator'].includes(user.role),
    ).length

    return {
      total: users.length,
      active,
      pending,
      webUsers,
    }
  }, [users])

  function closeModal() {
    setModal({
      open: false,
      mode: 'create',
      user: null,
    })
  }

  async function handleCreate(payload) {
    await createUser(payload)
    toast.success('Web user created successfully.')
    await loadUsers()
  }

  async function handleEdit(payload) {
    await updateUser(modal.user.nic, payload)
    toast.success('User profile updated successfully.')
    await loadUsers()
  }

  async function handleActivate(user) {
    try {
      await activateUser(user.nic)
      toast.success(
        `${user.fullName} activated successfully.`,
      )
      await loadUsers()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to activate account.',
        ),
      )
    }
  }

  async function runConfirmedAction() {
    if (!confirm) return

    setActionLoading(true)

    try {
      if (confirm.action === 'deactivate') {
        await deactivateUser(confirm.user.nic)
        toast.success('Account deactivated successfully.')
      } else if (confirm.action === 'reactivate') {
        await reactivateUser(confirm.user.nic)
        toast.success('Account reactivated successfully.')
      }

      setConfirm(null)
      await loadUsers()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update account status.',
        ),
      )
    } finally {
      setActionLoading(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setRole('')
    setStatus('')
  }

  function renderActions(user) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            setModal({
              open: true,
              mode: 'edit',
              user,
            })
          }
          className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          Edit
        </button>

        {user.status === 'PendingActivation' && (
          <button
            type="button"
            onClick={() => handleActivate(user)}
            className="rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            Activate
          </button>
        )}

        {user.status === 'Active' && (
          <button
            type="button"
            onClick={() =>
              setConfirm({ action: 'deactivate', user })
            }
            className="rounded-2xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Deactivate
          </button>
        )}

        {user.status ===
          'DeactivationRequested' && (
          <button
            type="button"
            onClick={() =>
              setConfirm({ action: 'deactivate', user })
            }
            className="rounded-2xl bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
          >
            Finalize
          </button>
        )}

        {user.status === 'Deactivated' && (
          <button
            type="button"
            onClick={() =>
              setConfirm({ action: 'reactivate', user })
            }
            className="rounded-2xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Reactivate
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-r from-slate-950 via-blue-950 to-sky-700 px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              Backoffice Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              User Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-100/90 sm:text-base">
              Manage Backoffice users, Grid Operators,
              and Prosumer account lifecycle actions in
              one clean workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/backoffice/users/pending"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Pending Activations
            </Link>

            <Link
              to="/backoffice/users/deactivation-requests"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Deactivation Requests
            </Link>

            <button
              type="button"
              onClick={() =>
                setModal({
                  open: true,
                  mode: 'create',
                  user: null,
                })
              }
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              + Create Web User
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Loaded Accounts"
          value={summary.total}
          accent="blue"
          description="Accounts returned from the current role and status filters."
        />
        <StatCard
          title="Active Accounts"
          value={summary.active}
          accent="emerald"
          description="Currently active accounts with valid access."
        />
        <StatCard
          title="Pending Activation"
          value={summary.pending}
          accent="amber"
          description="Prosumer registrations waiting for activation."
        />
        <StatCard
          title="Web Portal Users"
          value={summary.webUsers}
          accent="violet"
          description="Backoffice and Grid Operator accounts."
        />
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                User Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search locally and filter from the backend
                by role and account status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear Filters
              </button>

              <button
                type="button"
                onClick={loadUsers}
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_220px_240px]">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, NIC, email or phone"
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All roles</option>
              <option value="Backoffice">
                Backoffice
              </option>
              <option value="GridOperator">
                Grid Operator
              </option>
              <option value="Prosumer">Prosumer</option>
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="PendingActivation">
                Pending Activation
              </option>
              <option value="DeactivationRequested">
                Deactivation Requested
              </option>
              <option value="Deactivated">
                Deactivated
              </option>
            </select>
          </div>

          {(search || role || status) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Active filters
              </span>

              {search && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Search: {search}
                </span>
              )}
              {role && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Role: {roleLabel(role)}
                </span>
              )}
              {status && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Status: {prettyStatus(status)}
                </span>
              )}
            </div>
          )}

          {pageError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'User',
                      'NIC',
                      'Role',
                      'Status',
                      'Mobile',
                      'Actions',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 ${
                          heading === 'Actions'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        Loading users...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-5 py-16 text-center text-sm text-slate-500"
                        >
                          No accounts match your current
                          search and filters.
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    filteredUsers.map((user) => (
                      <tr
                        key={user.nic}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-bold text-white">
                              {user.fullName
                                ?.slice(0, 1)
                                .toUpperCase() || 'U'}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {user.fullName}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-600">
                          {user.nic}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              ROLE_STYLES[user.role] ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {roleLabel(user.role)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[user.status] ||
                              'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {prettyStatus(user.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {user.phoneNumber}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {renderActions(user)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              <span>
                Showing {filteredUsers.length} of {users.length}{' '}
                loaded accounts
              </span>
              <span>
                Backend filters: role / status · Local
                filter: search
              </span>
            </div>
          </div>
        </div>
      </section>

      <UserFormModal
        open={modal.open}
        mode={modal.mode}
        user={modal.user}
        onClose={closeModal}
        onSubmit={
          modal.mode === 'edit'
            ? handleEdit
            : handleCreate
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === 'reactivate'
            ? 'Reactivate Account?'
            : 'Deactivate Account?'
        }
        message={
          confirm?.action === 'reactivate'
            ? `This will restore access for ${confirm?.user?.fullName}.`
            : `This will disable access for ${confirm?.user?.fullName}. Existing API access should no longer be used.`
        }
        confirmLabel={
          confirm?.action === 'reactivate'
            ? 'Reactivate'
            : 'Deactivate'
        }
        tone={
          confirm?.action === 'reactivate'
            ? 'primary'
            : 'danger'
        }
        loading={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  )
}

export default UsersPage