import { NavLink } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

function NavIcon({ children }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm transition group-hover:bg-white group-hover:text-blue-700">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-5 w-5"
      >
        {children}
      </svg>
    </span>
  )
}

function roleLabel(role) {
  if (role === 'GridOperator') return 'Grid Operator'
  return role
}

function navClass({ isActive, collapsed }) {
  return `group flex items-center ${
    collapsed ? 'justify-center' : 'gap-3'
  } rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-200'
      : 'text-slate-700 hover:bg-white/80 hover:text-slate-950'
  }`
}

function NavItem({
  to,
  label,
  collapsed,
  title,
  children,
}) {
  return (
    <NavLink
      to={to}
      title={collapsed ? title ?? label : undefined}
      className={(props) => navClass({ ...props, collapsed })}
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
              isActive
                ? 'bg-white/15 text-white'
                : 'bg-white/70 text-slate-700 shadow-sm group-hover:bg-white group-hover:text-blue-700'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              {children}
            </svg>
          </span>

          {!collapsed && (
            <span className="truncate">{label}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SectionTitle({ children, collapsed }) {
  if (collapsed) return null

  return (
    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  )
}

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) {
  const { user } = useAuth()

  const isBackoffice = user?.role === 'Backoffice'
  const isOperator = user?.role === 'GridOperator'

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-50 flex w-80'
            : 'hidden'
        } lg:static lg:z-auto lg:flex lg:min-h-screen ${
          collapsed ? 'lg:w-24' : 'lg:w-80'
        } shrink-0 flex-col border-r border-white/60 bg-[linear-gradient(180deg,_#e2ecf3_0%,_#edf4ff_100%)] shadow-xl transition-all duration-300`}
      >
        <div
          className={`flex h-20 items-center border-b border-white/70 ${
            collapsed
              ? 'justify-center lg:px-3'
              : 'justify-between px-5'
          }`}
        >
          {!collapsed && (
            <div>
              <p className="text-lg font-bold text-slate-900">
                Workspace
              </p>
              <p className="text-xs text-slate-500">
                {roleLabel(user?.role)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:flex"
              aria-label={
                collapsed
                  ? 'Expand sidebar'
                  : 'Collapse sidebar'
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`h-5 w-5 transition-transform ${
                  collapsed ? 'rotate-180' : ''
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={onMobileClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Close navigation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            <SectionTitle collapsed={collapsed}>
              General
            </SectionTitle>

            <NavItem
              to="/dashboard"
              label="Overview"
              collapsed={collapsed}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 10.5 12 3l8.25 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13.5a1.5 1.5 0 0 1-1.5-1.5v-9Z"
              />
            </NavItem>

            <NavItem
              to="/profile"
              label="My Profile"
              collapsed={collapsed}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
              />
            </NavItem>
          </div>

          {isBackoffice && (
            <div className="mt-8 space-y-1">
              <SectionTitle collapsed={collapsed}>
                Administration
              </SectionTitle>

              <NavItem
                to="/backoffice/dashboard"
                label="Dashboard"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.5 9 7.5l4 4 8-8M21 10V4h-6"
                />
              </NavItem>

              <NavItem
                to="/backoffice/users"
                label="Users"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.75a7.5 7.5 0 0 0-12 0M14.25 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM18.75 9.75a2.25 2.25 0 1 1 0 4.5m-13.5-4.5a2.25 2.25 0 1 0 0 4.5"
                />
              </NavItem>

              <NavItem
                to="/backoffice/users/pending"
                label="Pending Activations"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6l3 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </NavItem>

              <NavItem
                to="/backoffice/users/deactivation-requests"
                label="Deactivation Requests"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </NavItem>
            </div>
          )}

          {isBackoffice && (
            <div className="mt-8 space-y-1">
              <SectionTitle collapsed={collapsed}>
                Energy Management
              </SectionTitle>

              <NavItem
                to="/backoffice/stations"
                label="Stations"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Zm0-7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
                />
              </NavItem>

              <NavItem
                to="/backoffice/slots"
                label="Energy Slots"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h7.5M8.25 12h7.5M8.25 17.25h7.5"
                />
              </NavItem>
            </div>
          )}

          {isOperator && (
            <div className="mt-8 space-y-1">
              <SectionTitle collapsed={collapsed}>
                Grid Operations
              </SectionTitle>

              <NavItem
                to="/operator/dashboard"
                label="Dashboard"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.5 9 7.5l4 4 8-8M21 10V4h-6"
                />
              </NavItem>

              <NavItem
                to="/operator/reservations"
                label="Reservations"
                collapsed={collapsed}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 3.75h9A2.25 2.25 0 0 1 18.75 6v12a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5.25 18V6A2.25 2.25 0 0 1 7.5 3.75Zm1.5 6.75 2 2 4-4.5"
                />
              </NavItem>
            </div>
          )}
        </nav>

        {!collapsed && (
          <div className="border-t border-white/70 p-4">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.fullName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                NIC: {user?.nic}
              </p>
              <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {roleLabel(user?.role)}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar