import { useEffect, useMemo, useState } from 'react'

import {
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../utils/apiError'

const INITIAL_CREATE_FORM = {
  nic: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: '',
}

const NIC_PATTERN = /^(?:\d{12}|\d{9}[vVxX])$/
const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}\s.'-]*$/u

function validatePassword(password) {
  const errors = []

  if (password.length < 12 || password.length > 128) {
    errors.push('12–128 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('at least one lowercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('at least one number')
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    errors.push('at least one special character')
  }
  if (password !== password.trim()) {
    errors.push('no leading or trailing spaces')
  }

  return errors.length
    ? `Password must include ${errors.join(', ')}.`
    : ''
}

function validateForm(form, mode) {
  const errors = {}

  if (mode === 'create' && !NIC_PATTERN.test(form.nic.trim())) {
    errors.nic = 'Enter a valid Sri Lankan NIC.'
  }

  const fullName = form.fullName.trim()
  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName =
      'Full name must contain 2–100 characters.'
  } else if (!NAME_PATTERN.test(fullName)) {
    errors.fullName =
      'Use letters, spaces, apostrophes, periods or hyphens only.'
  }

  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!PHONE_PATTERN.test(form.phoneNumber.trim())) {
    errors.phoneNumber =
      'Use 07XXXXXXXX or +947XXXXXXXX.'
  }

  if (mode === 'create') {
    const passwordError = validatePassword(form.password)
    if (passwordError) errors.password = passwordError

    if (
      !['Backoffice', 'GridOperator'].includes(form.role)
    ) {
      errors.role =
        'Select Backoffice or Grid Operator.'
    }
  }

  return errors
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-semibold text-slate-700"
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>
  )
}

function FieldError({ message }) {
  if (!message) return null

  return (
    <p className="mt-1.5 text-xs font-medium text-red-600">
      {message}
    </p>
  )
}

function UserFormModal({
  open,
  mode,
  user,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(INITIAL_CREATE_FORM)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] =
    useState(false)

  const title = useMemo(
    () => (isEdit ? 'Edit User' : 'Create Web User'),
    [isEdit],
  )

  useEffect(() => {
    if (!open) return

    if (isEdit && user) {
      setForm({
        nic: user.nic ?? '',
        fullName: user.fullName ?? '',
        email: user.email ?? '',
        phoneNumber: user.phoneNumber ?? '',
        password: '',
        role: user.role ?? '',
      })
    } else {
      setForm(INITIAL_CREATE_FORM)
    }

    setErrors({})
    setGeneralError('')
    setSubmitting(false)
    setShowPassword(false)
  }, [open, isEdit, user])

  if (!open) return null

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: undefined,
      NIC: undefined,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateForm(form, mode)

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    setGeneralError('')

    try {
      const payload = isEdit
        ? {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(),
          }
        : {
            nic: form.nic.trim(),
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(),
            password: form.password,
            role: form.role,
          }

      await onSubmit(payload)
      onClose()
    } catch (error) {
      setErrors(getApiFieldErrors(error))
      setGeneralError(
        getApiErrorMessage(error, 'Unable to save user.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                Backoffice Administration
              </p>
              <h2
                id="user-form-title"
                className="mt-2 text-2xl font-bold"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm text-blue-100/90">
                {isEdit
                  ? 'Update safe editable user information.'
                  : 'Create a secure Backoffice or Grid Operator web account.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Fields marked with
              <span className="mx-1 font-semibold text-red-500">
                *
              </span>
              are required.
            </p>

            <div className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">
              {isEdit ? 'Edit Mode' : 'Create Mode'}
            </div>
          </div>

          {generalError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="fullName"
                required
              >
                Full Name
              </FieldLabel>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className={inputClass}
                autoComplete="name"
                placeholder="Enter full name"
              />
              <FieldError
                message={errors.fullName}
              />
            </div>

            {isEdit ? (
              <div>
                <FieldLabel htmlFor="nic">
                  NIC
                </FieldLabel>
                <div className="mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  {form.nic}
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel
                  htmlFor="nic"
                  required
                >
                  NIC
                </FieldLabel>
                <input
                  id="nic"
                  name="nic"
                  value={form.nic}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="200012345678"
                  autoComplete="off"
                />
                <FieldError
                  message={errors.nic || errors.NIC}
                />
              </div>
            )}

            <div>
              <FieldLabel
                htmlFor="email"
                required
              >
                Email Address
              </FieldLabel>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                autoComplete="email"
                placeholder="name@example.com"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <FieldLabel
                htmlFor="phoneNumber"
                required
              >
                Mobile Number
              </FieldLabel>
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                className={inputClass}
                autoComplete="tel"
                placeholder="0771234567"
              />
              <FieldError
                message={errors.phoneNumber}
              />
            </div>

            {isEdit ? (
              <div>
                <FieldLabel htmlFor="role">
                  Role
                </FieldLabel>
                <div className="mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  {form.role === 'GridOperator'
                    ? 'Grid Operator'
                    : form.role}
                </div>
              </div>
            ) : (
              <div>
                <FieldLabel
                  htmlFor="role"
                  required
                >
                  Role
                </FieldLabel>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select role</option>
                  <option value="Backoffice">
                    Backoffice
                  </option>
                  <option value="GridOperator">
                    Grid Operator
                  </option>
                </select>
                <FieldError message={errors.role} />
              </div>
            )}

            {!isEdit && (
              <div className="md:col-span-2">
                <FieldLabel
                  htmlFor="password"
                  required
                >
                  Temporary Password
                </FieldLabel>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword ? 'text' : 'password'
                    }
                    value={form.password}
                    onChange={handleChange}
                    className={`${inputClass} pr-20`}
                    autoComplete="new-password"
                    placeholder="Enter temporary password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                  Password must be 12–128 characters and
                  contain uppercase, lowercase, number,
                  and special character.
                </p>

                <FieldError
                  message={errors.password}
                />
              </div>
            )}
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Saving...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserFormModal