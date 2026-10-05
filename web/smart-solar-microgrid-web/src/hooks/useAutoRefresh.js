import { useEffect } from "react";

/**
 * Runs a supplied refresh callback on an interval and when the browser regains
 * focus. It only refreshes while the tab is visible to avoid unnecessary API calls.
 */
export default function useAutoRefresh(refresh, intervalMs = 5000) {
  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    const intervalId = window.setInterval(refreshWhenVisible, intervalMs);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh, intervalMs]);
}
