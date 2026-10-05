import {
  CheckIcon,
  EyeIcon,
  LockIcon,
} from './UserFormIcons'

import {
  FieldError,
  InputIcon,
  RequiredMark,
  UserInformationFields,
} from './UserFormShared'

function RoleOption({
  selected,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[108px] w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-700'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? 'border-blue-700 bg-blue-700 text-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {selected && <CheckIcon />}
      </span>

      <span>
        <span className="block text-base font-semibold text-slate-900">
          {title}
        </span>

        <span className="mt-1.5 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  )
}

/** Create-only fields. Prosumer creation is deliberately not offered on web. */
export default function CreateUserFormContent({
  form,
  errors,
  submitting,
  showPassword,
  passwordChecks,
  onFieldChange,
  onSelectRole,
  onTogglePassword,
}) {
  return (
    <>
      <section className="mb-7">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-950">
            Account Type
            <RequiredMark />
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Select the type of web portal account
            you want to create.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RoleOption
            selected={form.role === 'Backoffice'}
            title="Backoffice"
            description="Administration access for managing users, stations and system records."
            onClick={() => onSelectRole('Backoffice')}
          />

          <RoleOption
            selected={form.role === 'GridOperator'}
            title="Grid Operator"
            description="Operational access for reservations and grid activities."
            onClick={() => onSelectRole('GridOperator')}
          />
        </div>

        <FieldError message={errors.role} />
      </section>

      <UserInformationFields
        form={form}
        errors={errors}
        submitting={submitting}
        isEdit={false}
        onFieldChange={onFieldChange}
      />

      <section className="mt-8 border-t border-slate-200 pt-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-950">
            Account Security
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Set the initial password for this web
            portal account.
          </p>
        </div>

        <div className="max-w-xl">
          <label htmlFor="user-password" className="text-[15px] font-semibold text-slate-800">
            Password
            <RequiredMark />
          </label>

          <div className="relative mt-2">
            <InputIcon>
              <LockIcon />
            </InputIcon>

            <input
              id="user-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={onFieldChange}
              disabled={submitting}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className={`h-12 w-full rounded-xl border bg-white pl-12 pr-12 text-base font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-4 ${
                errors.password
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-50'
              }`}
            />

            <button
              type="button"
              onClick={onTogglePassword}
              disabled={submitting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
            >
              <EyeIcon hidden={showPassword} />
            </button>
          </div>

          <FieldError message={errors.password} />

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">
              Password requirements
            </p>

            <div className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
              {[
                ['length', '12+ characters'],
                ['uppercase', 'Uppercase letter'],
                ['lowercase', 'Lowercase letter'],
                ['number', 'Number'],
                ['special', 'Special character'],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 ${
                    passwordChecks[key]
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      passwordChecks[key]? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {passwordChecks[key] && <CheckIcon />}
                  </span>

                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
