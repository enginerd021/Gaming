'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Shield, Trophy, Users, Target, ArrowRight, Award, Cpu, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PlatformMissionPage() {
  return (
    <main style={{ padding: '7.5rem 1.5rem 5rem 1.5rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HERO SECTION */}
        <div className="section-title fade-in" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            color: 'var(--neon-blue)',
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1rem'
          }}>
            <Sparkles size={16} /> THE METAGAME ARCHITECTURE
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            marginBottom: '1.25rem'
          }}>
            REDEFINING THE <span className="text-gradient-cyan">FUTURE OF ESPORTS</span>
          </h1>
          
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.2rem',
            maxWidth: '780px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            SHAKTRIX is engineered to empower amateur and professional esports athletes through automated bracket integrity, real-time match validation, and transparent competitive ecosystem.
          </p>
        </div>

        {/* STATS TICKER BANNER */}
        <div className="glass-panel card-hover" style={{
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.9) 0%, rgba(16, 8, 36, 0.9) 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          textAlign: 'center',
          marginBottom: '5rem'
        }}>
          <div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--neon-blue)', fontFamily: 'var(--font-title)' }}>
              &lt; 50ms
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Real-Time Bracket Latency
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--neon-purple)', fontFamily: 'var(--font-title)' }}>
              100%
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Verified Anti-Cheat & Gamertags
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--neon-blue)', fontFamily: 'var(--font-title)' }}>
              24 / 7
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Automated Dispute Logging
            </div>
          </div>

          <div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-gold)', fontFamily: 'var(--font-title)' }}>
              PRO
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Grassroots Tournament Ladder
            </div>
          </div>
        </div>

        {/* THREE CORE PILLARS */}
        <div style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
              OUR THREE <span className="text-gradient-violet">MISSION PILLARS</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* Pillar 1 */}
            <div className="glass-card card-hover" style={{
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              background: 'rgba(6, 12, 28, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid var(--neon-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-blue)'
              }}>
                <Cpu size={28} />
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>
                AUTOMATED BRACKET INTEGRITY
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.98rem' }}>
                No manual delay or referee favoritism. Our custom tournament engine validates match scores, auto- advances winning teams, and updates public brackets instantly in real time.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="glass-card card-hover" style={{
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(176, 38, 255, 0.2)',
              background: 'rgba(6, 12, 28, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(176, 38, 255, 0.15)',
                border: '1px solid var(--neon-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-purple)'
              }}>
                <Shield size={28} />
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>
                FAIR PLAY & ANTI-CHEAT
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.98rem' }}>
                Every player profile requires a verified unique Gamertag and Game ID mapping. Anti-smurf and anti-cheat policies protect competitive integrity across all match brackets.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="glass-card card-hover" style={{
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              background: 'rgba(6, 12, 28, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)'
              }}>
                <Trophy size={28} />
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>
                GRASSROOTS TO PRO
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.98rem' }}>
                Bridging the gap between casual gamers and professional esports organizations. Compete in daily scrims, build roster rankings, and get discovered by top tier teams.
              </p>
            </div>

          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="glass-panel" style={{
          padding: '3.5rem 2rem',
          borderRadius: '24px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.12) 0%, rgba(4, 9, 20, 0.9) 70%)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-title)', color: '#fff' }}>
            READY TO JOIN THE <span className="text-gradient-cyan">COMPETITION?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Create your player profile, register your squad, and compete for victory in our upcoming tournaments.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link href="/tournaments">
              <Button variant="primary" style={{ padding: '0.85rem 2rem', borderRadius: '9999px' }}>
                EXPLORE TOURNAMENTS <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/about/rulebook">
              <Button variant="outline" style={{ padding: '0.85rem 2rem', borderRadius: '9999px' }}>
                READ RULEBOOK
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
