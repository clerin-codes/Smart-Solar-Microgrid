import { useEffect, useRef } from 'react'

const DEFAULT_INTERVAL_MS = 3000

function useAutoRefresh(
  refresh,
  { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = {}
) {
  const refreshRef = useRef(refresh)
  const runningRef = useRef(false)

  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    if (!enabled) return undefined

    let disposed = false

    const run = async () => {
      if (
        disposed ||
        runningRef.current ||
        document.visibilityState === 'hidden'
      ) {
        return
      }

      runningRef.current = true
      try {
        await refreshRef.current()
      } catch (error) {
        console.error('Automatic refresh failed:', error)
      } finally {
        runningRef.current = false
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') run()
    }

    const timer = window.setInterval(run, intervalMs)
    window.addEventListener('focus', run)
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      disposed = true
      window.clearInterval(timer)
      window.removeEventListener('focus', run)
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [enabled, intervalMs])
}

export default useAutoRefresh
