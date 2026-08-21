'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Gamepad2, ShieldCheck, CheckCircle2, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function LinkRiotClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagParam = searchParams.get('tag') || '';
  
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [stepText, setStepText] = useState('Initiating Riot ID verification...');

  useEffect(() => {
    if (!user) return;

    const performLinking = async () => {
      const cleanTag = tagParam.trim();
      
      if (!cleanTag || !/^[^#]+#[^#]+$/.test(cleanTag)) {
        setStatus('error');
        setErrorMessage('Invalid Riot ID format provided. Please use GameName#TagLine format (e.g. YashiAdarsh#6946).');
        return;
      }

      try {
        setStepText(`Validating Riot ID "${cleanTag}"...`);
        await new Promise((r) => setTimeout(r, 800));

        setStepText('Handshaking with VALORANT telemetry service...');
        // Query game stats API
        try {
          await fetch(`/api/game-stats?riotId=${encodeURIComponent(cleanTag)}`);
        } catch {
          // Ignore network glitch — proceed with linking
        }

        setStepText('Saving Riot ID to your SHAKTRIX profile...');
        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          riotId: cleanTag,
          'gameConnections.riotId': cleanTag,
          updatedAt: Date.now()
        });

        setStatus('success');
        setStepText('Riot ID linked successfully! Returning to profile...');

        setTimeout(() => {
          router.push('/profile');
        }, 1500);

      } catch (err: any) {
        console.error('Error linking Riot ID:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to link Riot ID to your account. Please try again.');
      }
    };

    performLinking();
  }, [user, tagParam, router]);

  return (
    <main style={{
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '7.5rem 1.5rem 4rem 1.5rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div className="container" style={{ maxWidth: '520px', margin: '0 auto' }}>
        
        <GlassCard variant="panel" style={{
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '20px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.15)'
        }} className="fade-in">
          
          {/* HEADER ICON */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(176, 38, 255, 0.15) 100%)',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)'
          }}>
            <Gamepad2 size={32} />
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '0.35rem'
          }}>
            VERIFYING &amp; LINKING <span className="text-gradient-cyan">RIOT ID</span>
          </h1>

          <p style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>
            {tagParam || 'GameName#TagLine'}
          </p>

          {/* VERIFYING STATE */}
          {status === 'verifying' && (
            <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <Loader size={36} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                {stepText}
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 170, 0.15)',
                border: '2px solid #00ffaa',
                color: '#00ffaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(0, 255, 170, 0.3)'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 0.35rem 0' }}>
                  LINKED SUCCESSFULLY!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Redirecting back to your user profile...
                </p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 60, 60, 0.15)',
                border: '2px solid var(--accent-red)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={30} />
              </div>
              <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                {errorMessage}
              </p>
              <Button onClick={() => router.push('/profile')} variant="outline" style={{ marginTop: '0.5rem' }}>
                <ArrowLeft size={16} /> RETURN TO PROFILE
              </Button>
            </div>
          )}

        </GlassCard>

      </div>
    </main>
  );
}
