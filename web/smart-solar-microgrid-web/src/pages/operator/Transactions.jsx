import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllReservations } from '../../services/api/reservationService'

const transactionNames = ['Not Started', 'Verified', 'Completed']

function Transactions({ completedOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems(await getAllReservations()) } catch (e) { setError(e.response?.data?.message || 'Unable to load transactions.') } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const visible = useMemo(() => items.filter((item) => {
    const included = completedOnly ? item.status === 4 : item.transactionStatus > 0
    return included && `${item.reservationNumber} ${item.prosumerNIC}`.toLowerCase().includes(search.toLowerCase())
  }), [items, search, completedOnly])

  return <div className="space-y-6"><div><p className="text-sm font-semibold text-emerald-600">Grid Operator</p><h1 className="text-3xl font-bold text-slate-900">{completedOnly ? 'Transaction history' : 'Transactions'}</h1><p className="mt-1 text-slate-500">{completedOnly ? 'Completed energy transfers.' : 'Verified and completed energy transfers.'}</p></div>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reservation or prosumer NIC" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"/><div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="p-4">Reservation</th><th className="p-4">Prosumer</th><th className="p-4">Date / time</th><th className="p-4">Transaction</th><th className="p-4">Completed by</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan="5" className="p-6 text-slate-500">Loading...</td></tr> : visible.length ? visible.map((item) => <tr key={item.id}><td className="p-4 font-semibold">{item.reservationNumber}</td><td className="p-4">{item.prosumerNIC}</td><td className="p-4">{new Date(item.reservationDate).toLocaleDateString()} {item.startTime}</td><td className="p-4">{transactionNames[item.transactionStatus] || 'Unknown'}</td><td className="p-4">{item.completedBy || '-'}</td></tr>) : <tr><td colSpan="5" className="p-8 text-center text-slate-500">No matching transactions.</td></tr>}</tbody></table></div></div>
}

export default Transactions
