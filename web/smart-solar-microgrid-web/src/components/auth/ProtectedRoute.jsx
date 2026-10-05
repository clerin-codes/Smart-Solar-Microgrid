import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'

import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({
  allowedRoles,
}) {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth()

  const location =
    useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading SunChain...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }

  if (
    Array.isArray(
      allowedRoles
    ) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
      user?.role
    )
  ) {
    return (
      <Navigate
        to="/access-denied"
        replace
      />
    )
  }

  return <Outlet />
}