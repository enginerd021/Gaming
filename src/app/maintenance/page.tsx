'use client';

import React from 'react';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function MaintenancePage() {
  return (
    <main style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      overflow: 'hidden',
      backgroundColor: '#02040a',
    }}>
      {/* Background Decorative Glows */}
      <div className="hero-glow hero-glow-1" style={{ top: '-10%', left: '10%', transform: 'scale(1.5)', opacity: 0.15 }} />
      <div className="hero-glow hero-glow-2" style={{ bottom: '10%', right: '10%', transform: 'scale(1.5)', opacity: 0.15 }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '580px',
        textAlign: 'center',
        zIndex: 1,
      }} className="fade-in">
        
        {/* SHAKTRIX Logo */}
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 950,
          letterSpacing: '0.18em',
          color: '#fff',
          fontFamily: 'var(--font-title)',
          marginBottom: '2.5rem',
          textShadow: '0 0 15px rgba(0,240,255,0.4)',
        }}>
          SHAKT<span style={{ color: 'var(--accent-cyan)' }}>RIX</span>
        </div>

        {/* Warning Indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '12px',
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid var(--border-color)',
          color: 'var(--accent-cyan)',
          boxShadow: 'var(--border-glow)',
          marginBottom: '2rem',
          animation: 'pulseSkeleton 2s infinite ease-in-out'
        }}>
          <ShieldAlert size={30} />
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.75rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
          marginBottom: '1rem',
          fontFamily: 'var(--font-title)',
          lineHeight: '1.2'
        }}>
          Upgrading the Arena
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
          lineHeight: '1.6',
          maxWidth: '480px',
          margin: '0 auto 2rem',
          fontFamily: 'var(--font-body)',
        }}>
          The gaming network is undergoing scheduled hardware and software maintenance to enhance tournament synchronization and matchmaking speeds.
        </p>

        {/* Estimated Return Time Block */}
        <div className="glass-panel" style={{
          padding: '1rem 1.5rem',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '10px',
          background: 'rgba(10, 16, 36, 0.6)',
          display: 'inline-block',
          marginBottom: '2.5rem',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          color: 'var(--accent-cyan)',
          letterSpacing: '0.05em',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.05)'
        }}>
          ESTIMATED BACK ONLINE: AUGUST 21, 2026, 21:00 UTC
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <a href="https://discord.gg/shaktrix" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" style={{ padding: '0.8rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
              <MessageSquare size={18} />
              Join Discord Community
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}
