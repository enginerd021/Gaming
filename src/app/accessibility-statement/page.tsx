'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function AccessibilityStatementPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <Eye size={14} /> INCLUSIVE DIGITAL ESPORTS
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            ACCESSIBILITY <span className="text-gradient-cyan">STATEMENT</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Our commitment to digital accessibility standards (WCAG 2.1 AA compliance) for all players.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              1. Our Accessibility Commitment
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              SHAKTRIX is dedicated to ensuring that our competitive tournament platform is accessible to players of all abilities, including those using screen readers, keyboard navigation, and custom contrast themes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              2. Key Accessibility Features Implemented
            </h2>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
              <li><strong>Keyboard Navigation:</strong> Logical tab navigation sequences with visible focus indicators across all bracket views and modals.</li>
              <li><strong>Screen Reader Announcers:</strong> ARIA live regions for notifications, check-in countdown timers, and form error alerts.</li>
              <li><strong>Reduced Motion Support:</strong> Theme settings allow players to toggle off background particle loops and video tilt effects.</li>
              <li><strong>Color Contrast Standards:</strong> High contrast text ratios adhering to WCAG 2.1 AA in both Neon Dark and Minimal Light themes.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              3. Accessibility Feedback & Assistance
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              If you experience any accessibility barriers while navigating our site or registering for a bracket, please email <strong style={{ color: 'var(--text-primary)' }}>accessibility@shaktrix.gg</strong> for prompt assistance.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/data-processing-agreement">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                DATA PROCESSING AGREEMENT <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
