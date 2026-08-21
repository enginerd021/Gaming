'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, MessageSquare, HeartHandshake, UserCheck, AlertOctagon, 
  Sparkles, ArrowRight, Search, CheckCircle2, Flag
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function CommunityGuidelinesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'sportsmanship' | 'chat' | 'fairplay' | 'reporting'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const guidelines = [
    {
      category: 'sportsmanship',
      categoryTitle: '1. Respect & Sportsmanship',
      icon: <HeartHandshake size={20} style={{ color: 'var(--accent-cyan)' }} />,
      items: [
        {
          title: 'Treat All Competitors with Integrity',
          desc: 'GG WP is more than a phrase. Respect team captains, opponents, referees, and audience members across all tournament stages regardless of skill level.'
        },
        {
          title: 'No Toxicity or Offensive Conduct',
          desc: 'Zero tolerance for hate speech, discrimination, slurs, harassment, or personal threats in match lobbies, voice channels, or global community spaces.'
        },
        {
          title: 'Graceful Defeat & Respectful Victory',
          desc: 'Celebrate wins without bm (bad-mannered) spamming, and accept losses professionally without toxicity or false accusations against organizers.'
        }
      ]
    },
    {
      category: 'chat',
      categoryTitle: '2. Chat & Voice Communication Protocol',
      icon: <MessageSquare size={20} style={{ color: 'var(--accent-violet)' }} />,
      items: [
        {
          title: 'Clean In-Game Match Chat',
          desc: 'Keep in-game chat focused on tactical communication and standard sportsmanship. Spamming text, screen-cluttering symbols, or offensive ASCII art is prohibited.'
        },
        {
          title: 'Global Lounge & Public Channels',
          desc: 'Self-promotion, malicious URLs, scam links, or NSFW content are strictly forbidden in public lounges and Discord integration channels.'
        },
        {
          title: 'Moderation Enforcement',
          desc: 'Automated filters and human moderators actively scan public channels. Violations result in chat mutes, match warnings, or account bans.'
        }
      ]
    },
    {
      category: 'fairplay',
      categoryTitle: '3. In-Game Honor Code & Match Etiquette',
      icon: <UserCheck size={20} style={{ color: 'var(--accent-gold)' }} />,
      items: [
        {
          title: 'Respect Technical Pause Limits',
          desc: 'If an opponent requests a technical pause due to disconnection, honor the official 10-minute pause window without forcing unpause exploits.'
        },
        {
          title: 'No Intentional Rage Quitting',
          desc: 'Abandoning a tournament match mid-game damages match integrity. Rage quitting results in automatic match forfeiture and a 7-day tournament cooldown.'
        },
        {
          title: 'Verified Roster Participation',
          desc: 'Only play on your registered account. Allowing unregistered friends or ringers to play on your handle is grounds for instant team disqualification.'
        }
      ]
    },
    {
      category: 'reporting',
      categoryTitle: '4. Reporting Violations & Support',
      icon: <Flag size={20} style={{ color: 'var(--accent-red)' }} />,
      items: [
        {
          title: 'Submitting Evidence-Based Reports',
          desc: 'Report toxicity or conduct breaches through the Match Detail dispute ticket system with video VOD links or clear un-edited screenshots.'
        },
        {
          title: 'Protection Against False Reports',
          desc: 'Submitting fake or fabricated evidence to sabotage opponent teams will result in severe penalties against the reporting party.'
        },
        {
          title: 'Referee Decisions & Escalation',
          desc: 'Official platform referees evaluate reports impartially. Decision appeals can be submitted to head admins within 24 hours of match conclusion.'
        }
      ]
    }
  ];

  const filteredSections = guidelines.filter(section => {
    if (activeTab !== 'all' && section.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      section.categoryTitle.toLowerCase().includes(q) ||
      section.items.some(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    );
  });

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
            <ShieldCheck size={14} /> PUBLIC GOVERNANCE & CONDUCT
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            COMMUNITY <span className="text-gradient-cyan">GUIDELINES</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '660px', margin: '0 auto', lineHeight: 1.55 }}>
            Our mission is to cultivate a fair, inclusive, and fiercely competitive esports community. Standard conduct rules apply to all players, team captains, and organizers.
          </p>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search community guidelines (e.g. toxicity, chat, pause, sportsmanship)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{
                borderRadius: '9999px',
                paddingLeft: '3.2rem'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {[
              { id: 'all', label: 'All Guidelines' },
              { id: 'sportsmanship', label: '1. Sportsmanship' },
              { id: 'chat', label: '2. Chat & Voice' },
              { id: 'fairplay', label: '3. Match Etiquette' },
              { id: 'reporting', label: '4. Reporting Rules' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' 
                    : 'rgba(6, 12, 28, 0.6)',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: activeTab === tab.id 
                    ? '1px solid rgba(255, 255, 255, 0.4)' 
                    : '1px solid var(--border-color)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* GUIDELINE SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
          {filteredSections.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No guidelines found matching &quot;{searchQuery}&quot;. Try adjusting your search keywords.
            </div>
          ) : (
            filteredSections.map((section, idx) => (
              <div
                key={idx}
                className="glass-panel fade-in"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 240, 255, 0.18)',
                  background: 'rgba(6, 12, 28, 0.85)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0, 240, 255, 0.12)', paddingBottom: '0.75rem' }}>
                  {section.icon}
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', fontFamily: 'var(--font-title)', letterSpacing: '0.04em', margin: 0 }}>
                    {section.categoryTitle}
                  </h2>
                </div>

                {/* Items */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {section.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(10, 18, 40, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}>
                        <CheckCircle2 size={16} />
                        <strong style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {item.title}
                        </strong>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM QUICK LINKS */}
        <div className="glass-panel" style={{
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(176, 38, 255, 0.25)',
          background: 'linear-gradient(135deg, rgba(16, 8, 36, 0.9) 0%, rgba(6, 14, 32, 0.9) 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '0.3rem', fontFamily: 'var(--font-title)' }}>
              COMPETITIVE GOVERNANCE & ANTI-CHEAT POLICIES
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Review our Acceptable Use Policy and Rulebook for detailed ban procedures and smurf restrictions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/acceptable-use">
              <Button variant="primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.825rem' }}>
                ACCEPTABLE USE POLICY <ArrowRight size={14} />
              </Button>
            </Link>
            <Link href="/about/rulebook">
              <Button variant="outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.825rem' }}>
                OFFICIAL RULEBOOK
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
