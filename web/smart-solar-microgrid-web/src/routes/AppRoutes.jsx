import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Users from '../pages/backoffice/Users'
import Stations from '../pages/backoffice/Stations'
import Slots from '../pages/backoffice/Slots'
import Reservations from '../pages/operator/Reservations'
import ReservationDetails from '../pages/operator/ReservationDetails'
import Transactions from '../pages/operator/Transactions'
import Assets from '../pages/operator/Assets'
import { useAuth } from '../context/AuthContext'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'Backoffice' ? '/backoffice/dashboard' : '/operator/dashboard'} replace />
}

function AppRoutes() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<HomeRedirect />} />

    <Route element={<ProtectedRoute allowedRoles={['Backoffice', 'GridOperator']} />}>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<HomeRedirect />} />

        <Route element={<ProtectedRoute allowedRoles={['Backoffice']} />}>
          <Route path="/backoffice/dashboard" element={<Dashboard />} />
          <Route path="/backoffice/users" element={<Users />} />
          <Route path="/backoffice/stations" element={<Stations />} />
          <Route path="/backoffice/slots" element={<Slots />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['GridOperator']} />}>
          <Route path="/operator/dashboard" element={<Dashboard />} />
          <Route path="/operator/assets" element={<Assets />} />
          <Route path="/operator/reservations" element={<Reservations />} />
          <Route path="/operator/reservations/:id" element={<ReservationDetails />} />
          <Route path="/operator/transactions" element={<Transactions />} />
          <Route path="/operator/history" element={<Transactions completedOnly />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<HomeRedirect />} />
  </Routes></BrowserRouter>
}

export default AppRoutes
