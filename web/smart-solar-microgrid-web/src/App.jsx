import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProfilePage from './components/Auth/ProfilePage'
import UserManagement from './components/Auth/UserManagement'
import ErrorBoundary from './components/Common/ErrorBoundary'
import Layout from './components/Common/Layout'
import ObjectIdRoute from './components/Common/ObjectIdRoute'
import RoleBasedRoute from './components/Common/RoleBasedRoute'
import QRScannerPage from './components/QRScanner/QRScannerPage'
import TransactionDetail from './components/Transactions/TransactionDetail'
import TransactionHistory from './components/Transactions/TransactionHistory'
import TransactionList from './components/Transactions/TransactionList'
import ReservationDetail from './components/Reservations/ReservationDetail'
import ReservationList from './components/Reservations/ReservationList'
import StationDetail from './components/Stations/StationDetail'
import StationForm from './components/Stations/StationForm'
import StationList from './components/Stations/StationList'
import { Spinner } from './components/Common/ui'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import { ROLES } from './utils/constants'

const ReportsPage = lazy(() => import('./components/Reports/ReportsPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RoleBasedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="stations" element={<StationList />} />
                <Route path="reservations" element={<ReservationList />} />
                <Route element={<ObjectIdRoute />}>
                  <Route path="stations/:id" element={<StationDetail />} />
                  <Route path="reservations/:id" element={<ReservationDetail />} />
                </Route>

                <Route element={<RoleBasedRoute roles={[ROLES.BACKOFFICE]} />}>
                  <Route path="stations/new" element={<StationForm />} />
                  <Route element={<ObjectIdRoute />}>
                    <Route path="stations/:id/edit" element={<StationForm />} />
                  </Route>
                  <Route path="users" element={<UserManagement />} />
                </Route>

                <Route element={<RoleBasedRoute roles={[ROLES.GRID_OPERATOR]} />}>
                  <Route path="qr-scanner" element={<QRScannerPage />} />
                </Route>

                <Route element={<RoleBasedRoute roles={[ROLES.GRID_OPERATOR, ROLES.BACKOFFICE]} />}>
                  <Route
                    path="reports"
                    element={
                      <Suspense fallback={<Spinner />}>
                        <ReportsPage />
                      </Suspense>
                    }
                  />
                  <Route path="transactions" element={<TransactionList />} />
                  <Route path="transactions/history" element={<TransactionHistory />} />
                  <Route element={<ObjectIdRoute />}>
                    <Route path="transactions/:id" element={<TransactionDetail />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
