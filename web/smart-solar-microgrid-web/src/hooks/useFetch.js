import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../utils/formatters'

// Runs `fetcher` on mount (and whenever `deps` change); exposes loading/error/reload.
// With `pollMs`, quietly re-fetches on that interval while the tab is visible; a failed
// background refresh keeps the last good data instead of replacing it with an error.
export function useFetch(fetcher, deps = [], { pollMs } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      setData(await fetcherRef.current())
      setUpdatedAt(new Date())
    } catch (err) {
      if (!silent) setError(errorMessage(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (!pollMs) return undefined
    const timer = setInterval(() => {
      if (!document.hidden) load(true)
    }, pollMs)
    return () => clearInterval(timer)
  }, [pollMs, load])

  const reload = useCallback(() => load(false), [load])

  return { data, loading, error, reload, setData, updatedAt }
}
