import { useCallback, useEffect, useMemo, useState } from 'react'
import { activateUser, deactivateUser, getUsers, reactivateUser } from '../../services/api/userService'
import InfoBanner from '../../components/common/InfoBanner'
import PageHeader from '../../components/common/PageHeader'
import Pagination from '../../components/common/Pagination'
import useAutoRefresh from '../../hooks/useAutoRefresh'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [busyNic, setBusyNic] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      setUsers(await getUsers())
      setError('')
    }
    catch (e) { if (!silent) setError(e.response?.data?.message || 'Unable to load users.') }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useAutoRefresh(() => load(true))

  const visible = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase()
    return (role === 'all' || user.role === role) && `${user.nic} ${user.fullName} ${user.email} ${user.phoneNumber} ${user.role} ${user.status}`.toLowerCase().includes(query)
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [users, search, role])
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / pageSize)))
  const pagedUsers = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const act = async (user, action) => {
    setBusyNic(user.nic)
    setError('')
    try {
      if (action === 'activate') await activateUser(user.nic)
      else if (action === 'reactivate') await reactivateUser(user.nic)
      else await deactivateUser(user.nic)
      await load()
    } catch (e) { setError(e.response?.data?.message || 'Unable to update this account.') } finally { setBusyNic('') }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Backoffice" title="User management" description="Review staff and prosumer accounts, then control who can access the platform." />
      <InfoBanner>Pending registrations must be activated before they can sign in. Deactivation blocks access without deleting the user’s historical records.</InfoBanner>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search NIC, name or email" className="rounded-xl border border-slate-300 px-4 py-2.5" />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="rounded-xl border border-slate-300 px-4 py-2.5"><option value="all">All roles</option><option>Backoffice</option><option>GridOperator</option><option>Prosumer</option></select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Contact</th><th className="p-4">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{loading ? <tr><td className="p-6 text-slate-500" colSpan="5">Loading users...</td></tr> : pagedUsers.length ? pagedUsers.map((user) => <tr key={user.nic} className="transition hover:bg-slate-50"><td className="p-4"><p className="font-semibold text-slate-900">{user.fullName}</p><p className="text-slate-500">{user.nic}</p></td><td className="p-4">{user.role}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{user.status}</span></td><td className="p-4"><p>{user.email}</p><p className="text-slate-500">{user.phoneNumber}</p></td><td className="p-4">{user.status === 'PendingActivation' ? <button disabled={busyNic === user.nic} onClick={() => act(user, 'activate')} className="rounded-lg bg-green-600 px-3 py-2 font-medium text-white disabled:opacity-50">Activate</button> : user.isActive ? <button disabled={busyNic === user.nic} onClick={() => act(user, 'deactivate')} className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700 disabled:opacity-50">Deactivate</button> : <button disabled={busyNic === user.nic} onClick={() => act(user, 'reactivate')} className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white disabled:opacity-50">Reactivate</button>}</td></tr>) : <tr><td colSpan="5" className="p-10 text-center text-slate-500">No users match the current search and role filter.</td></tr>}</tbody>
        </table>
        {!loading && <Pagination page={currentPage} pageSize={pageSize} totalItems={visible.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} />}
      </div>
    </div>
  )
}

export default Users
