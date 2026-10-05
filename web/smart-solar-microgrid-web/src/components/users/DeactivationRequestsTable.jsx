import TablePagination from '../common/TablePagination'

import {
  EmptyIcon,
  FinalizeIcon,
} from './UserManagementIcons'

import {
  formatDateTimeParts,
  getUserInitials,
} from './userManagementUtils'

/** Presentation for Prosumer deactivation requests; API action remains in the page controller. */
export default function DeactivationRequestsTable({
  loading,
  users,
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  visiblePages,
  onPageChange,
  onFinalize,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="overflow-x-auto xl:overflow-x-visible">
        <table className="w-full min-w-[800px] table-auto xl:min-w-0">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
            <col className="w-[17%]" />
            <col className="w-[13%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/80">
              <th className="px-5 py-4 text-left text-sm font-semibold text-slate-800">Prosumer</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-800">NIC</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-800">Requested On</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-800">Mobile</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-800">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="5" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Loading deactivation requests...
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <EmptyIcon />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    No deactivation requests
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    There are currently no Solar Prosumer account deactivation requests awaiting action.
                  </p>
                </td>
              </tr>
            )}

            {!loading && users.map((user) => {
              const requestDate = formatDateTimeParts(
                user.deactivationRequestedAt ??
                  user.updatedAt ??
                  user.createdAt,
              )

              return (
                <tr key={user.nic} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white shadow-sm ring-1 ring-blue-900/10">
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
                    <p className="whitespace-nowrap text-sm font-medium text-slate-700">
                      {requestDate.date}
                    </p>
                    {requestDate.time && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {requestDate.time}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                    <span className="whitespace-nowrap">
                      {user.phoneNumber || '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onFinalize(user)}
                      className="inline-flex h-9 w-[118px] items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-3 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100"
                    >
                      <FinalizeIcon />
                      Finalize
                    </button>
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
          itemLabel="deactivation requests"
          onPageChange={onPageChange}
        />
      )}
    </section>
  )
}
