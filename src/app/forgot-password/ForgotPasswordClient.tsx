'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader, KeyRound } from 'lucide-react';

export default function ForgotPasswordClient() {
  const [email,      setEmail]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [shake,      setShake]      = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      triggerShake();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      // Always show the same generic message — do NOT reveal whether
      // the email exists in the system (prevents account enumeration).
      setSubmitted(true);
    } catch (err: unknown) {
      const authErr = err as { code?: string };
      if (authErr.code === 'auth/user-not-found') {
        // Suppress: show the same generic success message regardless.
        setSubmitted(true);
      } else if (authErr.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
        triggerShake();
      } else if (authErr.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before trying again.');
        triggerShake();
      } else {
        setError('Something went wrong. Please try again later.');
        triggerShake();
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
      padding: '7.5rem 1.5rem 4rem',
      overflow: 'hidden',
    }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div style={{ maxWidth: 460, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Back to login */}
        <Link
          href="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}
          className="hover-cyan"
        >
          <ArrowLeft size={15} /> Back to Login
        </Link>

        {/* Icon header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 68, height: 68, borderRadius: '50%',
            background: 'hsla(186, 100%, 50%, 0.12)',
            border: '1px solid hsla(186, 100%, 50%, 0.3)',
            marginBottom: '1.25rem',
          }}>
            <KeyRound size={30} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className={`glass-panel ${shake ? 'shake' : ''}`}
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
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

            {/* Email input */}
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">Email Address</label>
              <div className="input-glow-wrapper">
                <Mail size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input
                  id="forgot-email"
                  type="email"
                  className="glass-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              id="forgot-password-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Sending…</>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Remembered your password?{' '}
              <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </form>
        ) : (
          /* Success state */
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Check Your Inbox</h2>
            {/* Generic message — same regardless of whether email exists */}
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem', fontSize: '0.9rem' }}>
              If an account with <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> exists,
              a password reset link has been sent. Check your inbox and spam folder.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              The link expires after 1 hour. If you don't receive it, check your spam folder or try again.
            </p>
            <Link href="/login">
              <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>
                Back to Login
              </button>
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
