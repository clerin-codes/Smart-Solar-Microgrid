// "08:00:00" -> "08:00"
export const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')

// The Sri Lanka calendar day of an API timestamp. The server sends slots as "...T00:00:00Z" but can send a
// reservation stored at Sri Lanka midnight as the previous day at 18:30Z; both mean the same local day.
export const dateOnly = (value) => {
  if (!value) return ''
  const t = Date.parse(value)
  if (Number.isNaN(t)) return String(value).slice(0, 10)
  return new Date(t + 5.5 * 3_600_000).toISOString().slice(0, 10)
}

export const formatDate = (value) => {
  const d = dateOnly(value)
  if (!d) return '-'
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '-'

export const formatKw = (n) => `${Number(n ?? 0).toLocaleString()} kW`

export const errorMessage = (err, fallback = 'Something went wrong.') =>
  err?.response?.data?.message ||
  (err?.response?.status === 403 ? 'You do not have permission to do that.' : null) ||
  (err?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the API running?' : null) ||
  err?.message ||
  fallback

export const downloadCsv = (filename, rows) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`
