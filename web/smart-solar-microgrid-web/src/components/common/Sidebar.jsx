import { NavLink } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

/* =====================================================
   Icons
===================================================== */

function Icon({ name }) {
  const common = 'h-[18px] w-[18px]'

  if (name === 'overview') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="8"
          r="3.5"
        />

        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    )
  }

  if (name === 'users') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />

        <path d="M16 6.5a2.5 2.5 0 0 1 0 5" />

        <path d="M17 14a5 5 0 0 1 4 5" />
      </svg>
    )
  }

  if (name === 'pending') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />

        <path d="M12 8v4l2.5 1.5" />
      </svg>
    )
  }

  if (name === 'deactivation') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />

        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    )
  }

  if (name === 'station') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <path d="M12 21s6-5 6-11a6 6 0 1 0-12 0c0 6 6 11 6 11Z" />

        <circle
          cx="12"
          cy="10"
          r="2"
        />
      </svg>
    )
  }

  if (name === 'slots') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2"
        />

        <path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    )
  }

  if (name === 'reservations') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={common}
        aria-hidden="true"
      >
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2"
        />

        <path d="M8 3v4M16 3v4M4 10h16" />

        <path d="m9 15 2 2 4-4" />
      </svg>
    )
  }

  if (name === 'collapse') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="m14 7-5 5 5 5" />
      </svg>
    )
  }

  return null
}

/* =====================================================
   Sidebar Item
===================================================== */

function SidebarItem({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
  end = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={label}
      title={
        collapsed
          ? label
          : undefined
      }
      className={({ isActive }) =>
        [
          'group relative flex h-[44px] items-center rounded-xl transition-all duration-200',

          collapsed
            ? 'justify-center'
            : 'gap-3 px-3',

          isActive
            ? 'bg-[#2F6FED] text-white shadow-[0_6px_18px_rgba(47,111,237,0.28)]'
            : 'text-slate-100 hover:bg-white/[0.09] hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',

              isActive
                ? 'bg-white/15 text-white'
                : 'bg-white text-[#234E76] shadow-sm group-hover:bg-blue-50 group-hover:text-blue-700',
            ].join(' ')}
          >
            <Icon name={icon} />
          </span>

          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.01em]">
              {label}
            </span>
          )}

          {isActive &&
            !collapsed && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
            )}
        </>
      )}
    </NavLink>
  )
}

/* =====================================================
   Sidebar Group
===================================================== */

function SidebarGroup({
  title,
  collapsed,
  children,
}) {
  return (
    <div className="mt-5">
      {!collapsed ? (
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/70">
          {title}
        </p>
      ) : (
        <div className="mx-auto mb-2 h-px w-7 bg-white/15" />
      )}

      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

/* =====================================================
   Sidebar
===================================================== */

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}) {
  const auth = useAuth()

  const user =
    auth?.user ??
    auth?.currentUser ??
    auth?.authUser ??
    null

  const role =
    user?.role ?? ''

  const isBackoffice =
    role === 'Backoffice'

  const isGridOperator =
    role === 'GridOperator'

  /* -----------------------------------------------------
     Each role must return to its own dashboard when the
     Overview navigation item is selected.
  ----------------------------------------------------- */

  const overviewPath =
    isBackoffice
      ? '/backoffice/dashboard'
      : isGridOperator
        ? '/operator/dashboard'
        : '/dashboard'

  function closeMobile() {
    if (
      typeof onCloseMobile ===
      'function'
    ) {
      onCloseMobile()
    }
  }

  const sidebar = (
    <aside
      className={`flex h-full flex-col overflow-hidden border-r border-blue-950/20 bg-gradient-to-b from-[#123B63] via-[#103657] to-[#0D2E4A] text-white shadow-[4px_0_18px_rgba(15,47,75,0.08)] transition-[width] duration-300 ${
        collapsed
          ? 'w-[86px]'
          : 'w-[288px]'
      }`}
    >
      {/* =================================================
          TOP
      ================================================== */}

      <div
        className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${
          collapsed
            ? 'justify-center px-3'
            : 'justify-between px-5'
        }`}
      >
        {!collapsed && (
          <h2 className="text-[21px] font-bold tracking-[-0.035em] text-white">
            Workspace
          </h2>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-blue-100 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.14] hover:text-white ${
            collapsed
              ? 'rotate-180'
              : ''
          }`}
        >
          <Icon name="collapse" />
        </button>
      </div>

      {/* =================================================
          NAVIGATION
      ================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {/* =================================================
            GENERAL
        ================================================== */}

        <SidebarGroup
          title="General"
          collapsed={collapsed}
        >
          <SidebarItem
            to={overviewPath}
            icon="overview"
            label="Overview"
            collapsed={collapsed}
            onNavigate={closeMobile}
            end
          />

          <SidebarItem
            to="/profile"
            icon="profile"
            label="My Profile"
            collapsed={collapsed}
            onNavigate={closeMobile}
            end
          />
        </SidebarGroup>

        {/* =================================================
            BACKOFFICE
        ================================================== */}

        {isBackoffice && (
          <>
            <SidebarGroup
              title="Users & Accounts Management"
              collapsed={collapsed}
            >
              <SidebarItem
                to="/backoffice/users"
                icon="users"
                label="Users & Accounts"
                collapsed={collapsed}
                onNavigate={closeMobile}
                end
              />

              <SidebarItem
                to="/backoffice/users/pending"
                icon="pending"
                label="Pending Activations"
                collapsed={collapsed}
                onNavigate={closeMobile}
                end
              />

              <SidebarItem
                to="/backoffice/users/deactivation-requests"
                icon="deactivation"
                label="Deactivation Requests"
                collapsed={collapsed}
                onNavigate={closeMobile}
                end
              />
            </SidebarGroup>

            <SidebarGroup
              title="Energy Management"
              collapsed={collapsed}
            >
              <SidebarItem
                to="/backoffice/stations"
                icon="station"
                label="Stations"
                collapsed={collapsed}
                onNavigate={closeMobile}
                end
              />

              <SidebarItem
                to="/backoffice/slots"
                icon="slots"
                label="Energy Slots"
                collapsed={collapsed}
                onNavigate={closeMobile}
                end
              />
            </SidebarGroup>
          </>
        )}

        {/* =================================================
            GRID OPERATOR
        ================================================== */}

        {isGridOperator && (
          <SidebarGroup
            title="Operations"
            collapsed={collapsed}
          >
            <SidebarItem
              to="/operator/reservations"
              icon="reservations"
              label="Reservations"
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
          </SidebarGroup>
        )}
      </div>

      {/* =================================================
          BOTTOM STATUS
      ================================================== */}

      {!collapsed && (
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <p className="text-[12px] font-semibold text-white">
                System Online
              </p>
            </div>

            <p className="mt-1 text-[11px] font-medium text-blue-200/70">
              Smart Solar Microgrid
            </p>
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <>
      {/* =================================================
          DESKTOP
      ================================================== */}

      <div className="hidden h-full overflow-hidden lg:block">
        {sidebar}
      </div>

      {/* =================================================
          MOBILE
      ================================================== */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
          />

          <div className="relative z-10 h-full w-[288px] overflow-hidden shadow-[20px_0_60px_rgba(0,0,0,0.25)]">
            {sidebar}
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar