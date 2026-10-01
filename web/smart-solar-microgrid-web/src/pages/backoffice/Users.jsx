import { useCallback, useEffect, useMemo, useState } from 'react'
import { activateUser, deactivateUser, getUsers, reactivateUser } from '../../services/api/userService'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [busyNic, setBusyNic] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setUsers(await getUsers()) } catch (e) { setError(e.response?.data?.message || 'Unable to load users.') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => users.filter((user) => {
    const query = search.toLowerCase()
    return (role === 'all' || user.role === role) && `${user.nic} ${user.fullName} ${user.email}`.toLowerCase().includes(query)
  }), [users, search, role])

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
      <div><p className="text-sm font-semibold text-blue-600">Backoffice</p><h1 className="text-3xl font-bold text-slate-900">User management</h1><p className="mt-1 text-slate-500">Manage operators, prosumers and activation requests.</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search NIC, name or email" className="rounded-xl border border-slate-300 px-4 py-2.5" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-300 px-4 py-2.5"><option value="all">All roles</option><option>Backoffice</option><option>GridOperator</option><option>Prosumer</option></select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Contact</th><th className="p-4">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{loading ? <tr><td className="p-6 text-slate-500" colSpan="5">Loading users...</td></tr> : visible.map((user) => <tr key={user.nic}><td className="p-4"><p className="font-semibold text-slate-900">{user.fullName}</p><p className="text-slate-500">{user.nic}</p></td><td className="p-4">{user.role}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{user.status}</span></td><td className="p-4"><p>{user.email}</p><p className="text-slate-500">{user.phoneNumber}</p></td><td className="p-4">{user.status === 'PendingActivation' ? <button disabled={busyNic === user.nic} onClick={() => act(user, 'activate')} className="rounded-lg bg-green-600 px-3 py-2 text-white">Activate</button> : user.isActive ? <button disabled={busyNic === user.nic} onClick={() => act(user, 'deactivate')} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Deactivate</button> : <button disabled={busyNic === user.nic} onClick={() => act(user, 'reactivate')} className="rounded-lg bg-blue-600 px-3 py-2 text-white">Reactivate</button>}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
