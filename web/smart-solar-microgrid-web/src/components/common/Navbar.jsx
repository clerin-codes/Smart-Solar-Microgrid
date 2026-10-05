import {
  useNavigate,
} from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

/* =====================================================
   Helpers
===================================================== */

function getInitials(
  fullName = '',
) {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    parts.length === 0
  ) {
    return 'U'
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase()
}

function getRoleLabel(role) {
  if (
    role === 'GridOperator'
  ) {
    return 'Grid Operator'
  }

  if (
    role === 'Backoffice'
  ) {
    return 'Backoffice'
  }

  return role || 'User'
}

/* =====================================================
   Icons
===================================================== */

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />

      <path d="m14 8 4 4-4 4" />

      <path d="M18 12H9" />
    </svg>
  )
}

/* =====================================================
   Navbar
===================================================== */

/**
 * Displays the application brand, authenticated user identity
 * and the explicit logout action for the protected web portal.
 */
function Navbar({
  onOpenMobileMenu,
}) {
  const auth =
    useAuth()

  const navigate =
    useNavigate()

  const user =
    auth?.user ??
    auth?.currentUser ??
    auth?.authUser ??
    null

  const fullName =
    user?.fullName ??
    user?.name ??
    'User'

  const role =
    user?.role ?? ''

  const initials =
    getInitials(
      fullName,
    )

  /* ===================================================
     Logout
  ==================================================== */

  async function handleLogout() {
    /*
     * Clear the client authentication session first.
     * Explicit navigation then guarantees that logout
     * always finishes on the public login page.
     */

    if (
      typeof auth?.logout ===
      'function'
    ) {
      await auth.logout()

      navigate(
        '/login',
        {
          replace: true,
        },
      )

      return
    }

    /*
     * Compatibility fallback for an alternative auth
     * provider that exposes signOut instead of logout.
     */

    if (
      typeof auth?.signOut ===
      'function'
    ) {
      await auth.signOut()

      navigate(
        '/login',
        {
          replace: true,
        },
      )

      return
    }

    /*
     * Final defensive fallback. Normally the AuthProvider
     * handles session cleanup, but this prevents a stale
     * local session if the provider method is unavailable.
     */

    localStorage.removeItem(
      'accessToken',
    )

    localStorage.removeItem(
      'authUser',
    )

    navigate(
      '/login',
      {
        replace: true,
      },
    )
  }

  return (
    <header className="sticky top-0 z-40 flex h-[76px] shrink-0 items-center border-b border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-6">
      <div className="flex w-full items-center justify-between gap-5">
        {/* =================================================
            LEFT SIDE
        ================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu */}

          <button
            type="button"
            onClick={
              onOpenMobileMenu
            }
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
          >
            <MenuIcon />
          </button>

          {/* Brand */}

          <div className="flex min-w-0 items-center">
            <div className="shrink-0 select-none text-[27px] font-extrabold tracking-[-0.06em]">
              <span className="text-orange-500">
                Sun
              </span>

              <span className="text-blue-800">
                Chain
              </span>
            </div>

            {/* Divider */}

            <div className="mx-4 hidden h-8 w-px bg-slate-200 sm:block" />

            {/* Product name */}

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[15px] font-semibold text-slate-900">
                Smart Solar Microgrid
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Operations Console
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex shrink-0 items-center gap-2.5">
          {/* =================================================
              USER INFORMATION
          ================================================== */}

          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* Initials */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-[13px] font-bold uppercase tracking-[0.04em] text-white">
              {initials}
            </div>

            {/* Name / role */}

            <div className="hidden min-w-0 pr-2 text-left sm:block">
              <p className="max-w-[205px] truncate text-[14px] font-semibold leading-5 text-slate-900">
                {fullName}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {getRoleLabel(
                  role,
                )}
              </p>
            </div>
          </div>

          {/* =================================================
              LOGOUT
          ================================================== */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            aria-label="Logout"
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-50"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar