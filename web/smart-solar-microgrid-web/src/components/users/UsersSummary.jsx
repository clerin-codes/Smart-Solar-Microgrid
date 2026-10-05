import {
  CheckIcon,
  ClockIcon,
  PortalIcon,
  UsersIcon,
  WarningIcon,
} from './UserManagementIcons'

function StatCard({
  title,
  value,
  description,
  icon,
  tone,
}) {
  const styles = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-violet-100 text-violet-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles[tone] ?? styles.blue}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">
            {title}
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.04em] text-slate-950">
            {value}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Summary cards remain presentation-only; counts are derived in UsersPage. */
export default function UsersSummary({ summary }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="All Users"
        value={summary.total}
        description="Total registered accounts"
        tone="blue"
        icon={<UsersIcon />}
      />

      <StatCard
        title="Active"
        value={summary.active}
        description="Accounts with active access"
        tone="green"
        icon={<CheckIcon />}
      />

      <StatCard
        title="Pending Activation"
        value={summary.pending}
        description="Awaiting activation"
        tone="amber"
        icon={<ClockIcon />}
      />

      <StatCard
        title="Deactivation Requests"
        value={summary.deactivationRequests}
        description="Awaiting Backoffice action"
        tone="red"
        icon={<WarningIcon />}
      />

      <StatCard
        title="Web Users"
        value={summary.webUsers}
        description="Backoffice and Grid Operators"
        tone="purple"
        icon={<PortalIcon />}
      />
    </section>
  )
}
