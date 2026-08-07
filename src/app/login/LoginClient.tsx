'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Gamepad2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg style={{ width: '18px', height: '18px', marginRight: '0.75rem' }} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupErr: unknown) {
        const pErr = popupErr as { code?: string; message?: string };
        if (pErr.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }

      const user = userCredential.user;
      await user.getIdToken(true);

      // Check if profile exists
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const rawName = user.displayName || user.email?.split('@')[0] || 'Gamer';
        const baseTag = rawName.replace(/[^a-zA-Z0-9_]/g, '') || 'Gamer';
        const cleanGamertag = `${baseTag.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`;

        const claimRef = doc(db, "gamertags", cleanGamertag);
        await setDoc(claimRef, { uid: user.uid, rawGamertag: rawName });

        await setDoc(profileRef, {
          uid: user.uid,
          gamertag: cleanGamertag,
          displayName: rawName,
          registeredGames: [],
          preferredRoles: [],
          skillLevel: 'Intermediate',
          stats: {
            wins: 0,
            losses: 0,
            points: 1000
          },
          createdAt: Date.now()
        });
      }

      router.push('/');
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
      triggerShake();
      const gErr = err as { code?: string; message?: string };
      if (gErr.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is disabled in Firebase Console. Please enable Google under Authentication > Sign-in method.');
      } else if (gErr.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In in Firebase Console settings.');
      } else if (gErr.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else {
        setError(gErr.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Both email and password are required.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/');
    } catch (err: unknown) {
      console.error('Login error:', err);
      triggerShake();
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(authErr.message || 'An error occurred during sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        router.push('/profile');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('Google sign-in error:', err);
        setError(err.message || 'An error occurred during Google sign-in.');
        triggerShake();
      } else {
        console.log('Google sign-in popup closed by user.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      position: 'relative',
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '7.5rem 1.5rem 4rem 1.5rem',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Glows */}
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className={`glass-panel fade-in ${shake ? 'shake' : ''}`} style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Gamepad2 size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.95rem' }}>Sign in to continue your esports journey</p>
        </div>

        {/* Assertive live region for validation error announcer */}
        <div aria-live="assertive">
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'hsla(350, 85%, 55%, 0.12)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--accent-red)',
              fontSize: '0.9rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <div className="input-glow-wrapper">
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <div className="input-glow-wrapper" style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="glass-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', height: '3rem' }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Google Sign-In Option */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="glass-panel-interactive"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don&apos;t have an account? </span>
          <Link href="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
