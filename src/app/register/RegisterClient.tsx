'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/authUtils';
import { Gamepad2, User, Mail, Lock, AlertCircle } from 'lucide-react';

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

export default function RegisterClient() {
  const [displayName, setDisplayName] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (!displayName.trim() || !gamertag.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      triggerShake();
      return;
    }

    const cleanGamertag = gamertag.trim().toLowerCase();
    const gamertagRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!gamertagRegex.test(cleanGamertag)) {
      setError('Gamertag must be 3-15 characters and contain only alphanumeric characters and underscores.');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      // 1. Check if Gamertag is unique in Firestore using the public /gamertags collection
      const gamertagDocRef = doc(db, "gamertags", cleanGamertag);
      const gamertagDocSnap = await getDoc(gamertagDocRef);
      
      if (gamertagDocSnap.exists()) {
        setError('This gamertag is already taken. Please choose another one.');
        triggerShake();
        setLoading(false);
        return;
      }

      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Force refresh user ID Token to ensure Firestore rules recognize auth immediately
      await user.getIdToken(true);

      // 3. Sequential Write: Claim the Gamertag document first
      const claimRef = doc(db, "gamertags", cleanGamertag);
      const claimSnap = await getDoc(claimRef);

      if (claimSnap.exists()) {
        const existingUid = claimSnap.data()?.uid;
        if (existingUid !== user.uid) {
          setError('This gamertag is already claimed by another user.');
          triggerShake();
          setLoading(false);
          return;
        }
      } else {
        await setDoc(claimRef, { uid: user.uid });
      }

      // 4. Sequential Write: Create the profile document
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        uid: user.uid,
        gamertag: cleanGamertag,
        displayName: displayName.trim(),
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

      // Redirect to profile setup
      router.push('/profile');
    } catch (err: any) {
      console.error('Registration error:', err);
      triggerShake();
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err.message || 'An error occurred during registration.');
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
        maxWidth: '480px',
        padding: '2.5rem',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Gamepad2 size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ fontSize: '0.95rem' }}>Join the ultimate gaming & esports community</p>
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

        <form onSubmit={handleRegister}>
          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="reg-displayname" className="form-label">Display Name</label>
            <div className="input-glow-wrapper">
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="reg-displayname"
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="e.g. John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Gamertag (Username) */}
          <div className="form-group">
            <label htmlFor="reg-gamertag" className="form-label">Unique Gamertag</label>
            <div className="input-glow-wrapper">
              <span style={{ position: 'absolute', left: '1rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>@</span>
              <input
                id="reg-gamertag"
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="gamertag (alphanumeric & _)"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                disabled={loading}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Used to invite you to teams. Must be unique.
            </p>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <div className="input-glow-wrapper">
              <Mail size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="reg-email"
                type="email"
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
          <div className="form-group text-glow">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="input-glow-wrapper">
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                type="password"
                className="glass-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', height: '3rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn"
          style={{
            width: '100%',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          disabled={loading}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'var(--neon-blue)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(var(--accent-cyan-rgb), 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
