'use client';

import React from 'react';
import { MessageSquare, ShieldAlert, Clock, RefreshCw, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

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
        maxWidth: '600px',
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
          marginBottom: '2rem',
          textShadow: '0 0 15px rgba(0,240,255,0.4)',
        }}>
          SHAKT<span style={{ color: 'var(--accent-cyan)' }}>RIX</span>
        </div>

        <GlassCard variant="panel" style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderRadius: '20px',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          background: 'rgba(6, 14, 30, 0.95)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }} hoverable={false}>
          
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
            animation: 'pulseSkeleton 2s infinite ease-in-out'
          }}>
            <ShieldAlert size={30} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
            margin: 0,
            fontFamily: 'var(--font-title)',
            lineHeight: '1.2'
          }}>
            WE&apos;RE UPGRADING THE <span className="text-gradient-gold" style={{ background: 'linear-gradient(90deg, var(--accent-gold), #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ARENA</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            maxWidth: '480px',
            margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            The gaming network is undergoing scheduled hardware and software maintenance for database optimization, bracket engine acceleration, and real-time anti-cheat updates.
          </p>

          {/* Downtime Stats Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            background: 'rgba(6, 12, 28, 0.7)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(0, 240, 255, 0.1)',
            width: '100%',
            textAlign: 'center'
          }}>
            <div>
              <Clock size={18} style={{ color: 'var(--accent-cyan)', marginBottom: '0.2rem' }} />
              <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>~ 45 Mins</strong>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>ESTIMATED DOWNTIME</span>
            </div>
            <div>
              <Zap size={18} style={{ color: 'var(--accent-gold)', marginBottom: '0.2rem' }} />
              <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>v2.4.0</strong>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>RELEASE VERSION</span>
            </div>
          </div>

          {/* Estimated Return Time Block */}
          <div style={{
            padding: '0.8rem 1.2rem',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            borderRadius: '10px',
            background: 'rgba(10, 16, 36, 0.6)',
            width: '100%',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: 'var(--accent-cyan)',
            letterSpacing: '0.05em',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.05)'
          }}>
            ESTIMATED BACK ONLINE: AUGUST 21, 2026, 21:00 UTC
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> REFRESH ARENA
            </Button>

            <a href="https://discord.gg/shaktrix" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <MessageSquare size={16} /> DISCORD HUB
              </Button>
            </a>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
