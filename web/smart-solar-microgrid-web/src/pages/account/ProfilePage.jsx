import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import useAuth from '../../hooks/useAuth'
import {
  getMyProfile,
  updateMyProfile,
} from '../../services/api/accountService'
import {
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../utils/apiError'

const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}\s.'-]*$/u

function roleLabel(role) {
  if (role === 'GridOperator') return 'Grid Operator'
  return role
}

function prettyStatus(status = '') {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">
        {value || '-'}
      </p>
    </div>
  )
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

function ProfilePage() {
  const { refreshProfile } = useAuth()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setPageError('')

      try {
        const data = await getMyProfile()

        if (!active) return

        setProfile(data)
        setForm({
          fullName: data.fullName ?? '',
          email: data.email ?? '',
          phoneNumber: data.phoneNumber ?? '',
        })
      } catch (error) {
        if (active) {
          setPageError(
            getApiErrorMessage(
              error,
              'Unable to load profile.',
            ),
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }))
  }

  function validateForm() {
    const nextErrors = {}

    const fullName = form.fullName.trim()

    if (fullName.length < 2 || fullName.length > 100) {
      nextErrors.fullName =
        'Full name must contain 2–100 characters.'
    } else if (!NAME_PATTERN.test(fullName)) {
      nextErrors.fullName =
        'Use letters, spaces, apostrophes, periods or hyphens only.'
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email =
        'Enter a valid email address.'
    }

    if (!PHONE_PATTERN.test(form.phoneNumber.trim())) {
      nextErrors.phoneNumber =
        'Use 07XXXXXXXX or +947XXXXXXXX.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleEditStart() {
    setIsEditing(true)
    setErrors({})
  }

  function handleCancelEdit() {
    if (!profile) return

    setForm({
      fullName: profile.fullName ?? '',
      email: profile.email ?? '',
      phoneNumber: profile.phoneNumber ?? '',
    })
    setErrors({})
    setIsEditing(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    try {
      const updated = await updateMyProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      })

      setProfile(updated)
      await refreshProfile()

      setIsEditing(false)
      setErrors({})

      toast.success('Profile updated successfully.')
    } catch (error) {
      setErrors(getApiFieldErrors(error))
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update profile.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/60 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        Loading profile...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-r from-slate-950 via-blue-950 to-sky-700 px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              My Account
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-100/90 sm:text-base">
              Review your account identity and maintain
              your professional contact information.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditStart}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              Edit Profile
            </button>
          ) : (
            <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              Editing enabled
            </div>
          )}
        </div>
      </section>

      {pageError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="rounded-[28px] border border-white/60 bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-blue-200">
            {profile?.fullName
              ?.slice(0, 1)
              .toUpperCase() || 'U'}
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">
            {profile?.fullName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {roleLabel(profile?.role)}
          </p>

          <div className="mt-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {prettyStatus(profile?.status || 'Active')}
          </div>

          <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">
            <InfoBlock label="NIC" value={profile?.nic} />
            <InfoBlock
              label="Email"
              value={profile?.email}
            />
            <InfoBlock
              label="Mobile Number"
              value={profile?.phoneNumber}
            />
            <InfoBlock
              label="Role"
              value={roleLabel(profile?.role)}
            />
          </div>
        </aside>

        <section className="rounded-[28px] border border-white/60 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                NIC and role are protected system values
                and cannot be changed from this screen.
              </p>
            </div>

            {!isEditing && (
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                View mode
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <InfoBlock
                  label="Full Name"
                  value={profile?.fullName}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <InfoBlock
                  label="Email Address"
                  value={profile?.email}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <InfoBlock
                  label="Mobile Number"
                  value={profile?.phoneNumber}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <InfoBlock
                  label="Account Status"
                  value={prettyStatus(
                    profile?.status || 'Active',
                  )}
                />
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
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
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

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
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  )}
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
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-sky-600 disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}

export default ProfilePage