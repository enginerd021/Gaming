'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Users, Award, ArrowUpRight, Zap, Play } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export function BentoGrid() {
  return (
    <section className="section-padding" style={{ position: 'relative', zIndex: 2 }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            <Zap size={16} /> THE METAGAME ARCHITECTURE
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
            POWERING THE <span className="text-gradient-cyan">FUTURE OF ESPORTS</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          
          {/* Bento Card 1: Live Bracket Engine (Span 8) */}
          <article className="bento-card bento-col-8">
            
            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <Badge variant="live" style={{ marginBottom: '1rem' }}>
                  REAL-TIME SYNC
                </Badge>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  AUTOMATED BRACKET ENGINE
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '1rem', lineHeight: 1.6 }}>
                  Instant match resolution, single & double elimination brackets, automated score validation, and live tournament seeding.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                <Link href="/tournaments">
                  <Button variant="primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px' }}>
                    <Trophy size={16} />
                    EXPLORE BRACKETS
                    <ArrowUpRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </article>

          {/* Bento Card 2: Squad Builder (Span 4) */}
          <article className="bento-card bento-col-4" style={{ borderTop: '4px solid var(--accent-violet)' }}>
            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <div style={{ background: 'var(--bg-secondary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)', border: '1px solid var(--border-glow-violet)', marginBottom: '1.25rem' }}>
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  PRO SQUAD BUILDER
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Assemble your roster, recruit top gamertags by role preference, and manage team captains with invite notifications.
                </p>
              </div>

              <Link href="/teams" style={{ marginTop: '2rem' }}>
                <Button variant="outline" style={{ width: '100%', justifyContent: 'center', borderRadius: '9999px' }}>
                  BUILD ROSTER
                </Button>
              </Link>
            </div>
          </article>

          {/* Bento Card 3: Real-time Live Spectate Arena (Span 4) */}
          <article className="bento-card bento-col-4" style={{ borderTop: '4px solid var(--accent-gold)' }}>

            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
              <div>
                <Badge variant="gold" style={{ marginBottom: '1rem' }}>
                  LIVE STREAM
                </Badge>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  SPECTATOR ARENA
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Watch tournament matches unfold live with real-time updates and commentary feeds.
                </p>
              </div>

              <Link href="/tournaments" style={{ marginTop: '2rem' }}>
                <Button variant="outline" style={{ width: '100%', justifyContent: 'center', borderRadius: '9999px' }}>
                  <Play size={14} fill="currentColor" /> SPECTATE NOW
                </Button>
              </Link>
            </div>
          </article>

          {/* Bento Card 4: Hall of Fame XP Leaderboard (Span 8) */}
          <article className="bento-card bento-col-8">
            <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <Badge variant="cyan">HALL OF FAME</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>REAL-TIME XP STREAM</span>
                </div>
                
                <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  GLOBAL PLAYER & TEAM RANKINGS
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Track performance XP points, tournament victories, and individual gamertag skill rankings updated live from Cloud Firestore.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <Link href="/leaderboard">
                  <Button variant="primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px' }}>
                    <Award size={16} />
                    VIEW LEADERBOARD
                    <ArrowUpRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </article>

        </div>

      </div>
    </section>
  );
}

export default BentoGrid;
