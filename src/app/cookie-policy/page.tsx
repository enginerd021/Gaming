'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cookie, CheckCircle2, Save, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

export default function CookiePolicyPage() {
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [perfCookies, setPerfCookies] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSavePreferences = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3500);
  };

  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.2)', color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <Cookie size={14} /> COOKIES & LOCAL STORAGE
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
            COOKIE <span className="text-gradient-gold">POLICY</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            How we use cookies and browser storage to keep you logged in and deliver smooth match telemetry.
          </p>
        </div>

        <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              1. What Are Cookies & LocalStorage?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Cookies and browser local storage are small text files stored on your device to remember authentication sessions, theme choices (`shaktrix_theme`), and active team notifications.
            </p>
          </section>

          {/* COOKIE PREFERENCES MANAGER */}
          <section style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(6, 12, 28, 0.8)', border: '1px solid rgba(255, 215, 0, 0.25)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
              Cookie Preferences Manager
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#fff', display: 'block' }}>Strictly Necessary Cookies</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for Firebase Auth login, security tokens & WebSocket streams.</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-green)' }}>ALWAYS ACTIVE</span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#fff', display: 'block' }}>Performance & Telemetry Cookies</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measures ping latency, rendering speed, and bracket sync performance.</span>
                </div>
                <input
                  type="checkbox"
                  checked={perfCookies}
                  onChange={(e) => setPerfCookies(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#fff', display: 'block' }}>Analytics Cookies</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregated website traffic statistics to help us optimize tournament layouts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsCookies}
                  onChange={(e) => setAnalyticsCookies(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
              </label>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <Button onClick={handleSavePreferences} variant="primary" style={{ padding: '0.55rem 1.25rem', borderRadius: '9999px', fontSize: '0.825rem' }}>
                <Save size={14} /> SAVE COOKIE PREFERENCES
              </Button>
              {savedMsg && (
                <span style={{ fontSize: '0.8rem', color: '#00ffaa', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Preferences Saved!
                </span>
              )}
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link href="/legal">
              <Button variant="outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                BACK TO LEGAL HUB
              </Button>
            </Link>
            <Link href="/refund-policy">
              <Button variant="primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                REFUND POLICY <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

        </GlassCard>

      </div>
    </main>
  );
}
