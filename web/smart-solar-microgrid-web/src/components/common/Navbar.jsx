import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import logo from '../../assets/logo.png'
import useAuth from '../../hooks/useAuth'

const PAGE_TITLES = {
  '/dashboard': {
    title: 'Overview',
    subtitle: 'Welcome to the Smart Solar Microgrid portal.',
  },
  '/profile': {
    title: 'My Profile',
    subtitle:
      'Review and manage your account details securely.',
  },
  '/backoffice/dashboard': {
    title: 'Backoffice Dashboard',
    subtitle:
      'Monitor users, activations, and administration tasks.',
  },
  '/backoffice/users': {
    title: 'User Management',
    subtitle:
      'Create, update, filter, and manage web users and prosumers.',
  },
  '/backoffice/users/pending': {
    title: 'Pending Activations',
    subtitle:
      'Approve prosumer accounts waiting for activation.',
  },
  '/backoffice/users/deactivation-requests': {
    title: 'Deactivation Requests',
    subtitle:
      'Review and process user deactivation requests.',
  },
  '/backoffice/stations': {
    title: 'Stations',
    subtitle:
      'Manage energy stations and their information.',
  },
  '/backoffice/slots': {
    title: 'Energy Slots',
    subtitle:
      'Create and maintain bookable energy reservation slots.',
  },
  '/operator/dashboard': {
    title: 'Operator Dashboard',
    subtitle:
      'Track operational activity and reservation workflows.',
  },
  '/operator/reservations': {
    title: 'Reservations',
    subtitle:
      'Review and manage current reservations.',
  },
}

function getPageMeta(pathname) {
  return (
    PAGE_TITLES[pathname] ?? {
      title: 'Workspace',
      subtitle: 'Smart Solar Microgrid Management Portal.',
    }
  )
}

function roleLabel(role) {
  if (role === 'GridOperator') return 'Grid Operator'
  return role
}

function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const menuRef = useRef(null)

  const pageMeta = useMemo(
    () => getPageMeta(location.pathname),
    [location.pathname],
  )

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )
    return () =>
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
            aria-label="Open navigation"
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          <div className="hidden md:block">
            <img
              src={logo}
              alt="SunChain"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {pageMeta.title}
            </h1>
            <p className="hidden truncate text-sm text-slate-500 sm:block">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        <div
          ref={menuRef}
          className="relative shrink-0"
        >
          <button
            type="button"
            onClick={() =>
              setIsProfileOpen((current) => !current)
            }
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-bold text-white">
              {user?.fullName?.slice(0, 1).toUpperCase() ||
                'U'}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-44 truncate text-sm font-semibold text-slate-800">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-slate-500">
                {roleLabel(user?.role)}
              </p>
            </div>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {roleLabel(user?.role)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false)
                  navigate('/profile')
                }}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                My Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar