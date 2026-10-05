/**
 * Shared pagination footer for Member 1
 * account-management tables.
 */
export default function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  visiblePages,
  itemLabel,
  onPageChange,
}) {
  const firstItem =
    totalItems === 0
      ? 0
      : (
          currentPage -
          1
        ) *
          pageSize +
        1

  const lastItem =
    Math.min(
      currentPage *
        pageSize,
      totalItems,
    )

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-500">
        Showing{' '}

        <span className="font-bold text-slate-700">
          {firstItem}
        </span>

        {' - '}

        <span className="font-bold text-slate-700">
          {lastItem}
        </span>

        {' of '}

        <span className="font-bold text-slate-700">
          {totalItems}
        </span>

        {` ${itemLabel}`}
      </p>

      {totalPages >
        1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={
              currentPage ===
              1
            }
            onClick={() =>
              onPageChange(
                Math.max(
                  1,
                  currentPage -
                    1,
                ),
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>

          {visiblePages.map(
            (
              page,
            ) => (
              <button
                type="button"
                key={
                  page
                }
                onClick={() =>
                  onPageChange(
                    page,
                  )
                }
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                  currentPage ===
                  page
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              onPageChange(
                Math.min(
                  totalPages,
                  currentPage +
                    1,
                ),
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}