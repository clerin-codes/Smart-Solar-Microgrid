import { useState } from 'react'
import logo from '../../assets/logo.png'

function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center">
        <img
          src={logo}
          alt="SunChain"
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button
          type="button"
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 00-12 0v.75a8.967 8.967 0 01-2.31 6.022c1.733.64 3.55 1.085 5.454 1.31m5.713 0a24.255 24.255 0 01-5.713 0m5.713 0a3 3 0 11-5.713 0"
            />
          </svg>

          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold">
              S
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800">
                User
              </p>
              <p className="text-xs text-slate-500">
                Account
              </p>
            </div>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-14 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Profile
              </button>

              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Settings
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar