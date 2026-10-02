import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import Alert from '../../components/common/Alert'
import ConfirmDialog from '../../components/common/ConfirmDialog'

import {
  CheckIcon,
  RefreshIcon,
} from '../../components/common/Icons'

import {
  activateUser,
  getPendingActivations,
} from '../../services/api/userService'

import {
  getApiErrorMessage,
} from '../../utils/apiError'

import {
  formatDate,
} from '../../utils/userFormat'

export default function PendingActivationsPage() {
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
          await getPendingActivations()

        setUsers(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            'Unable to load pending activations.'
          )
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    load()
  }, [load])

  async function approve() {
    if (!selected) {
      return
    }

    try {
      setActionLoading(true)
      setError('')

      await activateUser(
        selected.nic
      )

      setSuccess(
        `${selected.fullName} was activated successfully.`
      )

      setSelected(null)

      await load()
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Unable to activate this account.'
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
          <p className="text-sm font-semibold text-amber-600">
            Prosumer Approval
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Pending Activations
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review mobile Prosumer
            registrations waiting for
            Backoffice activation.
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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading pending accounts...
          </div>
        ) : users.length ===
          0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckIcon className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-bold text-slate-800">
              Queue is clear
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              There are no Prosumer
              accounts waiting for
              activation.
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
                  <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        Registered
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDate(
                          account.createdAt
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
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Approve & activate
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={
          Boolean(selected)
        }
        title="Approve Prosumer account?"
        message={
          selected
            ? `Activate ${selected.fullName} (${selected.nic}) and allow this Prosumer to authenticate?`
            : ''
        }
        confirmText="Approve account"
        loading={
          actionLoading
        }
        onCancel={() =>
          setSelected(null)
        }
        onConfirm={approve}
      />
    </div>
  )
}