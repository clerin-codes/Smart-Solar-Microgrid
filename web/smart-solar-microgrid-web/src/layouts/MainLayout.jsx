import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe_0,_#f8fafc_32rem)]">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed((current) => !current)
          }
        />

        {/* Main Application Area */}
        <div className="flex-1 min-w-0">

          {/* Navbar */}
          <Navbar />

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
            {(user.role === 'Backoffice'
              ? [['Home', '/backoffice/dashboard'], ['Users', '/backoffice/users'], ['Stations', '/backoffice/stations'], ['Slots', '/backoffice/slots']]
              : [['Home', '/operator/dashboard'], ['Assets', '/operator/assets'], ['Reservations', '/operator/reservations'], ['Transactions', '/operator/transactions']]
            ).map(([label, to]) => <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{label}</NavLink>)}
          </nav>

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px]"><Outlet /></div>
          </main>

        </div>
      </div>
    </div>
  )
}

export default MainLayout
