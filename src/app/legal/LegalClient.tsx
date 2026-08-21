'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, FileText, Lock, Cookie, RefreshCcw, Truck, AlertTriangle, 
  Eye, FileCheck, ShieldAlert, HeartHandshake, UserCheck, Search, ChevronRight, 
  Sparkles, ExternalLink, ArrowRight
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function LegalClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'terms' | 'privacy' | 'commerce' | 'security'>('all');

  const policySections = [
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      category: 'privacy',
      icon: <Lock size={20} style={{ color: 'var(--accent-cyan)' }} />,
      path: '/privacy-policy',
      desc: 'How SHAKTRIX collects, encrypts, and processes player personal data, Riot IDs, and telemetry in accordance with GDPR and CCPA.'
    },
    {
      id: 'terms-of-service',
      title: 'Terms of Service',
      category: 'terms',
      icon: <FileText size={20} style={{ color: 'var(--accent-violet)' }} />,
      path: '/terms-of-service',
      desc: 'Universal platform binding terms covering tournament participation, match host agreements, prize payouts, and user accounts.'
    },
    {
      id: 'cookie-policy',
      title: 'Cookie Policy & Preferences',
      category: 'privacy',
      icon: <Cookie size={20} style={{ color: 'var(--accent-gold)' }} />,
      path: '/cookie-policy',
      desc: 'Detailed breakdown of essential authentication cookies, performance analytics tokens, and consent customization.'
    },
    {
      id: 'refund-policy',
      title: 'Refund & Cancellation Policy',
      category: 'commerce',
      icon: <RefreshCcw size={20} style={{ color: 'var(--accent-cyan)' }} />,
      path: '/refund-policy',
      desc: 'Guidelines for tournament entry fee refunds, match cancellation credits, team withdrawal timelines, and automated dispute processing.'
    },
    {
      id: 'shipping-policy',
      title: 'Shipping, Return & Exchange Policy',
      category: 'commerce',
      icon: <Truck size={20} style={{ color: 'var(--accent-violet)' }} />,
      path: '/shipping-policy',
      desc: 'Fulfillment terms for official SHAKTRIX esports merchandise, physical trophies, apparel returns, and international delivery.'
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer & Limitation of Liability',
      category: 'terms',
      icon: <AlertTriangle size={20} style={{ color: 'var(--accent-gold)' }} />,
      path: '/disclaimer',
      desc: 'Legal disclaimer regarding third-party game server uptime (Riot, Valve, Krafton), network latency, and service availability.'
    },
    {
      id: 'accessibility-statement',
      title: 'Accessibility Statement',
      category: 'terms',
      icon: <Eye size={20} style={{ color: 'var(--accent-cyan)' }} />,
      path: '/accessibility-statement',
      desc: 'Our commitment to digital accessibility standards (WCAG 2.1 Level AA) for players with screen readers and assistive tech.'
    },
    {
      id: 'data-processing-agreement',
      title: 'Data Processing Agreement (DPA)',
      category: 'privacy',
      icon: <FileCheck size={20} style={{ color: 'var(--accent-violet)' }} />,
      path: '/data-processing-agreement',
      desc: 'Formal data controller/processor agreement for tournament organizers, teams, and enterprise partners handling user data.'
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      category: 'security',
      icon: <ShieldAlert size={20} style={{ color: 'var(--accent-red)' }} />,
      path: '/acceptable-use',
      desc: 'Rules against anti-smurfing, memory hacks, account sharing, boosting, and permanent Hardware ID ban procedures.'
    },
    {
      id: 'security-policy',
      title: 'Security Policy & Responsible Disclosure',
      category: 'security',
      icon: <ShieldCheck size={20} style={{ color: 'var(--accent-gold)' }} />,
      path: '/security-policy',
      desc: 'Infrastructure security controls, end-to-end encryption protocols, and bug bounty vulnerability reporting guidelines.'
    },
    {
      id: 'community-guidelines',
      title: 'Community Guidelines',
      category: 'terms',
      icon: <HeartHandshake size={20} style={{ color: 'var(--accent-cyan)' }} />,
      path: '/community-guidelines',
      desc: 'Public standards for esports sportsmanship, clean match lobby chat, rage quit penalties, and referee support.'
    },
    {
      id: 'customer-lifecycle',
      title: 'Customer Lifecycle & Account Management',
      category: 'terms',
      icon: <UserCheck size={20} style={{ color: 'var(--accent-violet)' }} />,
      path: '/customer-lifecycle',
      desc: 'Account creation, verification milestones, dormant account policies, and data retention after profile deletion.'
    }
  ];

  const filteredSections = policySections.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
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
            <ShieldCheck size={14} /> LEGAL & COMPLIANCE PORTAL
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-title)',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            SHAKTRIX <span className="text-gradient-cyan">LEGAL POLICIES</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '660px', margin: '0 auto', lineHeight: 1.55 }}>
            Transparent legal frameworks, privacy safeguards, commerce terms, and security standards protecting players and tournament organizers across our platform.
          </p>
        </div>

        {/* SEARCH & CATEGORY FILTERS */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search legal documents (e.g. privacy, refund, cookies, terms, security)..."
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
              { id: 'all', label: 'All Documents (12)' },
              { id: 'terms', label: 'Terms & Governance' },
              { id: 'privacy', label: 'Privacy & Data' },
              { id: 'commerce', label: 'Store & Refunds' },
              { id: 'security', label: 'Security & Integrity' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: activeCategory === tab.id 
                    ? 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' 
                    : 'rgba(6, 12, 28, 0.6)',
                  color: activeCategory === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: activeCategory === tab.id 
                    ? '1px solid rgba(255, 255, 255, 0.4)' 
                    : '1px solid var(--border-color)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* POLICY CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
          {filteredSections.map((policy) => (
            <GlassCard key={policy.id} variant="panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }} className="card-hover">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
                    {policy.icon}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {policy.title}
                  </h3>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {policy.desc}
                </p>
              </div>

              <Link href={policy.path}>
                <Button variant="outline" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                  READ POLICY <ChevronRight size={14} />
                </Button>
              </Link>
            </GlassCard>
          ))}
        </div>

        {/* CONTACT BANNER */}
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
              HAVE LEGAL OR PRIVACY QUESTIONS?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Contact our legal compliance team directly at <strong style={{ color: 'var(--accent-cyan)' }}>legal@shaktrix.gg</strong>
            </p>
          </div>
          <Link href="mailto:legal@shaktrix.gg">
            <Button variant="primary" style={{ padding: '0.65rem 1.35rem', borderRadius: '9999px', fontSize: '0.825rem' }}>
              CONTACT LEGAL DEPT <ExternalLink size={14} />
            </Button>
          </Link>
        </div>

      </div>
    </main>
  );
}
