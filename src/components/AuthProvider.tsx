'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore, startUserListeners, stopUserListeners } from '@/store/useAppStore';
import { isAdmin } from '@/lib/adminConfig';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.loading);
  const initialized = useAppStore((state) => state.initialized);
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

  // Auto redirect logged-in admins to /admin whenever they access regular player pages
  useEffect(() => {
    if (
      user &&
      !loading &&
      isAdmin(user.email) &&
      pathname !== '/admin' &&
      !pathname.startsWith('/tournaments') &&
      pathname !== '/login'
    ) {
      router.push('/admin');
    }
  }, [user, loading, pathname, router]);

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

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        if (user.emailVerified) {
          startUserListeners(user.uid);
        } else {
          // User is signed in but has NOT verified their email yet.
          stopUserListeners();
          useAppStore.setState({ profile: null, team: null, loading: false });
        }
      } else {
        stopUserListeners();
        useAppStore.setState({ profile: null, team: null, loading: false });
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setInitialized]);

  if (!initialized) {
    return <SkeletonLoader variant="full-page" />;
  }

  return <>{children}</>;
}
