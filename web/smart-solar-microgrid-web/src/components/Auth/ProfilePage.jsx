import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { useForm } from '../../hooks/useForm'
import { userService } from '../../services/userService'
import { ROLES, ROLE_LABELS } from '../../utils/constants'
import { errorMessage } from '../../utils/formatters'
import { email, phone, required } from '../../utils/validators'
import { Button, Card, Detail, ErrorMessage, Field, PageHeader, Spinner, inputClass } from '../Common/ui'

function EditableProfile({ nic, initial, onSaved }) {
  const [saving, setSaving] = useState(false)
  const { values, setValues, errors, handleChange, handleBlur, handleSubmit } = useForm(initial, {
    fullName: [required],
    email: [required, email],
    phoneNumber: [required, phone],
  })

  useEffect(() => setValues(initial), [initial, setValues])

  const onSubmit = async (v) => {
    setSaving(true)
    try {
      await userService.update(nic, { fullName: v.fullName, email: v.email, phoneNumber: v.phoneNumber })
      toast.success('Profile updated')
      onSaved(v.fullName)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Full name" error={errors.fullName}>
        <input name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <Field label="Phone number" error={errors.phoneNumber}>
        <input name="phoneNumber" value={values.phoneNumber} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const canEdit = user.role === ROLES.BACKOFFICE
  const { data, loading, error, reload } = useFetch(
    () => (canEdit ? userService.getByNic(user.nic) : Promise.resolve(null)),
    [user.nic],
  )

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details" />
      <Card>
        <dl className="mb-6 grid gap-4 sm:grid-cols-3">
          <Detail label="NIC">{user.nic}</Detail>
          <Detail label="Name">{user.fullName}</Detail>
          <Detail label="Role">{ROLE_LABELS[user.role] ?? user.role}</Detail>
        </dl>

        {canEdit ? (
          <>
            {loading && <Spinner />}
            <ErrorMessage message={error} onRetry={reload} />
            {data && (
              <EditableProfile
                nic={user.nic}
                initial={{ fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber }}
                onSaved={reload}
              />
            )}
          </>
        ) : (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            Profile details are managed by a Backoffice administrator. Contact them to change your name, email or
            phone number.
          </p>
        )}
      </Card>
    </>
  )
}
