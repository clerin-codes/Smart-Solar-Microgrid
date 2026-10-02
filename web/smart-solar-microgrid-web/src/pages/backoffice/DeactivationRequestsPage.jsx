import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import Alert from '../../components/common/Alert'
import ConfirmDialog from '../../components/common/ConfirmDialog'

import {
  RefreshIcon,
  UserMinusIcon,
} from '../../components/common/Icons'

import {
  deactivateUser,
  getDeactivationRequests,
} from '../../services/api/userService'

import {
  getApiErrorMessage,
} from '../../utils/apiError'

import {
  formatDateTime,
} from '../../utils/userFormat'

export default function DeactivationRequestsPage() {
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

  const [
    success,
    setSuccess,
  ] = useState('')

  const [
    selected,
    setSelected,
  ] = useState(null)

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false)

  const load =
    useCallback(async () => {
      try {
        setLoading(true)
        setError('')

        const data =
          await getDeactivationRequests()

        setUsers(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Unable to load deactivation requests.'
          )
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    load()
  }, [load])

  async function finalize() {
    if (!selected) {
      return
    }

    try {
      setActionLoading(true)
      setError('')

      await deactivateUser(
        selected.nic
      )

      setSuccess(
        `${selected.fullName}'s account was deactivated successfully.`
      )

      setSelected(null)

      await load()
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Unable to finalize the deactivation request.'
        )
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-600">
            Account Lifecycle
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Deactivation Requests
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Process account
            deactivation requests
            submitted by Prosumers.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={
            loading
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshIcon className="h-4 w-4" />
          Refresh
        </button>
      </header>

      <Alert type="success">
        {success}
      </Alert>

      <Alert type="error">
        {error}
      </Alert>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading deactivation
            requests...
          </div>
        ) : users.length ===
          0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <UserMinusIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-bold text-slate-800">
              No pending requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              No Prosumer has a pending
              account-deactivation
              request.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map(
              (account) => (
                <div
                  key={
                    account.nic
                  }
                  className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Prosumer
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {
                          account.fullName
                        }
                      </p>

                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {account.nic}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {account.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Mobile
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {
                          account.phoneNumber
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Requested
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(
                          account.deactivationRequestedAt
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        account
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <UserMinusIcon className="h-4 w-4" />
                    Finalize deactivation
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={
          Boolean(selected)
        }
        tone="danger"
        title="Finalize account deactivation?"
        message={
          selected
            ? `Deactivate ${selected.fullName} (${selected.nic})? The account will no longer be able to authenticate until Backoffice reactivates it.`
            : ''
        }
        confirmText="Deactivate account"
        loading={
          actionLoading
        }
        onCancel={() =>
          setSelected(null)
        }
        onConfirm={
          finalize
        }
      />
    </div>
  )
}