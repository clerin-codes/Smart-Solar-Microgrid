import {
  FilterIcon,
  SearchIcon,
} from './UserManagementIcons'

/** Search/sort panel shared by pending and deactivation lifecycle pages. */
export default function LifecycleFilters({
  search,
  sortOrder,
  pageError,
  onSearchChange,
  onSortChange,
  onClear,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(320px,1fr)_210px_auto]">
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
          value={sortOrder}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>

        <button
          type="button"
          onClick={onClear}
          disabled={!search && sortOrder === 'newest'}
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
