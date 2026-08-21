'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Package, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function ShippingPolicyPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(176, 38, 255, 0.08)', border: '1px solid rgba(176, 38, 255, 0.2)', color: 'var(--accent-violet)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <Truck size={14} /> MERCHANDISE & TROPHY FULFILLMENT
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            SHIPPING, RETURN & <span className="text-gradient-violet">EXCHANGE POLICY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Fulfillment protocols for physical esports trophies, winner medals, and official SHAKTRIX apparel.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              1. Physical Trophy & Winner Prize Shipping
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Physical tournament trophies, MVP rings, and winner plaques are dispatched within 5-7 business days of address verification following tournament completion. Tracking numbers are emailed automatically.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              2. Merchandise Return & Size Exchange Policy
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Official SHAKTRIX jerseys, hoodies, and accessories can be returned or exchanged for size within <strong>14 days of delivery</strong>, provided items are unworn and retain original tags.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              3. Damaged Deliveries & Replacement Claims
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              If a physical trophy or merchandise arrives damaged during transit, submit a photo claim to <strong style={{ color: 'var(--text-primary)' }}>merch@shaktrix.gg</strong> within 48 hours for immediate express replacement.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/disclaimer">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                DISCLAIMER & LIABILITY <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
