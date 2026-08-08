'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore, startUserListeners, stopUserListeners } from '@/store/useAppStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((state) => state.setUser);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const setIsOffline = useAppStore((state) => state.setIsOffline);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);
  const router = useRouter();
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial status check
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
      // 1. Show 'reconnecting' for 5 seconds
      setConnectionStatus('reconnecting');
      setIsOffline(false);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = setTimeout(() => {
        // 2. After 5 seconds, set status to 'offline' & navigate to /leaderboard
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        if (user.emailVerified) {
          // Fully authenticated: start real-time Firestore listeners for profile + team.
          startUserListeners(user.uid);
        } else {
          // User is signed in but has NOT verified their email yet.
          // We store the user object (so /verify-email can call resend),
          // but we do NOT start profile/team listeners — they shouldn't
          // have full app access until verified.
          // Google Sign-In users always have emailVerified=true, so this
          // branch only applies to email/password accounts.
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

  return <>{children}</>;
}
