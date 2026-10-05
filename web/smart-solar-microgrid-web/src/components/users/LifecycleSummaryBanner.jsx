import {
  ClockIcon,
  RequestIcon,
} from './UserManagementIcons'

/** Summary banner variants preserve the existing pending/deactivation designs. */
export default function LifecycleSummaryBanner({
  type,
  count,
}) {
  const isPending = type === 'pending'

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-2xl px-4 py-3 sm:min-w-[340px] ${
        isPending
          ? 'border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 shadow-[0_2px_10px_rgba(120,53,15,0.05)]'
          : 'border border-red-200 bg-gradient-to-r from-red-50 to-rose-50/70 shadow-[0_2px_10px_rgba(127,29,29,0.05)]'
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full ${
          isPending ? 'bg-amber-200/20' : 'bg-red-200/20'
        }`}
      />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
            isPending
              ? 'bg-amber-100 text-amber-700 ring-amber-200/70'
              : 'bg-red-100 text-red-700 ring-red-200/70'
          }`}
        >
          {isPending ? <ClockIcon className="h-5 w-5" /> : <RequestIcon />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            {isPending ? 'Pending Activations' : 'Deactivation Requests'}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {isPending
              ? 'Solar Prosumer accounts waiting for approval'
              : 'Solar Prosumer requests waiting for action'}
          </p>
        </div>

        <div
          className={`shrink-0 border-l pl-4 text-center ${
            isPending ? 'border-amber-200' : 'border-red-200'
          }`}
        >
          <p
            className={`text-[28px] font-bold leading-none tracking-[-0.04em] ${
              isPending ? 'text-amber-700' : 'text-red-700'
            }`}
          >
            {count}
          </p>

          <p
            className={`mt-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
              isPending ? 'text-amber-700/70' : 'text-red-700/70'
            }`}
          >
            {isPending
              ? count === 1 ? 'Account' : 'Accounts'
              : count === 1 ? 'Request' : 'Requests'}
          </p>
        </div>
      </div>
    </div>
  )
}
