import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllReservations } from '../services/api/reservationService'
import { getAllSlots } from '../services/api/slotService'
import { getAllStations } from '../services/api/stationService'
import { getUsers } from '../services/api/userService'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (user.role === 'Backoffice') {
          const [users, stations, slots] = await Promise.all([getUsers(), getAllStations(), getAllSlots()])
          setStats([
            ['Users', users.length],
            ['Pending activations', users.filter((x) => x.status === 'PendingActivation').length],
            ['Active stations', stations.filter((x) => x.isActive).length],
            ['Available slots', slots.filter((x) => x.status === 0 && x.availableCapacityKw > 0).length],
          ])
        } else {
          const reservations = await getAllReservations()
          setStats([
            ['Reservations', reservations.length],
            ['Pending approval', reservations.filter((x) => x.status === 0).length],
            ['Awaiting QR scan', reservations.filter((x) => x.status === 1 && x.transactionStatus === 0).length],
            ['Completed', reservations.filter((x) => x.status === 4).length],
          ])
        }
      } catch (e) { setError(e.response?.data?.message || 'Unable to load dashboard data.') }
    }
    load()
  }, [user.role])

  const backoffice = user.role === 'Backoffice'
  const links = backoffice
    ? [['Manage users', '/backoffice/users'], ['Solar stations', '/backoffice/stations'], ['Energy slots', '/backoffice/slots']]
    : [['Reservations', '/operator/reservations'], ['Transactions', '/operator/transactions'], ['Station status', '/operator/assets']]

  return <div className="space-y-7"><div><p className={`text-sm font-semibold ${backoffice ? 'text-blue-600' : 'text-emerald-600'}`}>{backoffice ? 'Backoffice' : 'Grid Operator'}</p><h1 className="text-3xl font-bold text-slate-900">Welcome, {user.fullName}</h1><p className="mt-1 text-slate-500">Live information from the Smart Solar Microgrid API.</p></div>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold text-slate-900">{value}</p></div>)}</div><div className="grid gap-5 md:grid-cols-3">{links.map(([label, to]) => <Link key={to} to={to} className="rounded-2xl border border-slate-200 bg-white p-6 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300">{label}<p className="mt-2 text-sm font-normal text-slate-500">Open workspace →</p></Link>)}</div></div>
}

export default Dashboard
