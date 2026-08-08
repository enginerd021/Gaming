'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle, 
  Loader, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X, 
  Zap,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

export default function SetupGamerIdClient() {
  const router = Router();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [gamertag, setGamertag] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);

  function Router() {
    return useRouter();
  }

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  // 1. Listen for Auth State & check existing profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthChecking(false);
        router.push('/login');
        return;
      }

      setCurrentUser(user);

      try {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          // Profile already set up, redirect to profile page
          router.push('/profile');
          return;
        }
      } catch (err) {
        console.error("Error checking existing profile:", err);
      } finally {
        setAuthChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  // 2. Generate smart Gamer ID suggestions based on Google user info
  const suggestions = useMemo(() => {
    if (!currentUser) return [];
    const baseName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Gamer';
    const cleanBase = baseName.replace(/[^a-zA-Z0-9_]/g, '') || 'Gamer';
    const randNum = Math.floor(10 + Math.random() * 90);
    
    return Array.from(new Set([
      cleanBase,
      `${cleanBase}_${randNum}`,
      `Pro_${cleanBase}`,
      `xX_${cleanBase}_Xx`,
      `Viper_${cleanBase}`
    ])).slice(0, 4);
  }, [currentUser]);

  // 3. Validate & check availability in Firestore (Debounced)
  const checkAvailability = useCallback(async (tagValue: string) => {
    const cleanTag = tagValue.trim();

    if (!cleanTag) {
      setStatus('idle');
      setErrorMsg('');
      return;
    }

    if (cleanTag.length < 2 || cleanTag.length > 24) {
      setStatus('invalid');
      setErrorMsg('Gamer ID must be between 2 and 24 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanTag)) {
      setStatus('invalid');
      setErrorMsg('Only letters, numbers, and underscores are allowed.');
      return;
    }

    setStatus('checking');
    setErrorMsg('');

    try {
      const docKey = encodeURIComponent(cleanTag.toLowerCase());
      const tagRef = doc(db, "gamertags", docKey);
      const tagSnap = await getDoc(tagRef);

      if (tagSnap.exists()) {
        const existingUid = tagSnap.data()?.uid;
        if (currentUser && existingUid === currentUser.uid) {
          setStatus('available');
        } else {
          setStatus('taken');
          setErrorMsg('This Gamer ID is already claimed by another player.');
        }
      } else {
        setStatus('available');
      }
    } catch (err) {
      console.error("Error checking gamertag availability:", err);
      setStatus('idle');
    }
  }, [currentUser]);

  // Debounce gamertag input changes
  useEffect(() => {
    if (!gamertag) {
      setStatus('idle');
      setErrorMsg('');
      return;
    }

    const timer = setTimeout(() => {
      checkAvailability(gamertag);
    }, 350);

    return () => clearTimeout(timer);
  }, [gamertag, checkAvailability]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanTag = gamertag.trim();
    if (!cleanTag || status === 'invalid' || status === 'taken' || status === 'checking') {
      triggerShake();
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const docKey = encodeURIComponent(cleanTag.toLowerCase());
      const tagRef = doc(db, "gamertags", docKey);
      const tagSnap = await getDoc(tagRef);

      if (tagSnap.exists() && tagSnap.data()?.uid !== currentUser.uid) {
        setStatus('taken');
        setErrorMsg('This Gamer ID was just claimed! Please choose another one.');
        triggerShake();
        setSubmitting(false);
        return;
      }

      // 1. Claim gamertag document
      await setDoc(tagRef, {
        uid: currentUser.uid,
        rawGamertag: cleanTag,
        createdAt: Date.now()
      });

      // 2. Create profile document
      const rawDisplayName = currentUser.displayName || currentUser.email?.split('@')[0] || cleanTag;
      const profileRef = doc(db, "profiles", currentUser.uid);
      await setDoc(profileRef, {
        uid: currentUser.uid,
        gamertag: cleanTag,
        displayName: rawDisplayName,
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

      setSuccess(true);
      const welcomeStr = `Welcome to SHAKTRIX, ${cleanTag}! Your Gamer ID is active.`;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shaktrix_welcome_msg', welcomeStr);
      }

      setTimeout(() => {
        router.push('/profile');
      }, 1200);
    } catch (err: unknown) {
      console.error("Error creating profile:", err);
      const errorObj = err as { message?: string };
      setErrorMsg(errorObj.message || 'Failed to save Gamer ID. Please try again.');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div 
        style={{ 
          minHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <Loader className="animate-spin" size={42} style={{ color: '#00f0ff', marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          VERIFYING GOOGLE ACCOUNT...
        </p>
      </div>
    );
  }

  return (
    <main 
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Ambient Background Glows */}
      <div 
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, rgba(138, 43, 226, 0.08) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      <div 
        className={shaking ? 'shake-animation' : ''}
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-secondary, rgba(15, 23, 42, 0.75))',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.08)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Top Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              color: '#00f0ff',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}
          >
            <Zap size={14} /> STEP 2 OF 2 &bull; GAMER IDENTITY
          </div>

          <h1 
            style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '0.75rem',
              background: 'linear-gradient(135deg, #FFFFFF 30%, #00f0ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            CLAIM YOUR GAMER ID
          </h1>

          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Choose a unique player tag to represent yourself across tournaments, teams, and public leaderboards.
          </p>
        </div>

        {/* Google User Identity Info Card */}
        {currentUser && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              marginBottom: '2rem'
            }}
          >
            {currentUser.photoURL ? (
              // eslint-disable-next-next/no-img-element
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'Google Profile'} 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid #00f0ff',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.2rem'
                }}
              >
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon size={20} />}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }} className="truncate">
                  {currentUser.displayName || 'Google User'}
                </span>
                <ShieldCheck size={16} style={{ color: '#00f0ff', flexShrink: 0 }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }} className="truncate block">
                {currentUser.email}
              </span>
            </div>

            <div 
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              Google Auth ✓
            </div>
          </div>
        )}

        {/* Gamer ID Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label 
              htmlFor="gamertag-input"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary, #94a3b8)',
                marginBottom: '0.6rem'
              }}
            >
              Your Custom Gamer ID / Handle
            </label>

            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary, #64748b)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Gamepad2 size={20} />
              </div>

              <input 
                id="gamertag-input"
                type="text"
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                placeholder="e.g. ShadowViper_99"
                maxLength={24}
                disabled={submitting || success}
                style={{
                  width: '100%',
                  padding: '0.85rem 3rem 0.85rem 3rem',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                  background: 'var(--bg-primary, rgba(2, 4, 10, 0.6))',
                  border: status === 'available' 
                    ? '2px solid #10b981' 
                    : status === 'taken' || status === 'invalid' 
                    ? '2px solid #ef4444' 
                    : '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-primary, #ffffff)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: status === 'available' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              />

              {/* Status Indicator Icon inside Input */}
              <div 
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {status === 'checking' && (
                  <Loader className="animate-spin" size={18} style={{ color: '#00f0ff' }} />
                )}
                {status === 'available' && (
                  <Check size={20} style={{ color: '#10b981' }} />
                )}
                {(status === 'taken' || status === 'invalid') && (
                  <X size={20} style={{ color: '#ef4444' }} />
                )}
              </div>
            </div>

            {/* Availability / Error Feedback Box */}
            <div style={{ marginTop: '0.6rem', minHeight: '24px' }}>
              {status === 'checking' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#00f0ff' }}>
                  <Sparkles size={14} className="animate-pulse" />
                  <span>Checking availability across SHAKTRIX database...</span>
                </div>
              )}

              {status === 'available' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  <span>Gamer ID is available!</span>
                </div>
              )}

              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {status === 'idle' && !errorMsg && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                  Must be 2–24 characters. Alphanumeric & underscores only.
                </span>
              )}
            </div>
          </div>

          {/* Smart Suggestions Chips */}
          {suggestions.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suggested Gamer IDs:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setGamertag(sug);
                      checkAvailability(sug);
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      background: gamertag === sug ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: gamertag === sug ? '1px solid #00f0ff' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                      color: gamertag === sug ? '#00f0ff' : 'var(--text-primary, #e2e8f0)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    +{sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || success || status === 'invalid' || status === 'taken' || status === 'checking' || !gamertag.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: success
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: (submitting || success || status === 'invalid' || status === 'taken' || status === 'checking' || !gamertag.trim()) ? 'not-allowed' : 'pointer',
              opacity: (submitting || success || status === 'invalid' || status === 'taken' || status === 'checking' || !gamertag.trim()) ? 0.65 : 1,
              boxShadow: '0 8px 25px rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>CLAIMING GAMER ID...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 size={20} />
                <span>PROFILE CREATED! REDIRECTING...</span>
              </>
            ) : (
              <>
                <span>CLAIM GAMER ID & LAUNCH</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </main>
  );
}
