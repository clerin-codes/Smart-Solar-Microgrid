import {
  getStatusLabel,
  normalizeStatus,
} from '../../utils/userFormat'

const STYLE_BY_STATUS = {
  Active:
    'border-emerald-200 bg-emerald-50 text-emerald-700',

  PendingActivation:
    'border-amber-200 bg-amber-50 text-amber-700',

  DeactivationRequested:
    'border-orange-200 bg-orange-50 text-orange-700',

  Deactivated:
    'border-slate-200 bg-slate-100 text-slate-600',
}

export default function StatusBadge({
  status,
}) {
  const normalized =
    normalizeStatus(status)

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        STYLE_BY_STATUS[
          normalized
        ] ??
        'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {getStatusLabel(
        normalized
      )}
    </span>
  )
}