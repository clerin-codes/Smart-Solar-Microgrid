import {
  useEffect,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import logo from '../../assets/logo.png'

import Alert from '../../components/common/Alert'

import {
  ShieldIcon,
} from '../../components/common/Icons'

import useAuth from '../../hooks/useAuth'

import {
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../utils/apiError'

import {
  validateNic,
} from '../../utils/validation'

function homeForRole(
  role
) {
  return role === 'Backoffice'
    ? '/backoffice/dashboard'
    : '/operator/dashboard'
}

function destinationForRole(
  role,
  requestedPath
) {
  if (
    requestedPath ===
      '/profile' ||
    requestedPath ===
      '/dashboard'
  ) {
    return (
      requestedPath ===
      '/dashboard'
        ? homeForRole(role)
        : requestedPath
    )
  }

  if (
    role === 'Backoffice' &&
    requestedPath?.startsWith(
      '/backoffice'
    )
  ) {
    return requestedPath
  }

  if (
    role === 'GridOperator' &&
    requestedPath?.startsWith(
      '/operator'
    )
  ) {
    return requestedPath
  }

  return homeForRole(role)
}

export default function LoginPage() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const {
    user,
    loading:
      authLoading,
    login,
  } = useAuth()

  const [
    form,
    setForm,
  ] = useState({
    nic: '',
    password: '',
  })

  const [
    errors,
    setErrors,
  ] = useState({})

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  useEffect(() => {
    if (
      !authLoading &&
      user
    ) {
      navigate(
        homeForRole(
          user.role
        ),
        {
          replace: true,
        }
      )
    }
  }, [
    authLoading,
    user,
    navigate,
  ])

  function updateField(
    event
  ) {
    const {
      name,
      value,
    } = event.target

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    )

    setErrors(
      (current) => ({
        ...current,
        [name]: '',
      })
    )

    setErrorMessage('')
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    const nextErrors = {}

    const nicError =
      validateNic(form.nic)

    if (nicError) {
      nextErrors.nic =
        nicError
    }

    if (!form.password) {
      nextErrors.password =
        'Password is required.'
    }

    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {
      setErrors(
        nextErrors
      )

      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')

      const sessionUser =
        await login({
          nic:
            form.nic
              .trim()
              .toUpperCase(),

          password:
            form.password,
        })

      const requestedPath =
        location.state?.from

      navigate(
        destinationForRole(
          sessionUser.role,
          requestedPath
        ),
        {
          replace: true,
        }
      )
    } catch (error) {
      setErrors(
        getApiFieldErrors(
          error
        )
      )

      setErrorMessage(
        getApiErrorMessage(
          error,
          'Unable to sign in.'
        )
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <img
            src={logo}
            alt="SunChain"
            className="h-12 w-auto brightness-0 invert"
          />
        </div>

        <div className="relative max-w-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-300 backdrop-blur">
            <ShieldIcon className="h-7 w-7" />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">
            Smart Solar Microgrid
          </p>

          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight text-white">
            Secure energy operations,
            one connected platform.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Administrative and operational
            access for authorized
            Backoffice and Grid Operator
            users.
          </p>
        </div>

        <p className="relative text-sm text-slate-500">
          SunChain · Enterprise
          Microgrid Management
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <img
              src={logo}
              alt="SunChain"
              className="h-11 w-auto"
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Sign in to SunChain
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your registered
                NIC and account password.
              </p>
            </div>

            <div className="mt-6">
              <Alert type="error">
                {errorMessage}
              </Alert>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="login-nic"
                  className="text-sm font-semibold text-slate-700"
                >
                  NIC
                </label>

                <input
                  id="login-nic"
                  name="nic"
                  value={form.nic}
                  onChange={
                    updateField
                  }
                  disabled={
                    submitting
                  }
                  autoComplete="username"
                  placeholder="Enter your NIC"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500"
                />

                {errors.nic && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.nic}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      updateField
                    }
                    disabled={
                      submitting
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    {showPassword
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {
                      errors.password
                    }
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs leading-5 text-slate-500">
                Web access is limited to
                Backoffice and Grid Operator
                accounts. Solar Prosumers
                use the mobile application.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Authorized access only.
          </p>
        </div>
      </section>
    </div>
  )
}