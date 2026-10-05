import {
  useState,
} from 'react'

import {
  Outlet,
} from 'react-router-dom'

import Sidebar from '../components/common/Sidebar'
import Navbar from '../components/common/Navbar'

function MainLayout() {
  const [
    collapsed,
    setCollapsed,
  ] = useState(false)

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] text-slate-900">
      {/* ===============================================
          SIDEBAR
      ================================================ */}

      <Sidebar
        collapsed={
          collapsed
        }
        onToggle={() =>
          setCollapsed(
            (current) =>
              !current,
          )
        }
        mobileOpen={
          mobileOpen
        }
        onCloseMobile={() =>
          setMobileOpen(
            false,
          )
        }
      />

      {/* ===============================================
          MAIN AREA
      ================================================ */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* =============================================
            NAVBAR
        ============================================== */}

        <Navbar
          onOpenMobileMenu={() =>
            setMobileOpen(
              true,
            )
          }
        />

        {/* =============================================
            PAGE CONTENT
        ============================================== */}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full px-5 py-7 sm:px-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout