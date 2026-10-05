function DialogIcon({
  tone,
}) {
  if (tone === 'success') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m8 12 2.6 2.6L16.5 9" />
      </svg>
    )
  }

  if (tone === 'danger') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M12 3 2.8 20h18.4L12 3Z" />

        <path d="M12 9v4" />

        <circle
          cx="12"
          cy="16.5"
          r=".8"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    )
  }

  if (tone === 'warning') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 7v5" />

        <circle
          cx="12"
          cy="16"
          r=".8"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M20 6v5h-5" />

      <path d="M18.5 8.5A7 7 0 1 0 19 16" />
    </svg>
  )
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null
  }

  const styles = {
    primary: {
      icon:
        'border-blue-200 bg-blue-50 text-blue-700',

      button:
        'bg-blue-700 hover:bg-blue-800 focus-visible:outline-blue-700',
    },

    success: {
      icon:
        'border-emerald-200 bg-emerald-50 text-emerald-700',

      button:
        'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600',
    },

    warning: {
      icon:
        'border-amber-200 bg-amber-50 text-amber-700',

      button:
        'bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600',
    },

    danger: {
      icon:
        'border-red-200 bg-red-50 text-red-700',

      button:
        'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600',
    },
  }

  const currentStyle =
    styles[tone] ??
    styles.primary

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
      role="presentation"
    >
      <div
        className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="px-6 pb-5 pt-6">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${currentStyle.icon}`}
          >
            <DialogIcon
              tone={tone}
            />
          </div>

          <h2
            id="confirm-dialog-title"
            className="mt-5 text-xl font-bold tracking-[-0.02em] text-slate-950"
          >
            {title}
          </h2>

          <p
            id="confirm-dialog-message"
            className="mt-2 text-sm leading-6 text-slate-500"
          >
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex h-11 min-w-[124px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${currentStyle.button}`}
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            )}

            {loading
              ? 'Processing...'
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}