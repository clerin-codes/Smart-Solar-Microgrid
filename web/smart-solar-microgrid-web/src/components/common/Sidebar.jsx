import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = {
  Backoffice: [
    ['Dashboard', '/backoffice/dashboard'],
    ['Users', '/backoffice/users'],
    ['Stations', '/backoffice/stations'],
    ['Energy Slots', '/backoffice/slots'],
  ],
  GridOperator: [
    ['Dashboard', '/operator/dashboard'],
    ['Station Status', '/operator/assets'],
    ['Reservations', '/operator/reservations'],
    ['Transactions', '/operator/transactions'],
    ['History', '/operator/history'],
  ],
}

function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth()
  return <aside className={`hidden min-h-screen shrink-0 flex-col border-r border-slate-200 bg-[#E8F0F3] transition-all lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
    <div className={`flex h-16 items-center border-b border-slate-200 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
      {!collapsed && <span className="font-bold text-slate-800">SunChain</span>}
      <button type="button" onClick={onToggle} className="h-9 w-9 rounded-lg bg-white text-slate-700 shadow-sm" aria-label="Toggle sidebar">{collapsed ? '›' : '‹'}</button>
    </div>
    <nav className="flex-1 space-y-2 p-3">
      {!collapsed && <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{user.role === 'Backoffice' ? 'Backoffice' : 'Grid Operator'}</p>}
      {(links[user.role] || []).map(([label, to]) => <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-700 hover:bg-white/70'}`}><span className="h-2.5 w-2.5 rounded-full bg-current" />{!collapsed && <span>{label}</span>}</NavLink>)}
    </nav>
    {!collapsed && <div className="border-t border-slate-200 p-4 text-xs text-slate-500">Smart Solar Microgrid<br/>Web Portal v1.0.0</div>}
  </aside>
}

export default Sidebar
