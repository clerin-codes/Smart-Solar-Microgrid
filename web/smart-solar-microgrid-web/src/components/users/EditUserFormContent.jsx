import {
  AccountTypeIcon,
  IdIcon,
} from './UserFormIcons'

import {
  UserInformationFields,
} from './UserFormShared'

/** Edit-only content keeps immutable identity fields visible but not editable. */
export default function EditUserFormContent({
  form,
  errors,
  submitting,
  onFieldChange,
}) {
  return (
    <>
      <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/75 px-5 py-4.5">
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="pb-4 sm:pb-0 sm:pr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 ring-1 ring-blue-200/70">
                <IdIcon />
              </div>

              <p className="text-sm font-semibold text-slate-500">
                NIC
              </p>
            </div>

            <p className="mt-2.5 text-[16px] font-semibold tracking-[0.01em] text-slate-900">
              {form.nic || '—'}
            </p>
          </div>

          <div className="pt-4 sm:pl-6 sm:pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200/70">
                <AccountTypeIcon />
              </div>

              <p className="text-sm font-semibold text-slate-500">
                Account Type
              </p>
            </div>

            <p className="mt-2.5 text-[16px] font-semibold text-slate-900">
              {form.role === 'GridOperator'
                ? 'Grid Operator'
                : form.role || '—'}
            </p>
          </div>
        </div>
      </section>

      <UserInformationFields
        form={form}
        errors={errors}
        submitting={submitting}
        isEdit
        onFieldChange={onFieldChange}
      />
    </>
  )
}
