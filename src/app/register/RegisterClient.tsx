'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Gamepad2, User, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function RegisterClient() {
  const [displayName, setDisplayName] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setInfoMsg('');
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

        // 1. Reserve gamertag document (Doc ID MUST match gamertag field for Firestore Security Rules)
        const claimRef = doc(db, "gamertags", cleanGamertag);
        await setDoc(claimRef, { uid: user.uid, rawGamertag: rawName });

        // 2. Create initial profile document
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

      const welcomeStr = `Welcome to SHAKTRIX, ${user.displayName || 'Gamer'}!`;
      setWelcomeMsg(welcomeStr);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shaktrix_welcome_msg', welcomeStr);
      }
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: unknown) {
      console.error('Google Sign Up error:', err);
      triggerShake();
      const gErr = err as { code?: string; message?: string };
      if (gErr.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is disabled in Firebase Console. Please enable Google under Authentication > Sign-in method.');
      } else if (gErr.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In in Firebase Console settings.');
      } else if (gErr.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else {
        setError(gErr.message || 'Google sign-up failed. Please check your network or try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    
    // Validations
    if (!displayName.trim() || !gamertag.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      triggerShake();
      return;
    }

    const cleanGamertag = gamertag.trim();
    if (cleanGamertag.length < 2 || cleanGamertag.length > 24) {
      setError('Gamertag / Game ID must be between 2 and 24 characters.');
      triggerShake();
      return;
    }

    if (cleanGamertag.includes('/') || cleanGamertag.includes('\\')) {
      setError('Gamertag / Game ID cannot contain slash characters.');
      triggerShake();
      return;
    }

    const docKey = encodeURIComponent(cleanGamertag.toLowerCase());

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }

    if (!acceptedTerms) {
      setError('Please agree to the Terms & Conditions to create an account.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      // 1. Check if Gamertag is unique in Firestore using the public /gamertags collection
      const gamertagDocRef = doc(db, "gamertags", docKey);
      const gamertagDocSnap = await getDoc(gamertagDocRef);
      
      if (gamertagDocSnap.exists()) {
        setError('This Gamertag / Game ID is already taken. Please choose another one.');
        triggerShake();
        setLoading(false);
        return;
      }

      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Send Email Verification Link
      try {
        await sendEmailVerification(user);
        setInfoMsg(`Verification email sent to ${email.trim()}. Please check your inbox.`);
      } catch (verErr) {
        console.error('Verification email error:', verErr);
      }

      // Force refresh user ID Token to ensure Firestore rules recognize auth immediately
      await user.getIdToken(true);

      // 3. Sequential Write: Claim the Gamertag document first
      const claimRef = doc(db, "gamertags", docKey);
      const claimSnap = await getDoc(claimRef);

      if (claimSnap.exists()) {
        const existingUid = claimSnap.data()?.uid;
        if (existingUid !== user.uid) {
          setError('This Gamertag / Game ID is already claimed by another user.');
          triggerShake();
          setLoading(false);
          return;
        }
      } else {
        await setDoc(claimRef, { uid: user.uid, rawGamertag: cleanGamertag });
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

      const welcomeStr = `Welcome to SHAKTRIX, ${cleanGamertag}! Your account was created successfully.`;
      setWelcomeMsg(welcomeStr);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shaktrix_welcome_msg', welcomeStr);
      }

      // Redirect to profile setup after a brief moment
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      triggerShake();
      const rErr = err as { code?: string; message?: string };
      if (rErr.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(rErr.message || 'An error occurred during registration.');
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

        {/* Assertive live region for validation error and info announcers */}
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

          {infoMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0, 255, 170, 0.12)',
              border: '1px solid var(--accent-green, #00ffaa)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: '#00ffaa',
              fontSize: '0.9rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{infoMsg}</span>
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

        <form onSubmit={handleRegister}>
          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="reg-displayname" className="form-label">Display Name</label>
            <div className="input-glow-wrapper">
              <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="reg-displayname"
                type="text"
                autoComplete="name"
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
                autoComplete="username"
                className="glass-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="e.g. Player#1234, Rioter, or [FaZe]Leader"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                disabled={loading}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Your unique Game ID or handle (Riot ID, Steam, Battle.net, Clan Tags allowed).
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
          <div className="form-group text-glow">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <div className="input-glow-wrapper" style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          {/* Terms & Conditions Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                id="reg-agree-terms"
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
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Google Sign-Up Option */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
