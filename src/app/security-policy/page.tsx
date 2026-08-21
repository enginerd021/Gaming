'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Bug, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function SecurityPolicyPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.2)', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <ShieldCheck size={14} /> SECURITY & VULNERABILITY DISCLOSURE
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            SECURITY <span className="text-gradient-gold">POLICY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Infrastructure defenses, encryption standards, and responsible bug bounty disclosure guidelines.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              1. Platform Infrastructure & Encryption Controls
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              SHAKTRIX employs multi-layer security defenses to safeguard match transactions and user credentials:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li><strong>Data in Transit:</strong> Mandatory TLS 1.3 encryption across all WebSockets and HTTPS endpoints.</li>
              <li><strong>Data at Rest:</strong> AES-256 encrypted database storage with strict Firestore Security Rules.</li>
              <li><strong>Authentication:</strong> Firebase Auth OAuth 2.0 with rate-limited brute-force protection.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              2. Responsible Vulnerability Disclosure Program
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              We welcome security researchers to test and report vulnerabilities responsibly. Please follow these guidelines:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li>Submit reports directly to <strong style={{ color: 'var(--accent-gold)' }}>security@shaktrix.gg</strong> with proof-of-concept steps.</li>
              <li>Do not access or modify player accounts without explicit permission.</li>
              <li>Allow 7 business days for our engineering team to inspect and patch reported issues prior to public disclosure.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              3. Safe Harbor Guarantee
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Security research conducted in accordance with our Responsible Disclosure policy is considered authorized, and we will not pursue legal action against researchers acting in good faith.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/customer-lifecycle">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                CUSTOMER LIFECYCLE <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
