import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [nic, setNic] = useState('')
  const [password, setPassword] = useState('')
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
      const signedIn = await login(nic, password)
      if (!['Backoffice', 'GridOperator'].includes(signedIn.role)) {
        logout()
        setError('Solar Prosumers use the SunChain Android application.')
        return
      }
      const fallback = signedIn.role === 'Backoffice' ? '/backoffice/dashboard' : '/operator/dashboard'
      navigate(location.state?.from || fallback, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Sign-in failed. Check your NIC and password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-semibold text-blue-600">SunChain Web Portal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Backoffice and Grid Operator access</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mt-6 block text-sm font-medium text-slate-700">NIC</label>
        <input value={nic} onChange={(e) => setNic(e.target.value)} required autoComplete="username" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
        <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
        <button disabled={busy} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </main>
  )
}

export default Login
