'use client';

import React from 'react';
import Link from 'next/link';
import { Key, ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function SessionExpiredPage() {
  return (
    <main style={{
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '7.5rem 1.5rem 4rem 1.5rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <GlassCard variant="panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center',
        borderRadius: '20px',
        border: '1px solid rgba(255, 60, 60, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 60, 60, 0.15)'
      }} className="fade-in">
        
        {/* GLOWING ICON */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: 'rgba(255, 60, 60, 0.12)',
          border: '1px solid var(--accent-red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-red)',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 0 20px rgba(255, 60, 60, 0.3)'
        }}>
          <Key size={32} />
        </div>

        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 900,
          fontFamily: 'var(--font-title)',
          textTransform: 'uppercase',
          color: '#ffffff',
          marginBottom: '0.5rem'
        }}>
          SESSION <span className="text-gradient-cyan">EXPIRED</span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          lineHeight: 1.55,
          marginBottom: '2rem'
        }}>
          Your 2-hour security session or Firebase authentication token has expired. Please log back in to access your profile, active tournament brackets, and team lounge.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/login?reason=session_expired">
            <Button variant="primary" style={{ width: '100%', padding: '0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
              <LogIn size={16} /> LOG BACK IN NOW
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" style={{ width: '100%', padding: '0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
              RETURN TO HOMEPAGE <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
