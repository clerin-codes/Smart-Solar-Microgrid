import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../utils/apiError'

import CreateUserFormContent from './CreateUserFormContent'
import EditUserFormContent from './EditUserFormContent'
import {
  CloseIcon,
  UserIcon,
} from './UserFormIcons'
import {
  buildUserPayload,
  EMPTY_USER_FORM,
  normalizeFieldErrors,
  validateUserForm,
} from './userFormValidation'

/**
 * Coordinates create/edit user form state while the visual sections live in
 * focused child components. API validation remains authoritative.
 */
function UserFormModal({
  open,
  mode = 'create',
  user,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(EMPTY_USER_FORM)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

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
      setForm(EMPTY_USER_FORM)
    }

    setErrors({})
    setApiError('')
    setSubmitting(false)
    setShowPassword(false)
  }, [
    open,
    isEdit,
    user,
  ])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [
    open,
    submitting,
    onClose,
  ])

  const passwordChecks = useMemo(
    () => ({
      length: form.password.length >= 12,
      uppercase: /[A-Z]/.test(form.password),
      lowercase: /[a-z]/.test(form.password),
      number: /\d/.test(form.password),
      special: /[^A-Za-z0-9]/.test(form.password),
    }),
    [form.password],
  )

  if (!open) {
    return null
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

    setApiError('')
  }

  function selectRole(role) {
    if (isEdit) {
      return
    }

    setForm((current) => ({
      ...current,
      role,
    }))

    setErrors((current) => ({
      ...current,
      role: '',
    }))

    setApiError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setApiError('')

    const validationErrors = validateUserForm(form, isEdit)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(buildUserPayload(form, isEdit))
    } catch (error) {
      setErrors((current) => ({
        ...current,
        ...normalizeFieldErrors(getApiFieldErrors(error)),
      }))

      setApiError(
        getApiErrorMessage(
          error,
          isEdit
            ? 'Unable to update user.'
            : 'Unable to create user.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <div
        className={`flex max-h-[94vh] w-full flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] ${
          isEdit
            ? 'max-w-[960px] rounded-[24px]'
            : 'max-w-4xl rounded-[22px]'
        }`}
      >
        <div
          className={`flex items-start justify-between border-b border-slate-200 ${
            isEdit
              ? 'bg-gradient-to-r from-white via-white to-slate-50/80 px-8 py-6'
              : 'px-7 py-5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-xl ${
                isEdit
                  ? 'h-11 w-11 bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                  : 'h-10 w-10 bg-blue-50 text-blue-800'
              }`}
            >
              <UserIcon />
            </div>

            <div>
              <h2
                className={`font-bold tracking-[-0.03em] text-slate-950 ${
                  isEdit ? 'text-[25px]' : 'text-2xl'
                }`}
              >
                {isEdit ? 'Edit User' : 'Create User'}
              </h2>

              <p className="mt-1 text-[15px] text-slate-500">
                {isEdit
                  ? 'Update the user account information.'
                  : 'Create a new web portal account.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className={`overflow-y-auto ${isEdit ? 'px-8 py-6' : 'px-7 py-6'}`}>
            {apiError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                <p className="text-[15px] font-semibold text-red-700">
                  Unable to save user
                </p>
                <p className="mt-1 text-sm leading-6 text-red-600">
                  {apiError}
                </p>
              </div>
            )}

            {isEdit ? (
              <EditUserFormContent
                form={form}
                errors={errors}
                submitting={submitting}
                onFieldChange={updateField}
              />
            ) : (
              <CreateUserFormContent
                form={form}
                errors={errors}
                submitting={submitting}
                showPassword={showPassword}
                passwordChecks={passwordChecks}
                onFieldChange={updateField}
                onSelectRole={selectRole}
                onTogglePassword={() =>
                  setShowPassword((current) => !current)
                }
              />
            )}
          </div>

          <div
            className={`flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 ${
              isEdit ? 'px-8 py-4.5' : 'px-7 py-4'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex h-11 min-w-[145px] items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                isEdit
                  ? 'bg-orange-500 shadow-[0_5px_14px_rgba(249,115,22,0.20)] hover:bg-orange-600 hover:shadow-[0_7px_18px_rgba(249,115,22,0.26)] focus:ring-orange-100'
                  : 'bg-blue-800 hover:bg-blue-900 focus:ring-blue-100'
              }`}
            >
              {submitting ? (
                <>
                  <span
                    className={`h-4 w-4 animate-spin rounded-full border-2 border-t-white ${
                      isEdit ? 'border-orange-200' : 'border-blue-300'
                    }`}
                  />
                  {isEdit ? 'Saving...' : 'Creating...'}
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                <>
                  <UserIcon />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserFormModal
