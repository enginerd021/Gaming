'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Trophy, ArrowRight, Cpu, Sparkles, Zap, Layers, Target, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';

export default function PlatformMissionPage() {
  const [activeSection, setActiveSection] = useState<'pillars' | 'architecture' | 'roadmap'>('pillars');

  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HERO HEADER */}
        <div className="section-title fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            color: 'var(--accent-cyan)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} /> ABOUT SHAKTRIX ESPORTS
          </div>
          
          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            lineHeight: 1.1,
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            REDEFINING THE <span className="text-gradient-cyan">FUTURE OF ESPORTS</span>
          </h1>
          
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.925rem',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.55
          }}>
            SHAKTRIX is engineered to empower competitive players and grassroots teams through automated bracket integrity, real-time match validation, and a transparent esports ecosystem.
          </p>
        </div>

        {/* COMPACT STATS TICKER BANNER */}
        <div className="glass-panel card-hover" style={{
          padding: '1.5rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.9) 0%, rgba(16, 8, 36, 0.9) 100%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-title)' }}>
              &lt; 50ms
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              Real-Time Sync Latency
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-violet)', fontFamily: 'var(--font-title)' }}>
              100%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              Verified Gamertag Mapping
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-title)' }}>
              24 / 7
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              Automated Score Validation
            </div>
          </div>

          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-gold)', fontFamily: 'var(--font-title)' }}>
              PRO
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              Competitive Ladder System
            </div>
          </div>
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { id: 'pillars', label: 'Mission Pillars', icon: <Target size={14} /> },
            { id: 'architecture', label: 'Platform Architecture', icon: <Cpu size={14} /> },
            { id: 'roadmap', label: 'Ecosystem Standards', icon: <Layers size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeSection === tab.id 
                  ? 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' 
                  : 'rgba(6, 12, 28, 0.6)',
                color: activeSection === tab.id ? '#ffffff' : 'var(--text-secondary)',
                border: activeSection === tab.id ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border-color)'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        {activeSection === 'pillars' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            
            {/* Pillar 1 */}
            <GlassCard variant="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Cpu size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Automated Bracket Engine
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                No manual delay or referee favoritism. Our tournament engine validates match scores, auto-advances winning teams, and updates public brackets in real time.
              </p>
            </GlassCard>

            {/* Pillar 2 */}
            <GlassCard variant="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(176, 38, 255, 0.12)', border: '1px solid var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)' }}>
                <Shield size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Fair Play & Anti-Cheat
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                Every player profile requires a verified unique Gamertag and Game ID mapping. Anti-smurf and anti-cheat policies protect competitive integrity across all matches.
              </p>
            </GlassCard>

            {/* Pillar 3 */}
            <GlassCard variant="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 215, 0, 0.12)', border: '1px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                <Trophy size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Grassroots To Pro Ladder
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                Bridging the gap between casual gamers and professional esports organizations. Build squad rosters, climb leaderboards, and get discovered by top teams.
              </p>
            </GlassCard>

          </div>
        )}

        {activeSection === 'architecture' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            <GlassCard variant="panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
                <Zap size={18} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Real-Time Firestore Streams</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Scores, live chat lounge messages, and registered team rosters update across browsers in under 50 milliseconds via native WebSocket listeners.
              </p>
            </GlassCard>

            <GlassCard variant="panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-violet)' }}>
                <Shield size={18} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Atomic Security Locks</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Strict security rules prevent unauthorized score modification. Only designated team captains and organizers can submit match outcomes.
              </p>
            </GlassCard>
          </div>
        )}

        {activeSection === 'roadmap' && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase' }}>
              Competitive Governance Principles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { title: 'Zero Tolerance Toxicity', desc: 'Strict sportsmanship enforcement in all match rooms and global chat.' },
                { title: 'Single Verified Gamertag', desc: 'No multi-account smurfing. Each user is tied to one unique Game ID.' },
                { title: 'Transparent Match History', desc: 'Every dispute and score validation log is saved and audit ready.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--text-primary)' }}>{item.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALL TO ACTION BANNER */}
        <GlassCard variant="panel" style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          border: '1px solid rgba(0, 240, 255, 0.25)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
            READY TO JOIN THE <span className="text-gradient-cyan">COMPETITION?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', fontSize: '0.9rem', lineHeight: 1.55 }}>
            Create your player profile, assemble your squad, and compete in live tournament brackets.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.25rem' }}>
            <Link href="/tournaments">
              <Button variant="primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                EXPLORE TOURNAMENTS <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/about/rulebook">
              <Button variant="outline" style={{ padding: '0.65rem 1.5rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                READ RULEBOOK
              </Button>
            </Link>
          </div>
        </GlassCard>

      </div>
    </main>
  );
}
