import {
  LockIcon,
} from './ProfileIcons'

/** Keeps password actions separate from profile editing and profile data. */
export default function SecurityCard({ onChangePassword }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-950">
          Security
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage your sign-in password.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <LockIcon />
          </div>

          <div>
            <p className="text-[15px] font-semibold text-slate-900">
              Password
            </p>

            <p className="mt-1 text-[15px] font-medium tracking-[0.14em] text-slate-500">
              ••••••••••••
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangePassword}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-50"
        >
          <LockIcon />
          Change Password
        </button>
      </div>
    </section>
  )
}
