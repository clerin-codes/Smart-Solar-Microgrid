import Alert from '../common/Alert'

/**
 * Presentation-only login panel.
 *
 * Authentication and navigation remain in LoginPage.
 */
export default function LoginFormPanel({
  form,
  errors,
  errorMessage,
  submitting,
  authLoading,
  showPassword,
  nicFocused,
  passwordFocused,
  onFieldChange,
  onSubmit,
  onNicFocus,
  onPasswordFocus,
  onTogglePassword,
}) {
  return (
    <section className="relative flex h-[100dvh] items-center justify-center overflow-hidden bg-[#f8fafc] px-5 sm:px-8 lg:px-10 xl:px-14">
      <div className="absolute -right-48 -top-48 h-[440px] w-[440px] rounded-full bg-blue-100/50 blur-3xl" />

      <div className="absolute -bottom-52 -left-40 h-[440px] w-[440px] rounded-full bg-sky-100/60 blur-3xl" />

      <div className="relative w-full max-w-[500px]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Secure Web Portal
          </p>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950">
            Sign In
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Access SunChain administration and
            grid operations securely.
          </p>

          {errorMessage && (
            <div className="mt-5">
              <Alert type="error">
                {errorMessage}
              </Alert>
            </div>
          )}

          <form
            onSubmit={
              onSubmit
            }
            className="mt-10"
            noValidate
            autoComplete="off"
          >
            {/* NIC */}

            <div>
              <label
                htmlFor="login-nic"
                className="text-sm font-semibold text-slate-800"
              >
                NIC
              </label>

              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                    />

                    <path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                </div>

                <input
                  id="login-nic"
                  name="nic"
                  value={
                    form.nic
                  }
                  onChange={
                    onFieldChange
                  }
                  onFocus={
                    onNicFocus
                  }
                  readOnly={
                    !nicFocused
                  }
                  disabled={
                    submitting
                  }
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="Enter your NIC"
                  className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    errors.nic
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
              </div>

              {errors.nic && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {
                    errors.nic
                  }
                </p>
              )}
            </div>

            {/* Password */}

            <div className="mt-5">
              <label
                htmlFor="login-password"
                className="text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    onFieldChange
                  }
                  onFocus={
                    onPasswordFocus
                  }
                  readOnly={
                    !passwordFocused
                  }
                  disabled={
                    submitting
                  }
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border bg-white py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />

                <button
                  type="button"
                  onClick={
                    onTogglePassword
                  }
                  disabled={
                    submitting
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M3 3l18 18" />

                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.5 9 5.5a16 16 0 0 1-2.1 2.8M6.1 6.1A16.2 16.2 0 0 0 3 9.5S6.5 15 12 15c1.2 0 2.3-.2 3.3-.6" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {
                    errors.password
                  }
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                authLoading
              }
              className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Signing in...'
                : 'Sign In'}

              {!submitting && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                className="h-5 w-5"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                />

                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Web access is available for

              <span className="font-semibold text-blue-700">
                {' '}
                Backoffice
              </span>

              {' '}
              and

              <span className="font-semibold text-blue-700">
                {' '}
                Grid Operator
              </span>

              {' '}
              users.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}