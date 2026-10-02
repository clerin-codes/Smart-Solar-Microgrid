import {
  Link,
} from 'react-router-dom'

import {
  ArrowRightIcon,
  ProfileIcon,
  ReservationsIcon,
  ShieldIcon,
} from '../../components/common/Icons'

import useAuth from '../../hooks/useAuth'

export default function OperatorDashboard() {
  const {
    user,
  } = useAuth()

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-emerald-600">
          Grid Operator
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Welcome,{' '}
          {user?.fullName ??
            'Operator'}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Your authenticated Grid
          Operator workspace provides
          access to reservation and
          operational functions assigned
          to your role.
        </p>
      </header>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <ShieldIcon className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-emerald-900">
              Role-based access active
            </p>

            <p className="mt-1 text-sm leading-6 text-emerald-700">
              You are signed in as a
              Grid Operator. Backoffice
              administration routes are
              protected from this role.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/operator/reservations"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ReservationsIcon className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-bold text-slate-900">
            Reservations
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Open the reservation
            operations implemented by
            the reservation module.
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
            Open reservations

            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/profile"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ProfileIcon className="h-5 w-5" />
          </div>

          <h2 className="mt-4 font-bold text-slate-900">
            My Profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review and update your
            authenticated account
            contact information.
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600">
            View profile

            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </section>
    </div>
  )
}