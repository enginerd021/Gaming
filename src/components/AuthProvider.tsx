'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore, startUserListeners, stopUserListeners } from '@/store/useAppStore';

// Session expiration duration: 2 hours (7,200,000 milliseconds)
export const SESSION_MAX_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_START_KEY = 'shaktrix_session_start_timestamp';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.loading);
  const setUser = useAppStore((state) => state.setUser);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const setIsOffline = useAppStore((state) => state.setIsOffline);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);
  const router = useRouter();
  const pathname = usePathname();
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto redirect logged-in users who do not have a Firestore profile yet to /setup-gamer-id
  useEffect(() => {
    if (
      user &&
      user.emailVerified &&
      !loading &&
      profile === null &&
      pathname !== '/setup-gamer-id' &&
      pathname !== '/login' &&
      pathname !== '/register' &&
      pathname !== '/verify-email' &&
      pathname !== '/session-expired'
    ) {
      router.push('/setup-gamer-id');
    }
  }, [user, profile, loading, pathname, router]);

  // Offline / Network listener
  useEffect(() => {
    const isInitiallyOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    setIsOffline(isInitiallyOffline);
    setConnectionStatus(isInitiallyOffline ? 'offline' : 'online');

    const handleOnline = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setIsOffline(false);
      setConnectionStatus('online');
    };

    const handleOffline = () => {
      setConnectionStatus('reconnecting');
      setIsOffline(false);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        setConnectionStatus('offline');
        setIsOffline(true);
        router.push('/leaderboard');
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline, setConnectionStatus, router]);

  // 2-Hour Session Expiry Checker
  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_START_KEY);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      let sessionStartStr = localStorage.getItem(SESSION_START_KEY);
      let sessionStart = sessionStartStr ? parseInt(sessionStartStr, 10) : 0;
      
      if (!sessionStart || isNaN(sessionStart)) {
        sessionStart = Date.now();
        localStorage.setItem(SESSION_START_KEY, sessionStart.toString());
      }

      const checkSessionExpiry = async () => {
        const now = Date.now();
        const elapsed = now - sessionStart;

        // If session age exceeds 2 hours (7,200,000 ms)
        if (elapsed >= SESSION_MAX_DURATION_MS) {
          console.warn('[Session Security] 2-Hour Session Expired. Logging out...');
          localStorage.removeItem(SESSION_START_KEY);
          try {
            await signOut(auth);
          } catch (err) {
            console.error('SignOut error during session expiration:', err);
          }
          router.push('/session-expired');
        }
      };

      // Initial check on mount
      checkSessionExpiry();

      // Check session age every 30 seconds
      const interval = setInterval(checkSessionExpiry, 30000);
      return () => clearInterval(interval);
    }
  }, [user, router]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        if (typeof window !== 'undefined' && !localStorage.getItem(SESSION_START_KEY)) {
          localStorage.setItem(SESSION_START_KEY, Date.now().toString());
        }

        if (user.emailVerified) {
          startUserListeners(user.uid);
        } else {
          stopUserListeners();
          useAppStore.setState({ profile: null, team: null, loading: false });
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_START_KEY);
        }
        stopUserListeners();
        useAppStore.setState({ profile: null, team: null, loading: false });
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setInitialized]);

  return <>{children}</>;
}
