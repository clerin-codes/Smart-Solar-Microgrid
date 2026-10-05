import {
  IdIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from './UserFormIcons'

export function RequiredMark() {
  return <span className="ml-1 text-red-500">*</span>
}

export function FieldError({ message }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-1.5 text-sm font-medium text-red-600">
      {message}
    </p>
  )
}

export function InputIcon({ children }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
      {children}
    </div>
  )
}

/** Shared contact fields used by create and edit while preserving existing classes. */
export function UserInformationFields({
  form,
  errors,
  submitting,
  isEdit,
  onFieldChange,
}) {
  return (
    <section>
      <div className={isEdit ? 'mb-6' : 'mb-5'}>
        <h3 className={`font-bold text-slate-950 ${isEdit ? 'text-[19px]' : 'text-lg'}`}>
          User Information
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {isEdit
            ? 'Update the account holder’s contact information.'
            : "Enter the account holder's identification and contact details."}
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${
        isEdit ? 'gap-x-6 gap-y-6' : 'gap-x-5 gap-y-5'
      }`}>
        {!isEdit && (
          <div>
            <label htmlFor="user-nic" className="text-[15px] font-semibold text-slate-800">
              NIC
              <RequiredMark />
            </label>

            <div className="relative mt-2">
              <InputIcon>
                <IdIcon />
              </InputIcon>

              <input
                id="user-nic"
                name="nic"
                type="text"
                value={form.nic}
                onChange={onFieldChange}
                disabled={submitting}
                autoComplete="off"
                placeholder="e.g. 200112345678"
                className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 ${
                  errors.nic
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-50'
                }`}
              />
            </div>

            <FieldError message={errors.nic} />
          </div>
        )}

        <div>
          <label htmlFor="user-full-name" className="text-[15px] font-semibold text-slate-800">
            Full Name
            <RequiredMark />
          </label>

          <div className="relative mt-2">
            <InputIcon>
              <UserIcon />
            </InputIcon>

            <input
              id="user-full-name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={onFieldChange}
              disabled={submitting}
              autoComplete="name"
              placeholder="Enter full name"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                errors.fullName
                  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              }`}
            />
          </div>

          <FieldError message={errors.fullName} />
        </div>

        <div>
          <label htmlFor="user-email" className="text-[15px] font-semibold text-slate-800">
            Email Address
            <RequiredMark />
          </label>

          <div className="relative mt-2">
            <InputIcon>
              <MailIcon />
            </InputIcon>

            <input
              id="user-email"
              name="email"
              type="email"
              value={form.email}
              onChange={onFieldChange}
              disabled={submitting}
              autoComplete="email"
              placeholder="name@example.com"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                errors.email
                  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              }`}
            />
          </div>

          <FieldError message={errors.email} />
        </div>

        <div>
          <label htmlFor="user-phone" className="text-[15px] font-semibold text-slate-800">
            Mobile Number
            <RequiredMark />
          </label>

          <div className="relative mt-2">
            <InputIcon>
              <PhoneIcon />
            </InputIcon>

            <input
              id="user-phone"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={onFieldChange}
              disabled={submitting}
              autoComplete="tel"
              placeholder="e.g. 0771234567"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-base font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                errors.phoneNumber
                  ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50'
                  : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              }`}
            />
          </div>

          <FieldError message={errors.phoneNumber} />
        </div>
      </div>
    </section>
  )
}
