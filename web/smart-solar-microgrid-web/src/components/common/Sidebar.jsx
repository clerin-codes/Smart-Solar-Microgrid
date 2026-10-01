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
  return (
    <aside className={`hidden min-h-screen shrink-0 flex-col bg-gradient-to-b from-slate-950 to-slate-900 text-white shadow-xl transition-all lg:flex ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        {!collapsed && <span className="text-lg font-bold tracking-tight">Sun<span className="text-blue-400">Chain</span></span>}
        <button type="button" onClick={onToggle} className="h-9 w-9 rounded-lg border border-white/10 bg-white/10 text-white transition hover:bg-white/20" aria-label="Toggle sidebar">{collapsed ? '›' : '‹'}</button>
      </div>
      <nav className="flex-1 space-y-2 p-3">
        {!collapsed && <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{user.role === 'Backoffice' ? 'Backoffice' : 'Grid Operator'}</p>}
        {(links[user.role] || []).map(([label, to]) => (
          <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">{label.charAt(0)}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && <div className="border-t border-white/10 p-4 text-xs leading-5 text-slate-400">Smart Solar Microgrid<br/>Operational Portal v1.0</div>}
    </aside>
  )
}

export default Sidebar
