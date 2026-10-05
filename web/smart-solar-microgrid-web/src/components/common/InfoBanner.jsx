function InfoBanner({ title = 'How to use this page', children, tone = 'blue' }) {
  const styles = tone === 'emerald'
    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
    : 'border-blue-200 bg-blue-50/80 text-blue-950'

  return (
    <aside className={`flex gap-3 rounded-2xl border p-4 ${styles}`}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm">i</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6 opacity-80">{children}</div>
      </div>
    </aside>
  )
}

export default InfoBanner
