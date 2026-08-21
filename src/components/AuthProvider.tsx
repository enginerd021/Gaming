'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore, startUserListeners, stopUserListeners } from '@/store/useAppStore';
import { isAdmin } from '@/lib/adminConfig';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

// Session expiration duration: 2 hours (7,200,000 milliseconds)
export const SESSION_MAX_DURATION_MS = 2 * 60 * 60 * 1000;
const SESSION_START_KEY = 'shaktrix_session_start_timestamp';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.loading);
  const initialized = useAppStore((state) => state.initialized);
  const sessionExpired = useAppStore((state) => state.sessionExpired);
  const setUser = useAppStore((state) => state.setUser);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const setIsOffline = useAppStore((state) => state.setIsOffline);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);
  const logout = useAppStore((state) => state.logout);
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
          // User is signed in but has NOT verified their email yet.
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

  const handleReauth = async () => {
    await logout();
    router.push(`/login?redirect=${encodeURIComponent(pathname || '')}`);
  };

  if (!initialized) {
    return <SkeletonLoader variant="full-page" />;
  }

  return (
    <>
      {children}
      
      {sessionExpired && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10000,
          background: 'rgba(2, 6, 16, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }} className="fade-in">
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 42, 109, 0.3)',
              background: 'rgba(6, 14, 30, 0.98)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 42, 109, 0.15)',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}
          >
            {/* Session Expired Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 42, 109, 0.1)',
              border: '2px solid var(--accent-red)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 42, 109, 0.2)',
              animation: 'pulseSkeleton 2s infinite ease-in-out'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 900, 
                color: '#fff', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                margin: '0 0 0.5rem 0', 
                fontFamily: 'var(--font-title)' 
              }}>
                Session Expired
              </h3>
              <p style={{ 
                fontSize: '0.95rem', 
                color: 'var(--text-secondary)', 
                margin: 0,
                lineHeight: '1.5',
                fontFamily: 'var(--font-body)'
              }}>
                Your session has ended — please log in again to continue.
              </p>
            </div>

            <button 
              onClick={handleReauth}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem 1.8rem',
                fontSize: '0.95rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0070CC 100%)',
                color: '#02040a',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
              }}
            >
              Log In
            </button>
          </div>
        </div>
      )}
    </>
  );
}
