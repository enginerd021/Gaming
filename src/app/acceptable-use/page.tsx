'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, Lock, AlertTriangle, ShieldCheck, UserX, Cpu, 
  FileText, ArrowRight, Search, CheckCircle2, Gavel
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function AcceptableUsePolicyPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'smurfing' | 'anticheat' | 'account' | 'banprocedure'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const policies = [
    {
      category: 'smurfing',
      categoryTitle: '1. Anti-Smurfing & Single Verified Account Policy',
      icon: <UserX size={20} style={{ color: 'var(--accent-cyan)' }} />,
      rules: [
        {
          title: 'Single Verified Gamertag per Player',
          content: 'Players are strictly allowed only ONE verified account on SHAKTRIX. Registering multiple accounts or competing on secondary alt accounts is prohibited.'
        },
        {
          title: 'Prohibition of Alt / Smurf Accounts',
          content: 'Competing below your actual skill level on an unranked or fresh alt account compromises tournament seeding. Discovered smurf accounts face immediate hardware ID tagging and permanent tournament disqualification.'
        },
        {
          title: 'Cross-Account Roster Lock',
          content: 'Players caught participating in the same tournament under two separate squad rosters will have both squad entries disqualified with zero prize eligibility.'
        }
      ]
    },
    {
      category: 'anticheat',
      categoryTitle: '2. Prohibited Software, Hacks & Exploit Policy',
      icon: <Cpu size={20} style={{ color: 'var(--accent-red)' }} />,
      rules: [
        {
          title: 'Zero Tolerance Anti-Cheat Ban Policy',
          content: 'Use of aimbots, wallhacks, triggerbots, radar hacks, memory injection tools, macro scripts, or unauthorized third-party overlays results in instant, permanent account and Hardware ID (HWID) banning.'
        },
        {
          title: 'Bug & Map Exploitation',
          content: 'Intentionally exploiting map geometry glitches, out-of-bounds locations, wall-clip bugs, or game mechanics leads to match nullification and tournament expulsion.'
        },
        {
          title: 'Third-Party Verification & Anti-Cheat Drivers',
          content: 'Players must run required game-specific anti-cheat software (Vanguard, EAC, BattlEye, or Ricochet) during live matches upon referee request.'
        }
      ]
    },
    {
      category: 'account',
      categoryTitle: '3. Account Security & Abuse Prevention',
      icon: <Lock size={20} style={{ color: 'var(--accent-violet)' }} />,
      rules: [
        {
          title: 'Account Sharing & Boosting Prohibited',
          content: 'Allowing another individual to log into your account to play matches or climb ladder leaderboard points is considered account boosting and results in 90-day ladder suspension.'
        },
        {
          title: 'Match-Fixing & Prize Collusion',
          content: 'Any form of match-fixing, deliberate throwing (win trading), or collusion between competing teams to divide prize pools leads to permanent lifetime ban from SHAKTRIX.'
        },
        {
          title: 'Unauthorized Financial Activity',
          content: 'Attempting to dispute entry charges fraudulently or exploit payment gateways results in instant account lock and legal reporting.'
        }
      ]
    },
    {
      category: 'banprocedure',
      categoryTitle: '4. Ban Enforcement & Appeal Procedures',
      icon: <Gavel size={20} style={{ color: 'var(--accent-gold)' }} />,
      rules: [
        {
          title: 'Escalation Tier & Ban Durations',
          content: 'Minor infractions (unregistered substitutes, technical delays) incur warnings or match defaults. Major infractions (cheating, toxic harassment, smurfing) incur permanent bans.'
        },
        {
          title: 'Submitting a Ban Appeal',
          content: 'Players who believe an automated ban was issued in error may file a ban appeal ticket within 14 calendar days via the Support Desk with full match recordings.'
        },
        {
          title: 'Final Decision Authority',
          content: 'Decisions rendered by the SHAKTRIX Anti-Cheat Council following log verification and VOD inspection are final and non-negotiable.'
        }
      ]
    }
  ];

  const filteredSections = policies.filter(section => {
    if (activeTab !== 'all' && section.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      section.categoryTitle.toLowerCase().includes(q) ||
      section.rules.some(r => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))
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
            background: 'rgba(255, 60, 60, 0.08)',
            border: '1px solid rgba(255, 60, 60, 0.2)',
            color: 'var(--accent-red)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem'
          }}>
            <ShieldAlert size={14} /> PLATFORM SECURITY & INTEGRITY
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            ACCEPTABLE <span className="text-gradient-cyan">USE POLICY</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '660px', margin: '0 auto', lineHeight: 1.55 }}>
            Mandatory rules safeguarding competitive integrity, anti-smurfing protocols, hardware anti-cheat enforcement, and ban escalation procedures across SHAKTRIX.
          </p>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search policy (e.g. smurfing, cheats, boosting, ban appeal, HWID)..."
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
              { id: 'all', label: 'All Policies' },
              { id: 'smurfing', label: '1. Anti-Smurfing' },
              { id: 'anticheat', label: '2. Anti-Cheat & Hacks' },
              { id: 'account', label: '3. Account Abuse' },
              { id: 'banprocedure', label: '4. Ban & Appeals' }
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

        {/* POLICY SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
          {filteredSections.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No policies found matching &quot;{searchQuery}&quot;. Try searching for &quot;smurf&quot; or &quot;cheat&quot;.
            </div>
          ) : (
            filteredSections.map((section, idx) => (
              <div
                key={idx}
                className="glass-panel fade-in"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 60, 60, 0.2)',
                  background: 'rgba(6, 12, 28, 0.85)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
              >
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 60, 60, 0.15)', paddingBottom: '0.75rem' }}>
                  {section.icon}
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', fontFamily: 'var(--font-title)', letterSpacing: '0.04em', margin: 0 }}>
                    {section.categoryTitle}
                  </h2>
                </div>

                {/* Rules List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {section.rules.map((rule, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(10, 18, 40, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-red)', marginBottom: '0.3rem' }}>
                        {rule.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                        {rule.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM HELPFUL LINKS */}
        <div className="glass-panel" style={{
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          background: 'linear-gradient(135deg, rgba(6, 14, 32, 0.9) 0%, rgba(16, 8, 36, 0.9) 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '0.3rem', fontFamily: 'var(--font-title)' }}>
              NEED TO SUBMIT AN APPEAL OR REPORT A SMURF?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Review the Community Guidelines or open a match dispute ticket from your active tournament page.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/community-guidelines">
              <Button variant="primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '9999px', fontSize: '0.825rem' }}>
                COMMUNITY GUIDELINES <ArrowRight size={14} />
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
