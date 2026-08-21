'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function DisclaimerPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.2)', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <AlertTriangle size={14} /> LEGAL DISCLAIMER & LIABILITY
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            LEGAL <span className="text-gradient-gold">DISCLAIMER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Third-party publisher affiliations, game server status disclaimers, and limitation of liability.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              1. Non-Affiliation Disclaimer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              SHAKTRIX is an independent tournament hosting platform. All game titles, trademarks, logos, and artwork (Valorant, League of Legends, CS2, BGMI, Apex Legends, Rocket League) belong strictly to their respective publishers (Riot Games, Valve, Krafton, EA, Epic Games). SHAKTRIX is not endorsed by or directly affiliated with these publishers unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              2. Third-Party Game Server & Internet Latency Disclaimer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              SHAKTRIX is not responsible for match delays or disconnections caused by official game publisher server maintenance, regional ISP outages, routing packet loss, or local hardware failure on player devices.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              3. Limitation of Liability
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              To the maximum extent permitted by applicable law, SHAKTRIX and its organizers shall not be liable for any indirect, incidental, or consequential damages arising from tournament participation or website unavailability.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/accessibility-statement">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                ACCESSIBILITY STATEMENT <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
