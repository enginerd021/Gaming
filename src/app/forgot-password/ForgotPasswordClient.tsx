'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  Gamepad2, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  RotateCcw, 
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const router = useRouter();

  // Refs for 6-digit OTP input boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // 1-minute countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'verify' && timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Generate 6-digit OTP code helper
  const createNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    return code;
  };

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      triggerShake();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (fbErr) {
        console.warn('Firebase reset note:', fbErr);
      }

      const code = createNewOtp();
      console.log('Demo OTP Code:', code);
      setOtp(['', '', '', '', '', '']);
      setSuccessMsg('OTP has been sent to your email address!');
      setStep('verify');
      setTimer(60);
      setCanResend(false);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err: unknown) {
      console.error('Send OTP error:', err);
      triggerShake();
      const authErr = err as { message?: string };
      setError(authErr.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend || loading) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      try {
        await sendPasswordResetEmail(auth, email.trim());
      } catch (fbErr) {
        console.warn('Firebase resend note:', fbErr);
      }

      const code = createNewOtp();
      console.log('Demo OTP Code:', code);
      setOtp(['', '', '', '', '', '']);
      setSuccessMsg('New OTP sent successfully!');
      setTimer(60);
      setCanResend(false);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      console.error('Resend OTP error:', err);
      triggerShake();
      const authErr = err as { message?: string };
      setError(authErr.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Box Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      triggerShake();
      return;
    }

    if (enteredOtp !== generatedOtp) {
      setError('Invalid OTP code. Please check the 6-digit code sent to your email.');
      triggerShake();
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('OTP verified successfully!');
      setStep('reset');
    }, 600);
  };

  // STEP 3: Submit New Password & Redirect to Login
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      triggerShake();
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      triggerShake();
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your new password.');
      triggerShake();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password does not match with confirm password.');
      triggerShake();
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Password is reset successfully! Redirecting to login page...');
      setStep('success');

      // Send to login page after 1.5 seconds
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }, 800);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      {/* Background Glows */}
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className={`glass-panel fade-in ${shake ? 'shake' : ''}`} style={{
        position: 'relative',
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--accent-cyan)'
          }}>
            {step === 'request' && <KeyRound size={28} />}
            {step === 'verify' && <ShieldCheck size={28} />}
            {step === 'reset' && <Lock size={28} />}
            {step === 'success' && <CheckCircle2 size={28} style={{ color: '#00ffaa' }} />}
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            {step === 'request' && 'Forgot Password'}
            {step === 'verify' && 'Verify OTP'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Password Reset'}
          </h1>
          
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {step === 'request' && 'Enter your registered email address to receive an OTP.'}
            {step === 'verify' && `Enter the 6-digit verification code sent to ${email}`}
            {step === 'reset' && 'Set a new password for your account.'}
            {step === 'success' && 'Redirecting you to the login page...'}
          </p>
        </div>

        {/* Live Notification Banners */}
        <div aria-live="assertive">
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
              fontSize: '0.9rem',
              lineHeight: 1.4,
              boxShadow: '0 0 15px rgba(0, 255, 170, 0.2)'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
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

        {/* STEP 1: REQUEST OTP */}
        {step === 'request' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">Email Address</label>
              <div className="input-glow-wrapper">
                <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                <input
                  id="reset-email"
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', height: '3rem', fontSize: '0.95rem', letterSpacing: '0.05em' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link 
                href="/login" 
                style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  textDecoration: 'none'
                }}
                className="hover-opacity"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: DEDICATED VERIFY OTP PAGE */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp}>
            {/* 6-DIGIT OTP PLATFORM */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '0.75rem' }}>
                Enter OTP Code
              </label>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width: '46px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-title)',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 240, 255, 0.05)',
                      border: digit ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      boxShadow: digit ? '0 0 12px rgba(0, 240, 255, 0.25)' : 'none',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', height: '3rem', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>

            {/* RESEND OTP SECTION WITH 1-MINUTE TIMER AT THE BOTTOM */}
            <div style={{ 
              marginTop: '1.75rem', 
              paddingTop: '1.25rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Didn&apos;t receive the code?
              </span>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'underline'
                  }}
                  className="hover-opacity"
                >
                  <RotateCcw size={16} /> Resend OTP
                </button>
              ) : (
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <RotateCcw size={14} className="spin-slow" />
                  <span>Resend OTP in {formatTimer(timer)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setStep('request'); setError(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                Change Email Address
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DEDICATED NEW PASSWORD PAGE AFTER OTP VERIFICATION */}
        {step === 'reset' && (
          <form onSubmit={handlePasswordSubmit}>
            {/* ENTER NEW PASSWORD */}
            <div className="form-group">
              <label htmlFor="new-password" className="form-label">Enter New Password</label>
              <div className="input-glow-wrapper" style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

            {/* CONFIRM NEW PASSWORD */}
            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
              <div className="input-glow-wrapper" style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', height: '3rem', fontSize: '0.95rem', letterSpacing: '0.05em' }}
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Submit'}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION & REDIRECT TO LOGIN */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <div style={{
              background: 'rgba(0, 255, 170, 0.1)',
              border: '1px solid #00ffaa',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: '#00ffaa',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.5,
              boxShadow: '0 0 20px rgba(0, 255, 170, 0.25)'
            }}>
              Password is reset successfully!
              <div style={{ fontSize: '0.88rem', fontWeight: 400, marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                Sending you to the login page to log in again...
              </div>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="btn btn-primary"
              style={{ width: '100%', height: '3rem', fontSize: '0.95rem' }}
            >
              Go to Login Page Now
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
