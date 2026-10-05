import TablePagination from '../common/TablePagination'

import {
  CheckIcon,
  ClockIcon,
  EditIcon,
  PowerIcon,
  ReactivateIcon,
  SearchIcon,
} from './UserManagementIcons'

import {
  getUserInitials,
  normalizeStatus,
  prettyStatus,
  ROLE_STYLES,
  roleLabel,
  STATUS_STYLES,
} from './userManagementUtils'

function UserActions({
  user,
  onEdit,
  onLifecycleAction,
}) {
  const userStatus = normalizeStatus(user.status)
  const lifecycleButtonBase =
    'inline-flex h-9 w-[118px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4'

  return (
    <div className="flex w-[212px] items-center justify-start gap-2">
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="inline-flex h-9 w-[86px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100"
      >
        <EditIcon />
        Edit
      </button>

      {userStatus === 'Active' && (
        <button
          type="button"
          onClick={() => onLifecycleAction('deactivate', user)}
          className={`${lifecycleButtonBase} border-red-200 bg-red-100 text-red-700 hover:border-red-300 hover:bg-red-200 focus:ring-red-100`}
        >
          <PowerIcon />
          Deactivate
        </button>
      )}

      {userStatus === 'PendingActivation' && (
        <button
          type="button"
          onClick={() => onLifecycleAction('activate', user)}
          className={`${lifecycleButtonBase} border-emerald-200 bg-emerald-100 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-200 focus:ring-emerald-100`}
        >
          <CheckIcon />
          Activate
        </button>
      )}

      {userStatus === 'DeactivationRequested' && (
        <button
          type="button"
          onClick={() => onLifecycleAction('deactivate', user)}
          className={`${lifecycleButtonBase} border-amber-300 bg-amber-100 text-amber-800 hover:border-amber-400 hover:bg-amber-200 focus:ring-amber-100`}
        >
          <ClockIcon />
          Finalize
        </button>
      )}

      {userStatus === 'Deactivated' && (
        <button
          type="button"
          onClick={() => onLifecycleAction('reactivate', user)}
          className={`${lifecycleButtonBase} border-blue-200 bg-blue-100 text-blue-800 hover:border-blue-300 hover:bg-blue-200 focus:ring-blue-100`}
        >
          <ReactivateIcon />
          Reactivate
        </button>
      )}
    </div>
  )
}

/** Full user table presentation; lifecycle calls are delegated to UsersPage. */
export default function UsersTable({
  loading,
  users,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  visiblePages,
  onPageChange,
  onEdit,
  onLifecycleAction,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="overflow-x-auto xl:overflow-x-visible">
        <table className="w-full min-w-[900px] table-auto xl:min-w-0">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[13%]" />
            <col className="w-[19%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80">
              <th className="px-5 py-4 text-left text-sm font-bold text-slate-800">User</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">NIC</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">Role</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">Status</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-slate-800">Mobile</th>
              <th className="w-[228px] px-4 py-4 text-left text-sm font-bold text-slate-800">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Loading users...
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <SearchIcon />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No users found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try another search or filter.</p>
                </td>
              </tr>
            )}

            {!loading && users.map((user) => {
              const userStatus = normalizeStatus(user.status)
              const statusStyle = STATUS_STYLES[userStatus] ?? {
                container: 'border-slate-200 bg-slate-50',
                dot: 'bg-slate-400',
              }

              return (
                <tr key={user.nic} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white shadow-sm ring-1 ring-blue-900/10">
                        {getUserInitials(user.fullName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                    <span className="whitespace-nowrap">{user.nic}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-flex whitespace-nowrap rounded-lg border px-2.5 py-1 text-sm font-medium ${
                      ROLE_STYLES[user.role] || 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 py-1 text-sm font-medium text-slate-800 ${statusStyle.container}`}>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`} />
                      {prettyStatus(userStatus)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                    <span className="whitespace-nowrap">
                      {user.phoneNumber || '—'}
                    </span>
                  </td>

                  <td className="w-[228px] px-4 py-3.5">
                    <UserActions
                      user={user}
                      onEdit={onEdit}
                      onLifecycleAction={onLifecycleAction}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          visiblePages={visiblePages}
          itemLabel="accounts"
          onPageChange={onPageChange}
        />
      )}
    </section>
  )
}
