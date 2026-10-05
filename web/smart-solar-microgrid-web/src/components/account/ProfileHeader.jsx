import {
  getRoleLabel,
  getStatusLabel,
} from '../../utils/userFormat'

import {
  EditIcon,
} from './ProfileIcons'

/**
 * Displays account identity and lifecycle state.
 * Profile state remains owned by ProfilePage.
 */
export default function ProfileHeader({
  profile,
  status,
  initials,
  editing,
  onEdit,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="h-1 bg-blue-800" />

      <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-900 text-[28px] font-bold uppercase tracking-[0.04em] text-white shadow-sm ring-4 ring-blue-50">
            {initials}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold tracking-[-0.025em] text-slate-950">
              {
                profile?.fullName
              }
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                {getRoleLabel(
                  profile?.role,
                )}
              </span>

              <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />

                {getStatusLabel(
                  status,
                )}
              </span>
            </div>
          </div>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={
              onEdit
            }
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-50 md:self-auto"
          >
            <EditIcon />

            Edit Profile
          </button>
        )}
      </div>
    </section>
  )
}