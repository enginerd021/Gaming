'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Gamepad2, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

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

import { useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const isSessionExpired = searchParams.get('reason') === 'session_expired';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!email.trim()) {
      setError('Please enter your email address above to reset your password.');
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Generic message regardless — do not reveal whether email exists.
      setSuccessMsg('If an account with that email exists, a password reset link has been sent.');
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/user-not-found') {
        // Suppress user-not-found to avoid leaking which emails are registered.
        setSuccessMsg('If an account with that email exists, a password reset link has been sent.');
      } else if (authErr.code === 'auth/invalid-email') {
        triggerShake();
        setError('Please enter a valid email address.');
      } else {
        triggerShake();
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
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

      const rawName = user.displayName || user.email?.split('@')[0] || 'Gamer';

      if (!profileSnap.exists()) {
        router.push('/setup-gamer-id');
        return;
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
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Both email and password are required.');
      triggerShake();
      return;
    }

    if (!acceptedTerms) {
      setError('Please agree to the Terms & Conditions to log in.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Block unverified email/password accounts from accessing the app.
      // Google Sign-In users are always verified (emailVerified=true by default).
      if (!user.emailVerified) {
        router.push('/verify-email');
        return;
      }

      router.push('/');
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const isExpectedError = 
        authErr.code === 'auth/user-not-found' || 
        authErr.code === 'auth/wrong-password' || 
        authErr.code === 'auth/invalid-credential';
      
      if (!isExpectedError) {
        console.error('Login error:', err);
      } else {
        console.warn('Login attempt failed:', authErr.code);
      }
      
      triggerShake();
      if (isExpectedError) {
        setError('Password does not match or email is not found. Please click "Forgot Password?" below to reset.');
      } else {
        setError(authErr.message || 'An error occurred during sign-in.');
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
          {welcomeMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--accent-cyan)',
              fontSize: '0.95rem',
              fontWeight: 700,
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
            }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{welcomeMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0, 255, 170, 0.12)',
              border: '1px solid #00ffaa',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: '#00ffaa',
              fontSize: '0.9rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {isSessionExpired && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 60, 60, 0.12)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--accent-red)',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              <KeyRound size={18} style={{ flexShrink: 0 }} />
              <span>Your session has expired for security reasons. Please log in again to continue.</span>
            </div>
          )}

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

          {/* FORGOT PASSWORD LINK - Bottom Left Section before Terms & Conditions */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
            <Link
              href="/forgot-password"
              style={{
                color: 'var(--accent-cyan)',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: 0,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'opacity 0.2s ease'
              }}
              className="hover-opacity"
            >
              <KeyRound size={14} />
              Forgot Password?
            </Link>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                id="login-agree-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{
                  accentColor: 'var(--accent-cyan)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              <span>
                I agree to the{' '}
                <Link href="/about/rulebook" target="_blank" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>
                  Terms & Conditions
                </Link>{' '}
                and Fair Play Rules.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', height: '3rem' }}
            disabled={loading || !acceptedTerms}
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
