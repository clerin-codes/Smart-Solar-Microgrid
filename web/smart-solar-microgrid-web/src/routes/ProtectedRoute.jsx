import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target = user.role === 'Backoffice' ? '/backoffice/dashboard' : '/operator/dashboard'
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
