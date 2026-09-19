import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { useForm } from '../../hooks/useForm'
import { userService } from '../../services/userService'
import { ROLE_LABELS, USER_ROLES, enumName } from '../../utils/constants'
import { errorMessage } from '../../utils/formatters'
import { email, minLength, phone, required } from '../../utils/validators'
import ConfirmDialog from '../Common/ConfirmDialog'
import Modal from '../Common/Modal'
import {
  Button,
  EmptyState,
  ErrorMessage,
  Field,
  PageHeader,
  Spinner,
  StatusBadge,
  Table,
  inputClass,
} from '../Common/ui'

function UserForm({ user, onDone, onCancel }) {
  const editing = Boolean(user)
  const [saving, setSaving] = useState(false)
  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm(
    editing
      ? { fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber }
      : { nic: '', fullName: '', email: '', phoneNumber: '', password: '', role: 'Prosumer' },
    {
      ...(editing ? {} : { nic: [required], password: [required, minLength(8)] }),
      fullName: [required],
      email: [required, email],
      phoneNumber: [required, phone],
    },
  )

  const onSubmit = async (v) => {
    setSaving(true)
    try {
      if (editing) {
        await userService.update(user.nic, { fullName: v.fullName, email: v.email, phoneNumber: v.phoneNumber })
        toast.success('User updated')
      } else {
        await userService.create({ ...v, nic: v.nic.trim(), role: USER_ROLES.indexOf(v.role) })
        toast.success('User created')
      }
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {!editing && (
        <Field label="NIC" error={errors.nic}>
          <input name="nic" value={values.nic} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
        </Field>
      )}
      <Field label="Full name" error={errors.fullName}>
        <input name="fullName" value={values.fullName} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      <Field label="Phone number" error={errors.phoneNumber}>
        <input name="phoneNumber" value={values.phoneNumber} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
      </Field>
      {!editing && (
        <>
          <Field label="Password" error={errors.password} hint="At least 8 characters">
            <input name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} className={inputClass} />
          </Field>
          <Field label="Role">
            <select name="role" value={values.role} onChange={handleChange} className={inputClass}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}

export default function UserManagement() {
  const { user: me } = useAuth()
  const { data: users, loading, error, reload } = useFetch(userService.getAll)
  const [modal, setModal] = useState(null) // { user } | { user: null } for create
  const [toggle, setToggle] = useState(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = (users ?? []).filter((u) =>
    `${u.nic} ${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
  )

  const confirmToggle = async () => {
    setBusy(true)
    try {
      if (toggle.isActive) await userService.deactivate(toggle.nic)
      else await userService.reactivate(toggle.nic)
      toast.success(toggle.isActive ? 'User deactivated' : 'User reactivated')
      setToggle(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Create and manage system accounts"
        actions={<Button onClick={() => setModal({ user: null })}>+ New user</Button>}
      />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by NIC, name or email"
        className={`${inputClass} mb-4 max-w-sm`}
      />
      {loading && <Spinner />}
      <ErrorMessage message={error} onRetry={reload} />
      {users && filtered.length === 0 && <EmptyState title="No users found" />}
      {filtered.length > 0 && (
        <Table headers={['NIC', 'Name', 'Email', 'Phone', 'Role', 'Status', '']}>
          {filtered.map((u) => (
            <tr key={u.nic}>
              <td className="px-4 py-3 font-mono text-xs">{u.nic}</td>
              <td className="px-4 py-3">{u.fullName}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{u.phoneNumber}</td>
              <td className="px-4 py-3">{ROLE_LABELS[enumName(USER_ROLES, u.role)] ?? u.role}</td>
              <td className="px-4 py-3">
                <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} />
              </td>
              <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                <Button variant="secondary" onClick={() => setModal({ user: u })}>
                  Edit
                </Button>
                <Button
                  variant={u.isActive ? 'danger' : 'info'}
                  disabled={u.nic === me.nic}
                  onClick={() => setToggle(u)}
                >
                  {u.isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={Boolean(modal)} title={modal?.user ? 'Edit user' : 'New user'} onClose={() => setModal(null)}>
        {modal && (
          <UserForm
            user={modal.user}
            onCancel={() => setModal(null)}
            onDone={() => {
              setModal(null)
              reload()
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toggle)}
        title={toggle?.isActive ? 'Deactivate user?' : 'Reactivate user?'}
        message={`${toggle?.fullName} (${toggle?.nic}) will ${toggle?.isActive ? 'no longer be able to sign in' : 'be able to sign in again'}.`}
        confirmLabel={toggle?.isActive ? 'Deactivate' : 'Reactivate'}
        variant={toggle?.isActive ? 'danger' : 'info'}
        busy={busy}
        onConfirm={confirmToggle}
        onCancel={() => setToggle(null)}
      />
    </>
  )
}
