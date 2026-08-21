'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function RefundPolicyPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <RefreshCcw size={14} /> COMMERCE & ENTRY FEES
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            REFUND & <span className="text-gradient-cyan">CANCELLATION POLICY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Rules for tournament registration fees, squad cancellations, and event postponements.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              1. Team Withdrawal & Cancellation Timelines
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Team captains who withdraw their squad registration at least <strong>24 hours prior</strong> to the scheduled bracket start time are eligible for a 100% full refund or platform wallet credit. Withdrawals within 24 hours of bracket launch are non-refundable.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              2. Tournament Cancellation by SHAKTRIX or Organizer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              If a tournament is canceled due to game server outages, insufficient team sign-ups, or organizer decisions, 100% of entry fees will be automatically refunded to all registered team captains within 3 business days.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              3. Disqualification & Rule Violation Forfeiture
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Teams or players disqualified for smurfing, toxic harassment, cheating, or unregistered substitutes forfeit all entry fees and prize pool eligibility with zero right to a refund.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/shipping-policy">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                SHIPPING & RETURN POLICY <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
