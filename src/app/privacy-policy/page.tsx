'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function PrivacyPolicyPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <Lock size={14} /> DATA PROTECTION & PRIVACY
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            PRIVACY <span className="text-gradient-cyan">POLICY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Last Updated: August 21, 2026 | Effective for all SHAKTRIX platform accounts.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              1. Information We Collect
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              We collect user information to provide tournament matchmaking and leaderboard services:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li><strong>Account Credentials:</strong> Email address, hashed password, and unique Gamertag handle.</li>
              <li><strong>Game Identifiers:</strong> Linked Riot ID, Steam ID, BGMI Character ID, and Discord username.</li>
              <li><strong>Telemetry & Match Logs:</strong> Match score submissions, VOD screenshots, hardware ID hashes (for anti-cheat enforcement), and IP location logs.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Your data is processed strictly for platform operations:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li>Auto-populating tournament brackets and validating live match scores.</li>
              <li>Enforcing anti-smurfing, hardware ban checks, and fair play compliance.</li>
              <li>Processing tournament prize distributions and notification alerts.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              3. Data Encryption & Security
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              All database connections use TLS 1.3 encryption and Firebase Security Rules. Hardware ID hashes are encrypted at rest using HMAC-SHA256. We never sell player data to third-party advertisers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              4. Your Data Rights (GDPR & CCPA)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              You have the right to request a full export of your profile data or request complete account erasure via your Account Settings dashboard or by emailing <strong style={{ color: 'var(--text-primary)' }}>privacy@shaktrix.gg</strong>.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/terms-of-service">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                TERMS OF SERVICE <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
