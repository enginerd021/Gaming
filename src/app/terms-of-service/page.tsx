'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function TermsOfServicePage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(176, 38, 255, 0.08)', border: '1px solid rgba(176, 38, 255, 0.2)', color: 'var(--accent-violet)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <FileText size={14} /> TERMS OF SERVICE & GOVERNANCE
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            TERMS OF <span className="text-gradient-violet">SERVICE</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Effective Date: August 21, 2026 | Universal platform agreement.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              By creating a SHAKTRIX account, registering for a tournament, or accessing our match lounge, you agree to be bound by these Terms of Service, the Rulebook, and the Acceptable Use Policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              2. Player Eligibility & Account Responsibility
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Players must be at least 13 years of age (or possess parent/guardian consent). You are responsible for all actions taken on your account. Gamertags and team handles must comply with our Community Guidelines.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              3. Tournament Match Operation & Score Validity
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Match outcomes are finalized by automated score checking or referee inspection. Submitting altered or falsified victory screenshots will result in immediate team forfeiture and account suspension.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              4. Prize Pool Distribution & Payouts
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Tournament prize winnings are subject to identity verification (Gamertag mapping) and tax compliance. Unclaimed prize balances after 90 days revert to platform prize pools.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/cookie-policy">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                COOKIE POLICY <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
