const PAGE_SIZES = [5, 10, 20, 50]

function Pagination({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const pages = []
  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const last = Math.min(totalPages, first + 4)
  for (let number = first; number <= last; number += 1) pages.push(number)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>Showing <strong className="text-slate-900">{start}-{end}</strong> of <strong className="text-slate-900">{totalItems}</strong></span>
        <label className="flex items-center gap-2">
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} rows</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1" aria-label="Pagination">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        {pages.map((number) => (
          <button
            type="button"
            key={number}
            onClick={() => onPageChange(number)}
            aria-current={number === currentPage ? 'page' : undefined}
            className={`hidden h-8 min-w-8 rounded-lg px-2 text-sm font-semibold sm:block ${number === currentPage ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            {number}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}

export default Pagination
