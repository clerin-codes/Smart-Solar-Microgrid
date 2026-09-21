import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'

import Reservations from '../pages/operator/Reservations'
import ReservationDetails from '../pages/operator/ReservationDetails'

function Overview() {
  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.5l6-6 4 4 8-8"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 10V4h-6"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-slate-800">
          Smart Solar Microgrid
        </h1>

        <p className="mt-2 text-slate-500">
          Select a workspace from the sidebar.
        </p>
      </div>
    </div>
  )
}

function BackofficeDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600">
          Backoffice
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-800">
          Backoffice Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Manage users, solar stations and energy slots.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Users
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-800">
            128
          </p>

          <p className="mt-2 text-sm text-green-600">
            +12 this month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Active Stations
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-800">
            12
          </p>

          <p className="mt-2 text-sm text-green-600">
            10 operational
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Energy Slots
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-800">
            46
          </p>

          <p className="mt-2 text-sm text-blue-600">
            31 available
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            System Status
          </p>

          <p className="mt-3 text-2xl font-bold text-green-600">
            Operational
          </p>

          <p className="mt-2 text-sm text-slate-500">
            All core services running
          </p>
        </div>

      </div>

      {/* Management cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            User Management
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage system users, prosumers and operator accounts.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage Users
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Solar Stations
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create, update and manage solar energy stations.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage Stations
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            Energy Slots
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage station schedules and available energy booking slots.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Manage Slots
          </button>
        </div>

      </div>
    </div>
  )
}

function OperatorDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">
          Grid Operator
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-800">
          Grid Operator Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Monitor reservations, approvals and energy transactions.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Reservations
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-800">
            24
          </p>

          <p className="mt-2 text-sm text-slate-500">
            All reservations
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">
            Pending Approval
          </p>

          <p className="mt-3 text-3xl font-bold text-amber-700">
            6
          </p>

          <p className="mt-2 text-sm text-amber-600">
            Requires attention
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-700">
            Approved
          </p>

          <p className="mt-3 text-3xl font-bold text-blue-700">
            11
          </p>

          <p className="mt-2 text-sm text-blue-600">
            QR verification pending
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-700">
            Completed
          </p>

          <p className="mt-3 text-3xl font-bold text-green-700">
            7
          </p>

          <p className="mt-2 text-sm text-green-600">
            Completed transactions
          </p>
        </div>

      </div>

      {/* Operator sections */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Pending */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Pending Reservations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Reservations waiting for approval.
              </p>
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              6 Pending
            </span>
          </div>

          <div className="mt-5 space-y-3">

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  RES-20260922-001
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Prosumer: 20000000003
                </p>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Pending
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  RES-20260922-002
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Prosumer: 20000000006
                </p>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Pending
              </span>
            </div>

          </div>

        </div>

        {/* Transaction Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-800">
            Transaction Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current energy transaction activity.
          </p>

          <div className="mt-5 space-y-4">

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  QR Verification
                </span>

                <span className="font-semibold text-blue-600">
                  5
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-2/3 rounded-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  In Progress
                </span>

                <span className="font-semibold text-amber-600">
                  3
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-1/2 rounded-full bg-amber-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Completed
                </span>

                <span className="font-semibold text-green-600">
                  7
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-5/6 rounded-full bg-green-500" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Application Layout */}
        <Route element={<MainLayout />}>

          {/* General Overview */}
          <Route
            path="/dashboard"
            element={<Overview />}
          />

          {/* Backoffice Dashboard */}
          <Route
            path="/backoffice/dashboard"
            element={<BackofficeDashboard />}
          />

          {/* Grid Operator Dashboard */}
          <Route
            path="/operator/dashboard"
            element={<OperatorDashboard />}
          />

          {/* Grid Operator Reservations */}
          <Route
            path="/operator/reservations"
            element={<Reservations />}
          />

          {/* Reservation Details */}
          <Route
            path="/operator/reservations/:id"
            element={<ReservationDetails />}
          />

        </Route>

        {/* Unknown Route */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes