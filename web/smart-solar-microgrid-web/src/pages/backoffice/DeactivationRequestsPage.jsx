import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import ConfirmDialog from '../../components/common/ConfirmDialog'
import DeactivationRequestsTable from '../../components/users/DeactivationRequestsTable'
import LifecycleFilters from '../../components/users/LifecycleFilters'
import LifecycleSummaryBanner from '../../components/users/LifecycleSummaryBanner'
import {
  buildVisiblePages,
} from '../../components/users/userManagementUtils'
import useAutoRefresh from '../../hooks/useAutoRefresh'

import {
  deactivateUser,
  getDeactivationRequests,
} from '../../services/api/userService'

import {
  getApiErrorMessage,
} from '../../utils/apiError'

const PAGE_SIZE = 5
const AUTO_REFRESH_MS = 5000

/** Backoffice controller for finalizing Prosumer deactivation requests. */
function DeactivationRequestsPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const requestInFlightRef = useRef(false)

  const loadRequests = useCallback(
    async ({ showLoader = false } = {}) => {
      if (requestInFlightRef.current) {
        return
      }

      requestInFlightRef.current = true

      if (showLoader) {
        setLoading(true)
      }

      try {
        const data = await getDeactivationRequests()
        setUsers(Array.isArray(data) ? data : [])
        setPageError('')
      } catch (error) {
        setPageError(
          getApiErrorMessage(
            error,
            'Unable to load deactivation requests.',
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
    loadRequests({ showLoader: true })
  }, [loadRequests])

  useAutoRefresh(loadRequests, AUTO_REFRESH_MS)

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

      const firstDate = new Date(
        first.deactivationRequestedAt ??
          first.updatedAt ??
          first.createdAt ??
          0,
      ).getTime()

      const secondDate = new Date(
        second.deactivationRequestedAt ??
          second.updatedAt ??
          second.createdAt ??
          0,
      ).getTime()

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

  async function finalizeDeactivation() {
    if (!confirm) {
      return
    }

    setActionLoading(true)

    try {
      await deactivateUser(confirm.nic)
      toast.success(`${confirm.fullName} deactivated successfully.`)
      setConfirm(null)
      await loadRequests()
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to finalize deactivation request.',
        ),
      )
    } finally {
      setActionLoading(false)
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
              Deactivation Requests
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Review Solar Prosumer account deactivation requests and finalize approved account closures.
            </p>
          </div>

          <LifecycleSummaryBanner
            type="deactivation"
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

      <DeactivationRequestsTable
        loading={loading}
        users={paginatedUsers}
        totalItems={filteredUsers.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        visiblePages={visiblePages}
        onPageChange={setCurrentPage}
        onFinalize={setConfirm}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Finalize Deactivation?"
        message={
          confirm
            ? `This will deactivate ${confirm.fullName}'s account and remove active platform access.`
            : ''
        }
        confirmText="Finalize"
        tone="warning"
        loading={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={finalizeDeactivation}
      />
    </div>
  )
}

export default DeactivationRequestsPage
