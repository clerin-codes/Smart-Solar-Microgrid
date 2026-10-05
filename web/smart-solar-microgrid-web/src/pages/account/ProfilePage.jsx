import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import ChangePasswordModal from '../../components/account/ChangePasswordModal'
import PersonalInformationCard from '../../components/account/PersonalInformationCard'
import ProfileHeader from '../../components/account/ProfileHeader'
import SecurityCard from '../../components/account/SecurityCard'
import {
  getProfileInitials,
  validateProfileForm,
} from '../../components/account/profileUtils'

import useAuth from '../../hooks/useAuth'

import {
  getMyProfile,
  updateMyProfile,
} from '../../services/api/accountService'

import {
  getApiErrorMessage,
} from '../../utils/apiError'

/**
 * Coordinates profile data and delegates visual sections to focused components.
 * The API remains the source of truth for authorization and account rules.
 */
function ProfilePage() {
  const {
    refreshProfile,
  } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setPageError('')

      try {
        const data = await getMyProfile()

        if (!active) {
          return
        }

        setProfile(data)
        setForm({
          fullName: data?.fullName ?? '',
          email: data?.email ?? '',
          phoneNumber: data?.phoneNumber ?? '',
        })
      } catch (error) {
        if (active) {
          setPageError(
            getApiErrorMessage(
              error,
              'Unable to load your profile.',
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

  const initials = useMemo(
    () => getProfileInitials(profile?.fullName),
    [profile?.fullName],
  )

  const status = profile?.status ?? profile?.accountStatus ?? ''

  function resetEditForm() {
    setForm({
      fullName: profile?.fullName ?? '',
      email: profile?.email ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
    })

    setErrors({})
  }

  function startEditing() {
    resetEditForm()
    setEditing(true)
  }

  function cancelEditing() {
    resetEditForm()
    setEditing(false)
  }

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
  }

  async function saveProfile(event) {
    event.preventDefault()

    const validationErrors = validateProfileForm(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)

    try {
      const updated = await updateMyProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
      })

      // Some APIs return the updated object while others return only a message.
      const nextProfile = updated?.nic
        ? updated
        : await getMyProfile()

      setProfile(nextProfile)
      setEditing(false)
      await refreshProfile()
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update your profile.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-800" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  if (pageError && !profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        {pageError}
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">
            My Profile
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Manage your personal information and account security.
          </p>
        </section>

        <ProfileHeader
          profile={profile}
          status={status}
          initials={initials}
          editing={editing}
          onEdit={startEditing}
        />

        <PersonalInformationCard
          profile={profile}
          editing={editing}
          saving={saving}
          form={form}
          errors={errors}
          onFieldChange={updateField}
          onCancel={cancelEditing}
          onSubmit={saveProfile}
        />

        <SecurityCard
          onChangePassword={() => setPasswordModalOpen(true)}
        />
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  )
}

export default ProfilePage
