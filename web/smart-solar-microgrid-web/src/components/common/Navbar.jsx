import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext'

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
      <img src={logo} alt="SunChain" className="h-10 w-auto object-contain" />
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 md:inline-flex">{user.role === 'GridOperator' ? 'Grid Operator workspace' : 'Backoffice workspace'}</span>
        <div className="relative">
          <button type="button" onClick={() => setIsProfileOpen((open) => !open)} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-100" aria-expanded={isProfileOpen}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-slate-900 font-semibold text-white shadow-sm">{user.fullName?.charAt(0).toUpperCase() || 'U'}</div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
              <p className="text-xs text-slate-500">{user.role === 'GridOperator' ? 'Grid Operator' : user.role}</p>
            </div>
            <span className="text-xs text-slate-500">⌄</span>
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
              <div className="px-4 py-2 text-xs leading-5 text-slate-500">Signed in as<br/><strong className="text-slate-800">{user.nic}</strong></div>
              <div className="my-1 border-t border-slate-100" />
              <button type="button" onClick={signOut} className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
