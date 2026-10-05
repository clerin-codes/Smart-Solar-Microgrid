import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import ConfirmDialog from '../../components/common/ConfirmDialog'
import UserFormModal from '../../components/users/UserFormModal'
import {
  PlusIcon,
} from '../../components/users/UserManagementIcons'
import UsersFilters from '../../components/users/UsersFilters'
import UsersSummary from '../../components/users/UsersSummary'
import UsersTable from '../../components/users/UsersTable'
import {
  buildVisiblePages,
  normalizeStatus,
  prettyStatus,
  roleLabel,
} from '../../components/users/userManagementUtils'
import useAutoRefresh from '../../hooks/useAutoRefresh'

import {
  activateUser,
  createUser,
  deactivateUser,
  getUsers,
  reactivateUser,
  updateUser,
} from '../../services/api/userService'

import {
  getApiErrorMessage,
} from '../../utils/apiError'

const PAGE_SIZE = 5
const AUTO_REFRESH_MS = 5000

/**
 * Backoffice account-management controller. Presentation is delegated to small
 * components while API actions and account lifecycle state stay in one place.
 */
function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modal, setModal] = useState({
    open: false,
    mode: 'create',
    user: null,
  })
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const requestInFlightRef = useRef(false)

  const loadUsers = useCallback(
    async ({ showLoader = false } = {}) => {
      if (requestInFlightRef.current) {
        return
      }

      requestInFlightRef.current = true

      if (showLoader) {
        setLoading(true)
      }

      try {
        const data = await getUsers({})
        setUsers(Array.isArray(data) ? data : [])
        setPageError('')
      } catch (error) {
        setPageError(
          getApiErrorMessage(
            error,
            'Unable to load users.',
          ),
        )
      } finally {
        requestInFlightRef.current = false

        if (showLoader) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    loadUsers({ showLoader: true })
  }, [loadUsers])

  useAutoRefresh(loadUsers, AUTO_REFRESH_MS)

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    role,
    status,
  ])

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return users.filter((user) => {
      const userStatus = normalizeStatus(user.status)
      const matchesRole = !role || user.role === role
      const matchesStatus = !status || userStatus === status
      const matchesSearch =
        !searchValue ||
        [
          user.fullName,
          user.nic,
          user.email,
          user.phoneNumber,
          roleLabel(user.role),
          prettyStatus(userStatus),
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(searchValue),
          )

      return matchesRole && matchesStatus && matchesSearch
    })
  }, [
    users,
    search,
    role,
    status,
  ])

  const summary = useMemo(() => {
    const active = users.filter(
      (user) => normalizeStatus(user.status) === 'Active',
    ).length

    const pending = users.filter(
      (user) => normalizeStatus(user.status) === 'PendingActivation',
    ).length

    const deactivationRequests = users.filter(
      (user) => normalizeStatus(user.status) === 'DeactivationRequested',
    ).length

    const webUsers = users.filter((user) =>
      ['Backoffice', 'GridOperator'].includes(user.role),
    ).length

    return {
      total: users.length,
      active,
      pending,
      deactivationRequests,
      webUsers,
    }
  }, [users])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE),
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [
    currentPage,
    totalPages,
  ])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [
    filteredUsers,
    currentPage,
  ])

  const visiblePages = useMemo(
    () => buildVisiblePages(currentPage, totalPages),
    [
      currentPage,
      totalPages,
    ],
  )

  function closeModal() {
    setModal({
      open: false,
      mode: 'create',
      user: null,
    })
  }

  async function handleCreate(payload) {
    try {
      await createUser(payload)
      closeModal()
      toast.success('Web user created successfully.')
      await loadUsers()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create user.',
        ),
      )
      throw error
    }
  }

  async function handleEdit(payload) {
    try {
      await updateUser(modal.user.nic, payload)
      closeModal()
      toast.success('User profile updated successfully.')
      await loadUsers()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update user.',
        ),
      )
      throw error
    }
  }

  async function runConfirmedAction() {
    if (!confirm) {
      return
    }

    setActionLoading(true)

    try {
      if (confirm.action === 'activate') {
        await activateUser(confirm.user.nic)
        toast.success(`${confirm.user.fullName} activated successfully.`)
      }

      if (confirm.action === 'deactivate') {
        await deactivateUser(confirm.user.nic)
        toast.success(
          normalizeStatus(confirm.user.status) === 'DeactivationRequested'
            ? 'Deactivation request finalized successfully.'
            : 'Account deactivated successfully.',
        )
      }

      if (confirm.action === 'reactivate') {
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

  const confirmStatus = normalizeStatus(confirm?.user?.status)

  return (
    <div className="space-y-5">
      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Users & Accounts
            </h1>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Manage web users and Prosumer account lifecycle operations across the SunChain platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setModal({
                open: true,
                mode: 'create',
                user: null,
              })
            }
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-800 px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(30,64,175,0.20)] transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:self-auto"
          >
            <PlusIcon />
            Create User
          </button>
        </div>
      </section>

      <UsersSummary summary={summary} />

      <UsersFilters
        search={search}
        role={role}
        status={status}
        pageError={pageError}
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onStatusChange={setStatus}
        onClear={clearFilters}
      />

      <UsersTable
        loading={loading}
        users={paginatedUsers}
        totalItems={filteredUsers.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        visiblePages={visiblePages}
        onPageChange={setCurrentPage}
        onEdit={(user) =>
          setModal({
            open: true,
            mode: 'edit',
            user,
          })
        }
        onLifecycleAction={(action, user) =>
          setConfirm({ action, user })
        }
      />

      <UserFormModal
        open={modal.open}
        mode={modal.mode}
        user={modal.user}
        onClose={closeModal}
        onSubmit={modal.mode === 'edit' ? handleEdit : handleCreate}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === 'activate'
            ? 'Activate Account?'
            : confirm?.action === 'reactivate'
              ? 'Reactivate Account?'
              : confirmStatus === 'DeactivationRequested'
                ? 'Finalize Deactivation?'
                : 'Deactivate Account?'
        }
        message={
          confirm?.action === 'activate'
            ? `This will activate ${confirm?.user?.fullName}'s account and allow platform access.`
            : confirm?.action === 'reactivate'
              ? `This will restore platform access for ${confirm?.user?.fullName}.`
              : confirmStatus === 'DeactivationRequested'
                ? `This will finalize ${confirm?.user?.fullName}'s deactivation request and remove active platform access.`
                : `This will deactivate ${confirm?.user?.fullName}'s account and remove active platform access.`
        }
        confirmText={
          confirm?.action === 'activate'
            ? 'Activate Account'
            : confirm?.action === 'reactivate'
              ? 'Reactivate'
              : confirmStatus === 'DeactivationRequested'
                ? 'Finalize'
                : 'Deactivate'
        }
        tone={
          confirm?.action === 'activate'
            ? 'success'
            : confirm?.action === 'reactivate'
              ? 'primary'
              : confirmStatus === 'DeactivationRequested'
                ? 'warning'
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
