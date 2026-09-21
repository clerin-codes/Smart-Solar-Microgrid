import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-100">
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

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] p-6">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  )
}

export default MainLayout