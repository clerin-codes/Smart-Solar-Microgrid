import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllStations } from '../../services/api/stationService'
import { getAllSlots } from '../../services/api/slotService'
import InfoBanner from '../../components/common/InfoBanner'
import PageHeader from '../../components/common/PageHeader'
import Pagination from '../../components/common/Pagination'
import useAutoRefresh from '../../hooks/useAutoRefresh'

function Assets() {
  const [stations, setStations] = useState([])
  const [slots, setSlots] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback((silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    return Promise.all([getAllStations(), getAllSlots()])
      .then(([stationData, slotData]) => {
        setStations(stationData)
        setSlots(slotData)
        setError('')
      })
      .catch((requestError) => {
        if (!silent) setError(requestError.response?.data?.message || 'Unable to load station status.')
      })
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])
  useAutoRefresh(() => load(true))

  const visible = useMemo(() => stations
    .filter((station) => `${station.stationName} ${station.stationCode} ${station.capacityKw} ${station.isActive ? 'active' : 'inactive'}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [stations, search])
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / pageSize)))
  const pagedStations = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Grid Operator" title="Station and slot status" description="Check which stations are active and where reservable capacity is available." />
      <InfoBanner tone="emerald">Use this page as a read-only operational view. Station configuration and slot publishing are controlled by Backoffice users.</InfoBanner>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-3"><Metric label="Stations" value={stations.length}/><Metric label="Active stations" value={stations.filter((item) => item.isActive).length}/><Metric label="Available slots" value={slots.filter((item) => item.status === 0 && item.availableCapacityKw > 0).length}/></div>
      <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search station code or name" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {loading ? <p className="p-4 text-slate-500">Loading station status…</p> : pagedStations.length ? pagedStations.map((station) => {
            const stationSlots = slots.filter((slot) => slot.stationId === station.id)
            const available = stationSlots.filter((slot) => slot.status === 0 && slot.availableCapacityKw > 0).length
            return <article key={station.id} className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-slate-900">{station.stationName}</p><p className="mt-1 text-sm text-slate-500">{station.stationCode}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${station.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{station.isActive ? 'Active' : 'Inactive'}</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Capacity</p><p className="mt-1 font-bold text-slate-900">{station.capacityKw} kW</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Available slots</p><p className="mt-1 font-bold text-slate-900">{available}</p></div></div></article>
          }) : <p className="p-4 text-slate-500">No stations match your search.</p>}
        </div>
        {!loading && <Pagination page={currentPage} pageSize={pageSize} totalItems={visible.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />}
      </div>
    </div>
  )
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value}</p></div> }
export default Assets
