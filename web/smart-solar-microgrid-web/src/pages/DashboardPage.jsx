import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { reservationService } from '../services/reservationService'
import { stationService } from '../services/stationService'
import { userService } from '../services/userService'
import { RESERVATION_STATUS, ROLES, enumName } from '../utils/constants'
import GridOperatorDashboard from '../components/GridOperatorDashboard/Dashboard'
import { Card, ErrorMessage, PageHeader, Spinner, StatusBadge, Stat } from '../components/Common/ui'

const statusOf = (r) => enumName(RESERVATION_STATUS, r.status)
const count = (list, status) => list.filter((r) => statusOf(r) === status).length

function BackofficeDashboard() {
  const stations = useFetch(stationService.getAll)
  const users = useFetch(userService.getAll)
  const reservations = useFetch(reservationService.getAll)

  if (stations.loading || users.loading || reservations.loading) return <Spinner />
  const error = stations.error || users.error || reservations.error
  if (error) return <ErrorMessage message={error} onRetry={() => [stations, users, reservations].forEach((f) => f.reload())} />

  const r = reservations.data
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active stations" value={stations.data.filter((s) => s.isActive).length} tone="text-primary-700" to="/stations" />
        <Stat label="Users" value={users.data.length} to="/users" />
        <Stat label="Reservations" value={r.length} to="/reservations" />
        <Stat label="Completed transfers" value={count(r, 'Completed')} tone="text-green-600" to="/transactions" />
      </div>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Reservations by status</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {RESERVATION_STATUS.map((s) => (
          <Card key={s}>
            <StatusBadge status={s} />
            <div className="mt-2 text-2xl font-semibold">{count(r, s)}</div>
          </Card>
        ))}
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title={`Hello, ${user.fullName}`} subtitle="Here is what is happening in the microgrid." />
      {user.role === ROLES.GRID_OPERATOR && <GridOperatorDashboard />}
      {user.role === ROLES.BACKOFFICE && <BackofficeDashboard />}
    </>
  )
}
