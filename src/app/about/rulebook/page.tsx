'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ArrowRight, Search } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function RulebookPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'conduct' | 'roster' | 'match' | 'anticheat' | 'disputes'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rulesData = [
    {
      category: 'conduct',
      categoryTitle: 'Section 1: General Code of Conduct',
      icon: <CheckCircle2 size={20} style={{ color: 'var(--neon-blue)' }} />,
      rules: [
        {
          title: '1.1 Professional Sportsmanship',
          content: 'All players, team captains, and substitutes must maintain respectful sportsmanship toward opponents, tournament referees, and community members at all times.'
        },
        {
          title: '1.2 Toxic Behavior & Harassment Penalty',
          content: 'Zero tolerance for hate speech, discriminatory language, excessive toxicity, or harassment in match chat, voice channels, or the SHAKTRIX Global Lounge. Violators face immediate match forfeiture and 30-day account suspension.'
        },
        {
          title: '1.3 Gamertag & Naming Policy',
          content: 'Player Gamertags and Team Names must not contain profane, vulgar, or impersonating language. Offensive names will be forcefully renamed and subject to roster bans.'
        }
      ]
    },
    {
      category: 'roster',
      categoryTitle: 'Section 2: Roster & Registration Protocols',
      icon: <FileText size={20} style={{ color: 'var(--neon-purple)' }} />,
      rules: [
        {
          title: '2.1 Team Captain Authorization',
          content: 'Only the designated Team Captain can submit tournament registrations, invite squad members, and confirm match result scores.'
        },
        {
          title: '2.2 Substitute Player Limit',
          content: 'Teams may register up to 2 official substitute players prior to the tournament start time. Unregistered stand-in players are strictly prohibited during live match play.'
        },
        {
          title: '2.3 Multi-Account & Smurfing Lock',
          content: 'Players may only participate under a single verified SHAKTRIX account. Playing on an alt/smurf account or competing for multiple teams in the same tournament results in instant team disqualification.'
        }
      ]
    },
    {
      category: 'match',
      categoryTitle: 'Section 3: Match Execution & Disconnection Rules',
      icon: <BookOpen size={20} style={{ color: 'var(--accent-gold)' }} />,
      rules: [
        {
          title: '3.1 Check-In & Timeliness',
          content: 'Both teams must check into the match room within 15 minutes of the scheduled match time. Failure to check in results in an automatic default loss (FF).'
        },
        {
          title: '3.2 Map Pick/Veto Protocol',
          content: 'Map bans and picks must follow the official tournament match format (Best of 1 or Best of 3 veto sequence). The higher seed team starts map veto choice.'
        },
        {
          title: '3.3 Technical Disconnect Grace Period',
          content: 'If a player disconnects during a live match, a maximum 10-minute technical pause is allowed per team. Matches must resume once the player reconnects or a registered sub enters.'
        },
        {
          title: '3.4 Match Result Screenshot Submission',
          content: 'Winning team captains must capture and submit a clear end-of-game victory scoreboard screenshot for score validation.'
        }
      ]
    },
    {
      category: 'anticheat',
      categoryTitle: 'Section 4: Anti-Cheat & Exploit Policy',
      icon: <ShieldAlert size={20} style={{ color: 'var(--accent-red)' }} />,
      rules: [
        {
          title: '4.1 Prohibited Software & Hacks',
          content: 'Use of aimbots, wallhacks, triggerbots, radar hacks, macro scripts, or unauthorized third-party memory injection software is strictly forbidden.'
        },
        {
          title: '4.2 Bug & Map Exploitation',
          content: 'Intentionally exploiting map glitches, out-of-bounds geometry, or game-breaking bugs is prohibited. Matches played using exploits will be nullified and replayed or forfeited.'
        },
        {
          title: '4.3 Penalty Enforcement',
          content: 'Any player caught cheating receives a permanent Hardware ID & Account ban from SHAKTRIX platform, and all tournament earnings are forfeited.'
        }
      ]
    },
    {
      category: 'disputes',
      categoryTitle: 'Section 5: Dispute Resolution & Appeals',
      icon: <AlertTriangle size={20} style={{ color: 'var(--neon-blue)' }} />,
      rules: [
        {
          title: '5.1 Raising a Match Dispute Ticket',
          content: 'If a dispute occurs regarding score validation, illegal substitutes, or misconduct, team captains must raise a dispute ticket within 15 minutes of match completion.'
        },
        {
          title: '5.2 Proof Requirements',
          content: 'Dispute claims must include video clips (VODs) or clear screenshots. Unsubstantiated verbal claims will not be processed.'
        },
        {
          title: '5.3 Final Referee Authority',
          content: 'Decisions rendered by SHAKTRIX tournament referees and head organizers after reviewing evidence are final and binding.'
        }
      ]
    }
  ];

  const filteredCategories = rulesData.filter(section => {
    if (activeTab !== 'all' && section.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      section.categoryTitle.toLowerCase().includes(query) ||
      section.rules.some(r => r.title.toLowerCase().includes(query) || r.content.toLowerCase().includes(query))
    );
  });

  return (
    <main style={{ padding: '7.5rem 1.5rem 5rem 1.5rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div className="section-title fade-in" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(176, 38, 255, 0.1)',
            border: '1px solid rgba(176, 38, 255, 0.25)',
            color: 'var(--neon-purple)',
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1rem'
          }}>
            <BookOpen size={16} /> OFFICIAL COMPETITIVE GOVERNANCE
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw + 1rem, 4rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>
            SHAKTRIX <span className="text-gradient-violet">TOURNAMENT RULEBOOK</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
            Universal rules, competitive standards, and match operation guidelines enforcing fair play across all SHAKTRIX esports events.
          </p>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search rulebook (e.g. check-in, disconnect, substitute, anti-cheat)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.9rem 1.25rem 0.9rem 3.2rem',
                borderRadius: '9999px',
                background: 'rgba(6, 12, 28, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
            {[
              { id: 'all', label: 'All Rules' },
              { id: 'conduct', label: '1. Code of Conduct' },
              { id: 'roster', label: '2. Roster Rules' },
              { id: 'match', label: '3. Match Execution' },
              { id: 'anticheat', label: '4. Anti-Cheat' },
              { id: 'disputes', label: '5. Disputes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)'
                    : 'rgba(6, 12, 28, 0.6)',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: activeTab === tab.id 
                    ? '1px solid rgba(255, 255, 255, 0.4)' 
                    : '1px solid rgba(0, 240, 255, 0.15)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* RULEBOOK SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '5rem' }}>
          {filteredCategories.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No rules found matching &quot;{searchQuery}&quot;. Try adjusting your search term.
            </div>
          ) : (
            filteredCategories.map((section, idx) => (
              <div
                key={idx}
                className="glass-panel fade-in"
                style={{
                  padding: '2rem 2.25rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(0, 240, 255, 0.18)',
                  background: 'rgba(6, 12, 28, 0.85)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0, 240, 255, 0.12)', paddingBottom: '1rem' }}>
                  {section.icon}
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', fontFamily: 'var(--font-title)', letterSpacing: '0.04em' }}>
                    {section.categoryTitle}
                  </h2>
                </div>

                {/* Rules List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {section.rules.map((rule, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        background: 'rgba(10, 18, 40, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--neon-blue)', marginBottom: '0.4rem' }}>
                        {rule.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>
                        {rule.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM HELP BANNER */}
        <div className="glass-panel" style={{
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          border: '1px solid rgba(176, 38, 255, 0.25)',
          background: 'linear-gradient(135deg, rgba(16, 8, 36, 0.9) 0%, rgba(6, 14, 32, 0.9) 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem' }}>
              NEED REFEREE ASSISTANCE OR HAVE QUESTIONS?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Join the SHAKTRIX Global Lounge Chat or contact tournament organizers on the match detail page.
            </p>
          </div>
          <Link href="/about/mission">
            <Button variant="primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px' }}>
              OUR PLATFORM MISSION <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

      </div>
    </main>
  );
}
