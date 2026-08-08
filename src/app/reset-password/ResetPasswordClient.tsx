'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader, KeyRound } from 'lucide-react';

type PageState = 'verifying' | 'form' | 'success' | 'invalid';

export default function ResetPasswordClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const oobCode = searchParams.get('oobCode');
  const mode    = searchParams.get('mode');

  const [pageState,       setPageState]       = useState<PageState>('verifying');
  const [verifiedEmail,   setVerifiedEmail]   = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [shake,           setShake]           = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // On mount: validate the oobCode from the URL
  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      setPageState('invalid');
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setVerifiedEmail(email);
        setPageState('form');
      })
      .catch(() => {
        // Code is expired, already used, or malformed.
        setPageState('invalid');
      });
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setPageState('success');
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (authErr.code === 'auth/expired-action-code') {
        setError('This reset link has expired. Please request a new one.');
      } else if (authErr.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or has already been used. Please request a new one.');
      } else if (authErr.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: 460,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  };

  return (
    <main style={{
      position: 'relative',
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '7.5rem 1.5rem 4rem',
      overflow: 'hidden',
    }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div style={cardStyle}>

        {/* Icon header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 68, height: 68, borderRadius: '50%',
            background: 'hsla(262, 83%, 58%, 0.12)',
            border: '1px solid hsla(262, 83%, 58%, 0.3)',
            marginBottom: '1.25rem',
          }}>
            <KeyRound size={30} style={{ color: 'var(--accent-violet)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Set New Password</h1>
        </div>

        {/* Verifying state */}
        {pageState === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader size={36} className="animate-spin" style={{ color: 'var(--accent-cyan)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Validating reset link…</p>
          </div>
        )}

        {/* Invalid / expired code */}
        {pageState === 'invalid' && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <AlertCircle size={44} style={{ color: 'var(--accent-red)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Invalid or Expired Link</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem', fontSize: '0.9rem' }}>
              This password reset link is invalid, has already been used, or has expired.
              Reset links are valid for 1 hour.
            </p>
            <Link href="/forgot-password">
              <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>
                Request New Reset Link
              </button>
            </Link>
          </div>
        )}

        {/* Password reset form */}
        {pageState === 'form' && (
          <form
            onSubmit={handleSubmit}
            className={`glass-panel ${shake ? 'shake' : ''}`}
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {verifiedEmail && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                Resetting password for <strong style={{ color: 'var(--accent-cyan)' }}>{verifiedEmail}</strong>
              </p>
            )}

            {/* Error live region */}
            <div aria-live="assertive">
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                  background: 'hsla(350, 85%, 55%, 0.12)',
                  border: '1px solid var(--accent-red)',
                  borderRadius: '8px', padding: '0.75rem 1rem',
                  color: 'var(--accent-red)', fontSize: '0.875rem',
                }}>
                  <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* New password */}
            <div className="form-group">
              <label htmlFor="reset-new-password" className="form-label">New Password</label>
              <div className="input-glow-wrapper">
                <Lock size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <label htmlFor="reset-confirm-password" className="form-label">Confirm Password</label>
              <div className="input-glow-wrapper">
                <Lock size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              id="reset-password-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Updating Password…</>
              ) : (
                'Set New Password'
              )}
            </button>
          </form>
        )}

        {/* Success state */}
        {pageState === 'success' && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 60, height: 60, borderRadius: '50%',
              background: 'hsla(145, 70%, 40%, 0.15)',
              border: '1px solid hsla(145, 70%, 40%, 0.4)',
              marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={28} style={{ color: 'var(--accent-green, #22c55e)' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Password Updated!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem', fontSize: '0.9rem' }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link href="/login">
              <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>
                Sign In
              </button>
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
