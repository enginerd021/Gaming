'use client';

import React from 'react';
import Link from 'next/link';
import { FileCheck, Shield, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function DataProcessingAgreementPage() {
  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(176, 38, 255, 0.08)', border: '1px solid rgba(176, 38, 255, 0.2)', color: 'var(--accent-violet)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <FileCheck size={14} /> ENTERPRISE DATA COMPLIANCE
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            DATA PROCESSING <span className="text-gradient-violet">AGREEMENT (DPA)</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Framework governing data handling between tournament organizers, esports organizations, and SHAKTRIX.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              1. Scope & Roles (Controller vs Processor)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              This Data Processing Agreement (DPA) applies to third-party tournament organizers, team sponsors, and esports partners. The organizer acts as the Data Controller, while SHAKTRIX operates as the Data Processor handling player rosters and match data.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              2. Data Processing Obligations & Sub-processors
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              SHAKTRIX processes personal data (Gamertags, email addresses, Discord IDs) strictly according to written instructions from tournament hosts. Authorized sub-processors (Google Cloud Platform / Firebase) adhere to ISO 27001 and SOC 2 Type II compliance standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-violet)', marginBottom: '0.5rem' }}>
              3. Data Breach Notification & Audits
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              In the event of a confirmed security incident impacting player data, SHAKTRIX commits to notifying affected Data Controllers within 48 hours and providing technical incident reports.
            </p>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/security-policy">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                SECURITY POLICY <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
