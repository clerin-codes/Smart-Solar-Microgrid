import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllReservations } from '../../services/api/reservationService'
import InfoBanner from '../../components/common/InfoBanner'
import PageHeader from '../../components/common/PageHeader'
import Pagination from '../../components/common/Pagination'
import useAutoRefresh from '../../hooks/useAutoRefresh'

const transactionNames = ['Not Started', 'Verified', 'Completed']

function Transactions({ completedOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(completedOnly ? '2' : 'all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      setItems(await getAllReservations())
      setError('')
    }
    catch (requestError) {
      if (!silent) setError(requestError.response?.data?.message || 'Unable to load transactions.')
    }
    finally { if (!silent) setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useAutoRefresh(() => load(true))

  const visible = useMemo(() => items.filter((item) => {
    const included = completedOnly ? item.status === 4 : item.transactionStatus > 0
    const matchesStatus = status === 'all' || String(item.transactionStatus) === status
    const matchesSearch = `${item.reservationNumber} ${item.prosumerNIC} ${item.completedBy || ''}`.toLowerCase().includes(search.toLowerCase())
    return included && matchesStatus && matchesSearch
  }).sort((a, b) => new Date(b.completedAt || b.updatedAt || b.createdAt || 0) - new Date(a.completedAt || a.updatedAt || a.createdAt || 0)), [items, search, status, completedOnly])
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / pageSize)))
  const pagedItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Grid Operator" title={completedOnly ? 'Transaction history' : 'Energy transactions'} description={completedOnly ? 'Review completed energy transfers and the operators who finalized them.' : 'Monitor QR-verified transfers and complete the operational workflow.'} />
      <InfoBanner tone="emerald">A transaction appears after the reservation QR is verified in the Android operator app. “Verified” is ready for transfer completion; “Completed” is retained as the final audit record.</InfoBanner>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search reservation, prosumer or operator" className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} disabled={completedOnly} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100">
          {!completedOnly && <option value="all">All transaction states</option>}
          {!completedOnly && <option value="1">Verified</option>}
          <option value="2">Completed</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600"><tr><th className="p-4 font-semibold">Reservation</th><th className="p-4 font-semibold">Prosumer</th><th className="p-4 font-semibold">Date / time</th><th className="p-4 font-semibold">Transaction</th><th className="p-4 font-semibold">Completed by</th><th className="p-4 font-semibold">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading transactions…</td></tr> : pagedItems.length ? pagedItems.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-900">{item.reservationNumber}</td>
                  <td className="p-4 text-slate-700">{item.prosumerNIC}</td>
                  <td className="whitespace-nowrap p-4 text-slate-600">{new Date(item.reservationDate).toLocaleDateString()} · {item.startTime}</td>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.transactionStatus === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{transactionNames[item.transactionStatus] || 'Unknown'}</span></td>
                  <td className="p-4 text-slate-600">{item.completedBy || 'Awaiting completion'}</td>
                  <td className="p-4"><Link to={`/operator/reservations/${item.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">View details</Link></td>
                </tr>
              )) : <tr><td colSpan="6" className="p-10 text-center text-slate-500">No transactions match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={currentPage} pageSize={pageSize} totalItems={visible.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />}
      </div>
    </div>
  )
}

export default Transactions
