import { useEffect, useState } from 'react'
import { getAllStations } from '../../services/api/stationService'
import { getAllSlots } from '../../services/api/slotService'

function Assets() {
  const [stations, setStations] = useState([])
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([getAllStations(), getAllSlots()]).then(([a, b]) => { setStations(a); setSlots(b) }).catch((e) => setError(e.response?.data?.message || 'Unable to load station status.')) }, [])
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-emerald-600">Grid Operator</p><h1 className="text-3xl font-bold text-slate-900">Station and slot status</h1></div>{error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}<div className="grid gap-5 md:grid-cols-3"><Metric label="Stations" value={stations.length}/><Metric label="Active stations" value={stations.filter((x) => x.isActive).length}/><Metric label="Available slots" value={slots.filter((x) => x.status === 0 && x.availableCapacityKw > 0).length}/></div><div className="grid gap-4 lg:grid-cols-2">{stations.map((station) => <div key={station.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><div><p className="font-semibold text-slate-900">{station.stationName}</p><p className="text-sm text-slate-500">{station.stationCode}</p></div><span className={station.isActive ? 'text-green-600' : 'text-red-600'}>{station.isActive ? 'Active' : 'Inactive'}</span></div><p className="mt-4 text-sm text-slate-600">{slots.filter((slot) => slot.stationId === station.id && slot.status === 0).length} available slots</p></div>)}</div></div>
}
function Metric({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div> }
export default Assets
