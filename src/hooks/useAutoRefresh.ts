'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to execute a data refresh callback periodically every `intervalMs` milliseconds (default 5 seconds).
 * Also triggers on window focus and tab visibility change, and triggers Next.js router refresh.
 */
export function useAutoRefresh(
  onRefresh?: () => void,
  intervalMs: number = 5000
) {
  const [refreshCount, setRefreshCount] = useState(0);
  const router = useRouter();
  const savedCallback = useRef(onRefresh);

  useEffect(() => {
    savedCallback.current = onRefresh;
  }, [onRefresh]);

  const triggerRefresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
    if (savedCallback.current) {
      savedCallback.current();
    }
    // Also trigger Next.js server components revalidation / refresh
    router.refresh();
  }, [router]);

  useEffect(() => {
    // Periodic auto-refresh timer
    const timer = setInterval(() => {
      triggerRefresh();
    }, intervalMs);

    // Refresh when user returns to window/tab
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
