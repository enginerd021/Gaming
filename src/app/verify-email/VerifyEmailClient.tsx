'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Mail, RefreshCw, Send, CheckCircle2, AlertCircle, Loader, LogOut } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailClient() {
  const user    = useAppStore((state) => state.user);
  const loading = useAppStore((state) => state.loading);
  const logout  = useAppStore((state) => state.logout);
  const router  = useRouter();

  const [resendCooldown,  setResendCooldown]  = useState(0);
  const [resendLoading,   setResendLoading]   = useState(false);
  const [refreshLoading,  setRefreshLoading]  = useState(false);
  const [error,           setError]           = useState('');
  const [resendSuccess,   setResendSuccess]   = useState(false);

  // Count-down timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // If there's no user at all, send to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // If user is already verified (e.g. they come back after clicking link), send them home
  useEffect(() => {
    if (user?.emailVerified) {
      router.replace('/');
    }
  }, [user, router]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || resendLoading) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setResendLoading(true);
    setError('');
    setResendSuccess(false);
    try {
      await sendEmailVerification(currentUser);
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before resending.');
      } else {
        setError(err?.message || 'Failed to send verification email. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  }, [resendCooldown, resendLoading]);

  const handleRefresh = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || refreshLoading) return;

    setRefreshLoading(true);
    setError('');
    try {
      // Firebase does NOT push real-time updates for emailVerified —
      // we must manually reload the user object from the server.
      await reload(currentUser);
      if (currentUser.emailVerified) {
        // Force auth state to update in the store by getting a fresh token
        await currentUser.getIdToken(true);
        router.replace('/');
      } else {
        setError("Email not verified yet. Please click the link in your inbox first, then try again.");
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh status. Please try again.');
    } finally {
      setRefreshLoading(false);
    }
  }, [refreshLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 4.5rem)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Checking session…</p>
      </div>
    );
  }

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

      <div style={{ maxWidth: 480, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Icon header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'hsla(186, 100%, 50%, 0.12)',
            border: '1px solid hsla(186, 100%, 50%, 0.3)',
            marginBottom: '1.25rem',
          }}>
            <Mail size={32} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Verify Your Email</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We sent a verification link to
          </p>
          <p style={{
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            wordBreak: 'break-all',
            marginTop: '0.25rem',
          }}>
            {user.email}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Click the link in that email to activate your account. Check your spam folder if you don't see it.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Error / Success live regions */}
          <div aria-live="polite">
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
            {resendSuccess && !error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                background: 'hsla(145, 70%, 40%, 0.12)',
                border: '1px solid var(--accent-green, #22c55e)',
                borderRadius: '8px', padding: '0.75rem 1rem',
                color: 'var(--accent-green, #22c55e)', fontSize: '0.875rem',
              }}>
                <CheckCircle2 size={16} />
                <span>Verification email resent! Check your inbox.</span>
              </div>
            )}
          </div>

          {/* Refresh status button — primary action */}
          <button
            id="verify-email-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshLoading}
            className="btn btn-primary"
            style={{ width: '100%', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {refreshLoading ? (
              <><Loader size={16} className="animate-spin" /> Checking…</>
            ) : (
              <><RefreshCw size={16} /> I've Verified — Refresh Status</>
            )}
          </button>

          {/* Resend button */}
          <button
            id="verify-email-resend-btn"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={{
              width: '100%',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: '1px solid hsla(186, 100%, 50%, 0.35)',
              borderRadius: '8px',
              color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-cyan)',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {resendLoading ? (
              <><Loader size={16} className="animate-spin" /> Sending…</>
            ) : resendCooldown > 0 ? (
              <><Send size={16} /> Resend in {resendCooldown}s</>
            ) : (
              <><Send size={16} /> Resend Verification Email</>
            )}
          </button>

          {/* Divider */}
          <div style={{ borderTop: '1px solid hsla(255,255%,255%,0.06)', margin: '0.25rem 0' }} />

          {/* Sign out link */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.25rem',
            }}
          >
            <LogOut size={14} /> Sign out and use a different account
          </button>
        </div>

      </div>
    </main>
  );
}
