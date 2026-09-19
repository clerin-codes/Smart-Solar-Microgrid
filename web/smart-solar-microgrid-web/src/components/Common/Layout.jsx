import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/sunchain-logo.png'
import { ROLE_LABELS, ROLES } from '../../utils/constants'

const NAV = [
  { to: '/', label: 'Dashboard', end: true, roles: null },
  { to: '/stations', label: 'Stations', roles: null },
  { to: '/reservations', label: 'Reservations', roles: null },
  { to: '/qr-scanner', label: 'QR Scanner', roles: [ROLES.GRID_OPERATOR] },
  { to: '/transactions', label: 'Transactions', roles: [ROLES.GRID_OPERATOR, ROLES.BACKOFFICE] },
  { to: '/reports', label: 'Reports', roles: [ROLES.GRID_OPERATOR, ROLES.BACKOFFICE] },
  { to: '/users', label: 'Users', roles: [ROLES.BACKOFFICE] },
  { to: '/profile', label: 'My Profile', roles: null },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role))
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white p-4 transition md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-6 px-2">
          <img src={logo} alt="SunChain" className="h-14 w-auto" />
        </div>
        <nav className="space-y-1">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <button
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            &#9776;
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="font-medium text-gray-900">{user.fullName}</div>
              <div className="text-xs text-gray-500">{ROLE_LABELS[user.role] ?? user.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
