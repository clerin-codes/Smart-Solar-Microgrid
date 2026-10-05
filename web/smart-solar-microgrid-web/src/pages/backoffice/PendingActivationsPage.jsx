import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import ConfirmDialog from '../../components/common/ConfirmDialog'
import LifecycleFilters from '../../components/users/LifecycleFilters'
import LifecycleSummaryBanner from '../../components/users/LifecycleSummaryBanner'
import PendingActivationsTable from '../../components/users/PendingActivationsTable'
import {
  buildVisiblePages,
} from '../../components/users/userManagementUtils'
import useAutoRefresh from '../../hooks/useAutoRefresh'

import {
  activateUser,
  getPendingActivations,
} from '../../services/api/userService'

import {
  getApiErrorMessage,} from '../../utils/apiError'

const PAGE_SIZE = 5
const AUTO_REFRESH_MS = 5000

/** Backoffice controller for reviewing and activating pending Prosumer accounts. */
function PendingActivationsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [activatingNic, setActivatingNic] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const requestInFlightRef = useRef(false)

  const loadPendingUsers = useCallback(
    async ({ showLoader = false } = {}) => {
      if (requestInFlightRef.current) {
        return
      }

      requestInFlightRef.current = true

      if (showLoader) {
        setLoading(true)
      }

      try {
        const data = await getPendingActivations()
        setUsers(Array.isArray(data) ? data : [])
        setPageError('')
      } catch (error) {
        setPageError(
          getApiErrorMessage(
            error,
            'Unable to load pending activations.',
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
    loadPendingUsers({ showLoader: true })
  }, [loadPendingUsers])

  useAutoRefresh(loadPendingUsers, AUTO_REFRESH_MS)

  useEffect(() => {
    setCurrentPage(1)
  }, [
    search,
    sortOrder,
  ])

  const filteredUsers = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    const matchingUsers = users.filter((user) => {
      if (!searchValue) {
        return true
      }

      return [
        user.fullName,
        user.nic,
        user.email,
        user.phoneNumber,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(searchValue),
        )
    })

    return [...matchingUsers].sort((first, second) => {
      if (sortOrder === 'name') {
        return String(first.fullName ?? '').localeCompare(
          String(second.fullName ?? ''),
        )
      }

      const firstDate = new Date(first.createdAt ?? 0).getTime()
      const secondDate = new Date(second.createdAt ?? 0).getTime()

      return sortOrder === 'oldest'
        ? firstDate - secondDate
        : secondDate - firstDate
    })
  }, [
    users,
    search,
    sortOrder,
  ])

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

  async function handleActivate(user) {
    setActivatingNic(user.nic)

    try {
      await activateUser(user.nic)
      toast.success(`${user.fullName} activated successfully.`)
      setConfirm(null)
      await loadPendingUsers()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to activate account.',
        ),
      )
    } finally {
      setActivatingNic(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setSortOrder('newest')
  }

  return (
    <div className="space-y-5">
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Pending Activations
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Review and activate Solar Prosumer registrations awaiting Backoffice approval.
            </p>
          </div>

          <LifecycleSummaryBanner
            type="pending"
            count={users.length}
          />
        </div>
      </section>

      <LifecycleFilters
        search={search}
        sortOrder={sortOrder}
        pageError={pageError}
        onSearchChange={setSearch}
        onSortChange={setSortOrder}
        onClear={clearFilters}
      />

      <PendingActivationsTable
        loading={loading}
        users={paginatedUsers}
        activatingNic={activatingNic}
        totalItems={filteredUsers.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        visiblePages={visiblePages}
        onPageChange={setCurrentPage}
        onActivate={setConfirm}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Activate Account?"
        message={
          confirm
            ? `This will activate ${confirm.fullName}'s Solar Prosumer account and allow platform access.`
            : ''
        }
        confirmText="Activate Account"
        tone="success"
        loading={Boolean(confirm && activatingNic === confirm.nic)}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            handleActivate(confirm)
          }
        }}
      />
    </div>
  )
}

export default PendingActivationsPage
