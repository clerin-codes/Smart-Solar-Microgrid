import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'

import MainLayout from '../layouts/MainLayout'

import useAuth from '../hooks/useAuth'

import LoginPage from '../pages/auth/LoginPage'
import AccessDenied from '../pages/common/AccessDenied'
import ProfilePage from '../pages/account/ProfilePage'

import BackofficeDashboard from '../pages/backoffice/BackofficeDashboard'
import UsersPage from '../pages/backoffice/UsersPage'
import PendingActivationsPage from '../pages/backoffice/PendingActivationsPage'
import DeactivationRequestsPage from '../pages/backoffice/DeactivationRequestsPage'

import Stations from '../pages/backoffice/Stations'
import Slots from '../pages/backoffice/Slots'

import OperatorDashboard from '../pages/operator/OperatorDashboard'
import Reservations from '../pages/operator/Reservations'
import ReservationDetails from '../pages/operator/ReservationDetails'

function RoleHomeRedirect() {
  const {
    user,
  } = useAuth()

  if (
    user?.role ===
    'Backoffice'
  ) {
    return (
      <Navigate
        to="/backoffice/dashboard"
        replace
      />
    )
  }

  if (
    user?.role ===
    'GridOperator'
  ) {
    return (
      <Navigate
        to="/operator/dashboard"
        replace
      />
    )
  }

  return (
    <Navigate
      to="/access-denied"
      replace
    />
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />

        <Route
          path="/access-denied"
          element={
            <AccessDenied />
          }
        />

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                'Backoffice',
                'GridOperator',
              ]}
            />
          }
        >
          <Route
            element={
              <MainLayout />
            }
          >
            <Route
              index
              element={
                <RoleHomeRedirect />
              }
            />

            <Route
              path="/dashboard"
              element={
                <RoleHomeRedirect />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfilePage />
              }
            />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'Backoffice',
                  ]}
                />
              }
            >
              <Route
                path="/backoffice/dashboard"
                element={
                  <BackofficeDashboard />
                }
              />

              <Route
                path="/backoffice/users"
                element={
                  <UsersPage />
                }
              />

              <Route
                path="/backoffice/users/pending"
                element={
                  <PendingActivationsPage />
                }
              />

              <Route
                path="/backoffice/users/deactivation-requests"
                element={
                  <DeactivationRequestsPage />
                }
              />

              <Route
                path="/backoffice/stations"
                element={
                  <Stations />
                }
              />

              <Route
                path="/backoffice/slots"
                element={
                  <Slots />
                }
              />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    'GridOperator',
                  ]}
                />
              }
            >
              <Route
                path="/operator/dashboard"
                element={
                  <OperatorDashboard />
                }
              />

              <Route
                path="/operator/reservations"
                element={
                  <Reservations />
                }
              />

              <Route
                path="/operator/reservations/:id"
                element={
                  <ReservationDetails />
                }
              />
            </Route>

            <Route
              path="*"
              element={
                <RoleHomeRedirect />
              }
            />
          </Route>
        </Route>

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