import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import logo from '../assets/sunchain-logo.png'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { errorMessage } from '../utils/formatters'
import { required } from '../utils/validators'
import { Button, Field, inputClass } from '../components/Common/ui'

const DEMO_ACCOUNTS = [
  { label: 'Backoffice Admin', nic: '200000000001', password: 'Admin@123' },
  { label: 'Grid Operator', nic: '200000000002', password: 'Operator@123' },
]

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { values, setValues, errors, handleChange, handleBlur, handleSubmit } = useForm(
    { nic: '', password: '' },
    { nic: [required], password: [required] },
  )

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = async ({ nic, password }) => {
    setSubmitting(true)
    setError('')
    try {
      const user = await login(nic.trim(), password)
      toast.success(`Welcome back, ${user.fullName}`)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary-50 to-blue-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1>
            <img src={logo} alt="SunChain" className="mx-auto h-24 w-auto" />
          </h1>
          <p className="mt-3 text-sm text-gray-500">Sign in with your NIC and password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <Field label="NIC" error={errors.nic}>
            <input
              name="nic"
              value={values.nic}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass}
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" error={errors.password}>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass}
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Demo accounts (dev only)</p>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.nic}
                  type="button"
                  onClick={() => setValues({ nic: a.nic, password: a.password })}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium">{a.label}</span>
                  <span className="ml-2 text-gray-500">{a.nic}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
