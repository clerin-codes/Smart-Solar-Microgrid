import {
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
import Transactions from '../pages/operator/Transactions'
import Assets from '../pages/operator/Assets'

/* =====================================================
   Role Home Redirect

   Redirects authenticated web users to the dashboard
   that belongs to their assigned system role.
===================================================== */

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

/* =====================================================
   Application Routes

   Public:
   - Login
   - Access denied

   Shared authenticated:
   - Dashboard redirect
   - Profile

   Backoffice:
   - Dashboard
   - User management
   - Pending activations
   - Deactivation requests
   - Stations
   - Energy slots

   Grid Operator:
   - Dashboard
   - Assets
   - Reservations
   - Reservation details
   - Transactions
   - Transaction history
===================================================== */

export default function AppRoutes() {
  return (
      <Routes>
        {/* =================================================
            PUBLIC ROUTES
        ================================================== */}

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

        {/* Root always goes through protected dashboard flow */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* =================================================
            AUTHENTICATED WEB USERS

            Only Backoffice and Grid Operator users are
            permitted to access the React web application.
        ================================================== */}

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
            {/* =================================================
                SHARED ROUTES
            ================================================== */}

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

            {/* =================================================
                BACKOFFICE ROUTES

                Backoffice users have access to system
                administration functions.
            ================================================== */}

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

            {/* =================================================
                GRID OPERATOR ROUTES

                Grid Operators have access only to operational
                functions and not Backoffice administration.
            ================================================== */}

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
                path="/operator/assets"
                element={
                  <Assets />
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

              <Route
                path="/operator/transactions"
                element={
                  <Transactions />
                }
              />

              <Route
                path="/operator/history"
                element={
                  <Transactions
                    completedOnly
                  />
                }
              />
            </Route>

            {/* =================================================
                AUTHENTICATED UNKNOWN ROUTE

                Redirect authenticated users back to the
                dashboard appropriate for their role.
            ================================================== */}

            <Route
              path="*"
              element={
                <RoleHomeRedirect />
              }
            />
          </Route>
        </Route>

        {/* =================================================
            GLOBAL FALLBACK
        ================================================== */}

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
  )
}