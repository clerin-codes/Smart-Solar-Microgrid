import { NavLink } from 'react-router-dom'

const navClass = ({ isActive, collapsed }) =>
  `flex items-center ${
    collapsed ? 'justify-center' : 'gap-3'
  } px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-white text-slate-900 shadow-sm'
      : 'text-slate-700 hover:bg-white/70 hover:text-slate-950'
  }`

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`hidden lg:flex shrink-0 min-h-screen flex-col
        bg-[#E8F0F3] border-r border-slate-200
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Top / Collapse Button */}
      <div
        className={`h-16 flex items-center border-b border-slate-200 ${
          collapsed ? 'justify-center' : 'justify-end px-4'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg
                     bg-white text-slate-600 shadow-sm
                     hover:bg-slate-100 hover:text-slate-900
                     transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`h-5 w-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">

        {/* GENERAL */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              General
            </p>
          )}

          <NavLink
            to="/dashboard"
            className={(props) =>
              navClass({
                ...props,
                collapsed,
              })
            }
            title={collapsed ? 'Overview' : undefined}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M5.25 10.5V21h13.5V10.5"
              />
            </svg>

            {!collapsed && <span>Overview</span>}
          </NavLink>
        </div>

        {/* BACKOFFICE */}
        <div className="mt-8">
          {!collapsed && (
            <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Backoffice
            </p>
          )}

          <div className="space-y-1">

            {/* Backoffice Dashboard */}
            <NavLink
              to="/backoffice/dashboard"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Dashboard' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
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

              {!collapsed && <span>Dashboard</span>}
            </NavLink>

            {/* Users */}
            <NavLink
              to="/backoffice/users"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Users' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 01-3 .372 9.38 9.38 0 01-3-.372"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a5.25 5.25 0 00-9-3.678A9.36 9.36 0 0112 3.75a9.36 9.36 0 016 11.7"
                />
              </svg>

              {!collapsed && <span>Users</span>}
            </NavLink>

            {/* Stations */}
            <NavLink
              to="/backoffice/stations"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Stations' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 13.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                />
              </svg>

              {!collapsed && <span>Stations</span>}
            </NavLink>

            {/* Energy Slots */}
            <NavLink
              to="/backoffice/slots"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Energy Slots' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h7.5M8.25 12h7.5M8.25 17.25h7.5"
                />
              </svg>

              {!collapsed && <span>Energy Slots</span>}
            </NavLink>

          </div>
        </div>

        {/* GRID OPERATOR */}
        <div className="mt-8">
          {!collapsed && (
            <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Grid Operator
            </p>
          )}

          <div className="space-y-1">

            {/* Operator Dashboard */}
            <NavLink
              to="/operator/dashboard"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Dashboard' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
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

              {!collapsed && <span>Dashboard</span>}
            </NavLink>

            {/* Reservations */}
            <NavLink
              to="/operator/reservations"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Reservations' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75l2 2 4-4.5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 3.75h9A2.25 2.25 0 0118.75 6v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z"
                />
              </svg>

              {!collapsed && <span>Reservations</span>}
            </NavLink>

            {/* Transactions */}
            <NavLink
              to="/operator/transactions"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'Transactions' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v18M17 7H9.5a2.5 2.5 0 100 5H15a2.5 2.5 0 110 5H7"
                />
              </svg>

              {!collapsed && <span>Transactions</span>}
            </NavLink>

            {/* History */}
            <NavLink
              to="/operator/history"
              className={(props) =>
                navClass({
                  ...props,
                  collapsed,
                })
              }
              title={collapsed ? 'History' : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              {!collapsed && <span>History</span>}
            </NavLink>

          </div>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-600">
            Smart Solar Microgrid
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Web Portal v1.0.0
          </p>
        </div>
      )}
    </aside>
  )
}

export default Sidebar