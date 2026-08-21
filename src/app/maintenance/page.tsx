'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, Shield, Zap, RefreshCw, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function MaintenancePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <GlassCard variant="panel" style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderRadius: '20px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'linear-gradient(135deg, rgba(16, 8, 36, 0.95) 0%, rgba(6, 14, 32, 0.95) 100%)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)'
        }} className="fade-in">
          
          {/* PULSING STATUS BADGE */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#F59E0B',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#F59E0B',
              boxShadow: '0 0 10px #F59E0B',
              animation: 'pulse 1.5s infinite'
            }} />
            SYSTEM MAINTENANCE IN PROGRESS
          </div>

          {/* ICON */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F59E0B',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
          }}>
            <Wrench size={34} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '0.75rem'
          }}>
            WE&apos;RE UPGRADING THE <span className="text-gradient-gold">ARENA</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.925rem',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: '0 auto 2rem auto'
          }}>
            SHAKTRIX servers are currently undergoing scheduled maintenance for database optimization, bracket engine acceleration, and real-time anti-cheat updates.
          </p>

          {/* MAINTENANCE STATS BANNER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            background: 'rgba(6, 12, 28, 0.7)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '2rem',
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
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>SYSTEM RELEASE</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={16} /> REFRESH PAGE
            </Button>

            <Link href="https://discord.gg" target="_blank">
              <Button
                variant="outline"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.85rem' }}
              >
                <MessageSquare size={16} /> DISCORD STATUS SERVER
              </Button>
            </Link>
          </div>

        </GlassCard>
      </div>
    </main>
  );
}
