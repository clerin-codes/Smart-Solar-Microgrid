import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import hero from '../assets/hero.png'
import logo from '../assets/logo.png'

function Login() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nic, setNic] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={user.role === 'Backoffice' ? '/backoffice/dashboard' : '/operator/dashboard'} replace />
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const signedIn = await login(nic.trim(), password)
      if (!['Backoffice', 'GridOperator'].includes(signedIn.role)) {
        logout()
        setError('Prosumer accounts use the SunChain Android application. This portal is for operational staff.')
        return
      }
      const fallback = signedIn.role === 'Backoffice' ? '/backoffice/dashboard' : '/operator/dashboard'
      navigate(location.state?.from || fallback, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Sign-in failed. Check your NIC, password, and server connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#071629] p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-2xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img src={hero} alt="Solar panels generating clean energy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/65 to-emerald-900/45" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <img src={logo} alt="SunChain" className="h-14 w-fit rounded-xl bg-white/95 px-3 py-2 object-contain" />
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur">Smart Solar Microgrid</span>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight">Operate a cleaner, connected energy network.</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-blue-50/90">Manage stations, approve energy reservations, and track verified transfers from one secure workspace.</p>
              <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
                {['Live operations', 'Role-based access', 'Verified transfers'].map((item) => <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><span className="mb-3 block h-2 w-2 rounded-full bg-emerald-300" />{item}</div>)}
              </div>
            </div>
            <p className="text-sm text-blue-100/70">SunChain operational portal</p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-gradient-to-br from-white to-slate-50 px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <img src={logo} alt="SunChain" className="mb-8 h-12 w-auto object-contain lg:hidden" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Secure staff access</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back</h2>
            <p className="mt-3 leading-7 text-slate-600">Sign in with the NIC and password assigned to your Backoffice or Grid Operator account.</p>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
              <strong>Which account should I use?</strong>
              <p className="mt-1 text-blue-800">Backoffice users manage accounts, stations, and slots. Grid Operators manage approvals and energy transactions.</p>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              {error && <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><span className="font-bold">!</span><span>{error}</span></div>}
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">NIC number</span>
                <input value={nic} onChange={(event) => { setNic(event.target.value); setError('') }} required autoComplete="username" placeholder="Enter your NIC" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Password</span>
                <div className="relative mt-2">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} required autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 text-xs font-semibold text-blue-700 hover:text-blue-900">{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </label>
              <button disabled={busy || !nic.trim() || !password} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">{busy ? 'Signing you in…' : 'Sign in to portal'}</button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-slate-500">Having trouble signing in? Confirm that the API is running and ask a Backoffice administrator to verify your account status.</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login
