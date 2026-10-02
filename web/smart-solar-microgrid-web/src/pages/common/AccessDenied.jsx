import {
  Link,
} from 'react-router-dom'

import {
  ShieldIcon,
} from '../../components/common/Icons'

import useAuth from '../../hooks/useAuth'

export default function AccessDenied() {
  const {
    user,
  } = useAuth()

  const home =
    user?.role ===
    'Backoffice'
      ? '/backoffice/dashboard'
      : '/operator/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldIcon className="h-8 w-8" />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
          Access denied
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          You do not have permission
          to access this page.
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          This area is protected by
          role-based access control.
          Return to the workspace
          available for your account.
        </p>

        <Link
          to={home}
          className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  )
}