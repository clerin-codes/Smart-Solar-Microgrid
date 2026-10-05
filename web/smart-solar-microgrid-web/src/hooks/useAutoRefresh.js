import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 5000;

/**
 * Automatically refreshes data at a fixed interval while the browser tab
 * is visible. A refresh is also triggered when the browser regains focus
 * or when the user returns to the tab.
 *
 * The hook prevents overlapping refresh requests so that a slow API call
 * cannot create multiple concurrent requests.
 *
 * Supported usage:
 *
 * useAutoRefresh(loadData)
 *
 * useAutoRefresh(loadData, 5000)
 *
 * useAutoRefresh(loadData, {
 *   enabled: true,
 *   intervalMs: 5000,
 * })
 */
export default function useAutoRefresh(refresh, options = DEFAULT_INTERVAL_MS) {
  const refreshRef = useRef(refresh);

  const runningRef = useRef(false);

  /*
   * Support both versions of the hook API so existing pages do not break
   * during the branch merge.
   */
  const enabled =
    typeof options === "number" ? true : (options?.enabled ?? true);

  const intervalMs =
    typeof options === "number"
      ? options
      : (options?.intervalMs ?? DEFAULT_INTERVAL_MS);

  /*
   * Keep the latest refresh callback without recreating the interval every
   * time the parent component renders.
   */
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;

    /*
     * Execute the refresh only when the page is visible and when another
     * refresh request is not already running.
     */
    async function runRefresh() {
      if (
        disposed ||
        runningRef.current ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      runningRef.current = true;

      try {
        await refreshRef.current();
      } catch (error) {
        console.error("Automatic refresh failed:", error);
      } finally {
        runningRef.current = false;
      }
    }

    /*
     * Refresh immediately when the user returns to a previously hidden tab.
     */
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    }

    /*
     * Refresh periodically while the page remains open.
     */
    const intervalId = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    /*
     * Refresh when the browser window becomes active again.
     */
    function handleFocus() {
      void runRefresh();
    }

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    /*
     * Clean up all listeners and timers when the component unmounts or when
     * the hook configuration changes.
     */
    return () => {
      disposed = true;

      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
