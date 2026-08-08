'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for components that require explicit periodic background refresh callbacks.
 * Data is updated seamlessly without triggering full page re-renders or Next.js router flashes.
 */
export function useAutoRefresh(
  onRefresh?: () => void,
  intervalMs: number = 30000
) {
  const [refreshCount, setRefreshCount] = useState(0);
  const savedCallback = useRef(onRefresh);

  useEffect(() => {
    savedCallback.current = onRefresh;
  }, [onRefresh]);

  const triggerRefresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
    if (savedCallback.current) {
      savedCallback.current();
    }
  }, []);

  useEffect(() => {
    // Only run interval if an explicit onRefresh handler was provided
    if (!savedCallback.current) return;

    const timer = setInterval(() => {
      triggerRefresh();
    }, intervalMs);

    const handleFocus = () => {
      triggerRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, triggerRefresh]);

  return { refreshCount, triggerRefresh };
}
