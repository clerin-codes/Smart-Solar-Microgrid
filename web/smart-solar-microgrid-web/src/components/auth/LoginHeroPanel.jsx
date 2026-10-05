import loginSolarHero from '../../assets/login-solar-hero.png'

function Feature({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur-md">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-white/75">
          {description}
        </p>
      </div>
    </div>
  )
}

/**
 * Presentation-only hero section for the login page.
 * Authentication behaviour remains in LoginPage.
 */
export default function LoginHeroPanel() {
  return (
    <section className="relative hidden h-[100dvh] overflow-hidden lg:block">
      <img
        src={
          loginSolarHero
        }
        alt="Solar microgrid landscape"
        className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.12] saturate-[1.06]"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/42 via-slate-950/15 to-slate-950/0" />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/5" />

      <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              Smart Solar Microgrid Platform
            </span>
          </div>

          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[1.05] tracking-[-0.05em] text-white xl:text-[58px]">
            Clean Energy.
            <br />
            Smarter Operations.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-white/85">
            Securely manage users, solar stations,
            energy slots and grid operations through
            one connected platform.
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="grid gap-5 rounded-2xl border border-white/15 bg-slate-950/25 p-5 backdrop-blur-md sm:grid-cols-3">
            <Feature
              title="User Management"
              description="Secure role-based accounts"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                </svg>
              }
            />

            <Feature
              title="Solar Stations"
              description="Manage generation sites"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" />
                  <circle
                    cx="12"
                    cy="11"
                    r="2.5"
                  />
                </svg>
              }
            />

            <Feature
              title="Energy Slots"
              description="Control available capacity"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect
                    x="4"
                    y="5"
                    width="16"
                    height="15"
                    rx="2"
                  />

                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              }
            />
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-white/70">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path d="M12 3 5 7v5c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V7l-7-4Z" />

              <path d="m9 12 2 2 4-5" />
            </svg>

            Secure • Reliable • Sustainable
          </div>
        </div>
      </div>
    </section>
  )
}