import {
  useEffect,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import LoginFormPanel from '../../components/auth/LoginFormPanel'
import LoginHeroPanel from '../../components/auth/LoginHeroPanel'
import useAuth from '../../hooks/useAuth'

import {
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../utils/apiError'

import {
  validateNic,
} from '../../utils/validation'

function homeForRole(role) {
  return role === 'Backoffice'
    ? '/backoffice/dashboard'
    : '/operator/dashboard'
}

function destinationForRole(
  role,
  requestedPath,
) {
  if (
    requestedPath === '/profile' ||
    requestedPath === '/dashboard'
  ) {
    return requestedPath === '/dashboard'
      ? homeForRole(role)
      : requestedPath
  }

  if (
    role === 'Backoffice' &&
    requestedPath?.startsWith('/backoffice')
  ) {
    return requestedPath
  }

  if (
    role === 'GridOperator' &&
    requestedPath?.startsWith('/operator')
  ) {
    return requestedPath
  }

  return homeForRole(role)
}

/**
 * Coordinates authentication state and navigation for the web login flow.
 * All business authorization still comes from the API and AuthProvider.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    user,
    loading: authLoading,
    login,
  } = useAuth()

  const [form, setForm] = useState({
    nic: '',
    password: '',
  })

  const [errors, setErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [nicFocused, setNicFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  useEffect(() => {
    setForm({
      nic: '',
      password: '',
    })
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      navigate(
        homeForRole(user.role),
        { replace: true },
      )
    }
  }, [
    authLoading,
    user,
    navigate,
  ])

  function updateField(event) {
    const {
      name,
      value,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))

    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    const nicError = validateNic(form.nic)

    if (nicError) {
      nextErrors.nic = nicError
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')

      const sessionUser = await login({
        nic: form.nic.trim().toUpperCase(),
        password: form.password,
      })

      navigate(
        destinationForRole(
          sessionUser.role,
          location.state?.from,
        ),
        { replace: true },
      )
    } catch (error) {
      setErrors(getApiFieldErrors(error))
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Unable to sign in.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <LoginHeroPanel />

      <LoginFormPanel
        form={form}
        errors={errors}
        errorMessage={errorMessage}
        submitting={submitting}
        authLoading={authLoading}
        showPassword={showPassword}
        nicFocused={nicFocused}
        passwordFocused={passwordFocused}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        onNicFocus={() => setNicFocused(true)}
        onPasswordFocus={() => setPasswordFocused(true)}
        onTogglePassword={() =>
          setShowPassword((current) => !current)
        }
      />
    </div>
  )
}
