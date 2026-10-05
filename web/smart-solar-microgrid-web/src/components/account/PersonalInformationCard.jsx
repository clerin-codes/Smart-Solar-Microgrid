import {
  CalendarIcon,
  IdIcon,
  MailIcon,
  PhoneIcon,
} from './ProfileIcons'

import {
  formatProfileDate,
} from './profileUtils'

function FieldError({
  message,
}) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-1.5 text-sm font-medium text-red-600">
      {message}
    </p>
  )
}

function InformationItem({
  icon,
  iconClassName,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-4 border-b border-slate-100 py-5 last:border-b-0">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[15px] font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-[15px] font-semibold text-slate-950">
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

/**
 * Displays and edits personal information while
 * ProfilePage remains responsible for API operations.
 */
export default function PersonalInformationCard({
  profile,
  editing,
  saving,
  form,
  errors,
  onFieldChange,
  onCancel,
  onSubmit,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-950">
          Personal Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your registered identity and contact information.
        </p>
      </div>

      {!editing ? (
        <div className="grid grid-cols-1 gap-x-10 px-6 md:grid-cols-2">
          <InformationItem
            icon={
              <IdIcon />
            }
            iconClassName="bg-blue-50 text-blue-700"
            label="NIC"
            value={
              profile?.nic
            }
          />

          <InformationItem
            icon={
              <MailIcon />
            }
            iconClassName="bg-violet-50 text-violet-700"
            label="Email Address"
            value={
              profile?.email
            }
          />

          <InformationItem
            icon={
              <PhoneIcon />
            }
            iconClassName="bg-emerald-50 text-emerald-700"
            label="Mobile Number"
            value={
              profile?.phoneNumber
            }
          />

          <InformationItem
            icon={
              <CalendarIcon />
            }
            iconClassName="bg-amber-50 text-amber-700"
            label="Member Since"
            value={formatProfileDate(
              profile?.createdAt,
            )}
          />
        </div>
      ) : (
        <form
          onSubmit={
            onSubmit
          }
          className="p-6"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {/* Full Name */}

            <div>
              <label
                htmlFor="profile-name"
                className="text-[15px] font-semibold text-slate-800"
              >
                Full Name
              </label>

              <input
                id="profile-name"
                name="fullName"
                type="text"
                value={
                  form.fullName
                }
                onChange={
                  onFieldChange
                }
                disabled={
                  saving
                }
                className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 text-[15px] font-medium text-slate-900 outline-none transition focus:ring-4 ${
                  errors.fullName
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-50'
                }`}
              />

              <FieldError
                message={
                  errors.fullName
                }
              />
            </div>

            {/* NIC */}

            <div>
              <label className="text-[15px] font-semibold text-slate-800">
                NIC
              </label>

              <input
                type="text"
                value={
                  profile?.nic ??
                  ''
                }
                disabled
                className="mt-2 h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-[15px] font-medium text-slate-500"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                NIC cannot be changed.
              </p>
            </div>

            {/* Email */}

            <div>
              <label
                htmlFor="profile-email"
                className="text-[15px] font-semibold text-slate-800"
              >
                Email Address
              </label>

              <input
                id="profile-email"
                name="email"
                type="email"
                value={
                  form.email
                }
                onChange={
                  onFieldChange
                }
                disabled={
                  saving
                }
                className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 text-[15px] font-medium text-slate-900 outline-none transition focus:ring-4 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-50'
                }`}
              />

              <FieldError
                message={
                  errors.email
                }
              />
            </div>

            {/* Phone */}

            <div>
              <label
                htmlFor="profile-phone"
                className="text-[15px] font-semibold text-slate-800"
              >
                Mobile Number
              </label>

              <input
                id="profile-phone"
                name="phoneNumber"
                type="tel"
                value={
                  form.phoneNumber
                }
                onChange={
                  onFieldChange
                }
                disabled={
                  saving
                }
                className={`mt-2 h-12 w-full rounded-xl border bg-white px-4 text-[15px] font-medium text-slate-900 outline-none transition focus:ring-4 ${
                  errors.phoneNumber
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-50'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-50'
                }`}
              />

              <FieldError
                message={
                  errors.phoneNumber
                }
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={
                onCancel
              }
              disabled={
                saving
              }
              className="h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="h-10 min-w-[135px] rounded-xl bg-blue-800 px-5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}