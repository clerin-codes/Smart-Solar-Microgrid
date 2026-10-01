import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllReservations } from '../services/api/reservationService'
import { getAllSlots } from '../services/api/slotService'
import { getAllStations } from '../services/api/stationService'
import { getUsers } from '../services/api/userService'
import InfoBanner from '../components/common/InfoBanner'
import PageHeader from '../components/common/PageHeader'
import useAutoRefresh from '../hooks/useAutoRefresh'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
      if (!silent) {
        setLoading(true)
        setError('')
      }
      try {
        if (user.role === 'Backoffice') {
          const [users, stations, slots] = await Promise.all([getUsers(), getAllStations(), getAllSlots()])
          setStats([
            ['Users', users.length, 'Registered accounts', 'text-blue-700 bg-blue-50'],
            ['Pending activations', users.filter((item) => item.status === 'PendingActivation').length, 'Need a decision', 'text-amber-700 bg-amber-50'],
            ['Active stations', stations.filter((item) => item.isActive).length, 'Supplying the network', 'text-emerald-700 bg-emerald-50'],
            ['Available slots', slots.filter((item) => item.status === 0 && item.availableCapacityKw > 0).length, 'Open for reservation', 'text-violet-700 bg-violet-50'],
          ])
        } else {
          const reservations = await getAllReservations()
          setStats([
            ['Reservations', reservations.length, 'All requests', 'text-blue-700 bg-blue-50'],
            ['Pending approval', reservations.filter((item) => item.status === 0).length, 'Require review', 'text-amber-700 bg-amber-50'],
            ['Awaiting QR scan', reservations.filter((item) => item.status === 1 && item.transactionStatus === 0).length, 'Approved transfers', 'text-violet-700 bg-violet-50'],
            ['Completed', reservations.filter((item) => item.status === 4).length, 'Finished transfers', 'text-emerald-700 bg-emerald-50'],
          ])
        }
        setError('')
      } catch (requestError) {
        if (!silent) setError(requestError.response?.data?.message || 'Unable to load dashboard data.')
      } finally { if (!silent) setLoading(false) }
  }, [user.role])

  useEffect(() => {
    load()
  }, [load])

  useAutoRefresh(() => load(true))

  const backoffice = user.role === 'Backoffice'
  const links = backoffice
    ? [
      ['Manage users', 'Approve registrations and maintain access', '/backoffice/users'],
      ['Solar stations', 'Configure generation sites and schedules', '/backoffice/stations'],
      ['Energy slots', 'Publish reservable capacity windows', '/backoffice/slots'],
    ]
    : [
      ['Review reservations', 'Approve requests and generate QR codes', '/operator/reservations'],
      ['Track transactions', 'Monitor verified and completed transfers', '/operator/transactions'],
      ['Station status', 'Check station and slot availability', '/operator/assets'],
    ]

  return (
    <div className="space-y-7">
      <PageHeader eyebrow={backoffice ? 'Backoffice overview' : 'Grid Operator overview'} title={`Welcome, ${user.fullName}`} description="Live operational information from the Smart Solar Microgrid API." />
      <InfoBanner tone={backoffice ? 'blue' : 'emerald'} title={backoffice ? 'Recommended workflow' : 'Today’s workflow'}>{backoffice ? 'Start with pending user activations, then confirm stations are active before publishing energy slots.' : 'Review pending reservations first. Approved reservations move to QR verification in the Android operator app before completion.'}</InfoBanner>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : stats).map((item, index) => loading ? <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/80" /> : (
          <div key={item[0]} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-semibold ${item[3]}`}>{item[0]}</div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{item[1]}</p>
            <p className="mt-1 text-sm text-slate-500">{item[2]}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
        <p className="mt-1 text-sm text-slate-500">Continue with the most common tasks for your role.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {links.map(([label, description, to], index) => <Link key={to} to={to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white group-hover:bg-blue-600">0{index + 1}</span><h3 className="mt-5 font-bold text-slate-900">{label}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><p className="mt-4 text-sm font-semibold text-blue-700">Open workspace →</p></Link>)}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
