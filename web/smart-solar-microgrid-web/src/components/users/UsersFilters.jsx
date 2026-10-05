import {
  FilterIcon,
  SearchIcon,
} from './UserManagementIcons'

/** Keeps search/filter markup out of the page controller without changing UI. */
export default function UsersFilters({
  search,
  role,
  status,
  pageError,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onClear,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(300px,1.4fr)_215px_240px_auto]">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
            <SearchIcon />
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, NIC, email or phone..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="">All roles</option>
          <option value="Backoffice">Backoffice</option>
          <option value="GridOperator">Grid Operator</option>
          <option value="Prosumer">Solar Prosumer</option>
        </select>

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="PendingActivation">Pending Activation</option>
          <option value="DeactivationRequested">Deactivation Requested</option>
          <option value="Deactivated">Deactivated</option>
        </select>

        <button
          type="button"
          onClick={onClear}
          disabled={!search && !role && !status}
          className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
        >
          <FilterIcon />
          Clear Filters
        </button>
      </div>

      {pageError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {pageError}
        </div>
      )}
    </section>
  )
}
