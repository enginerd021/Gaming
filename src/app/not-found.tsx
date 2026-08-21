'use client';

import Link from 'next/link';
import { Home, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main style={{
      position: 'relative',
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      overflow: 'hidden',
      backgroundColor: '#02040a',
    }}>
      {/* Background Decorative Glows */}
      <div className="hero-glow hero-glow-1" style={{ top: '-10%', left: '10%' }} />
      <div className="hero-glow hero-glow-2" style={{ bottom: '10%', right: '10%' }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '650px',
        textAlign: 'center',
        zIndex: 1,
      }} className="fade-in">
        
        {/* Massive Stylized 404 */}
        <h1 style={{
          fontSize: 'clamp(6rem, 15vw, 10rem)',
          fontWeight: 900,
          lineHeight: '1',
          margin: '0 0 1rem 0',
          fontFamily: 'var(--font-title)',
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.3))',
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 800,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
          marginBottom: '1rem',
          fontFamily: 'var(--font-title)',
        }}>
          ARENA NOT FOUND
        </h2>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          lineHeight: '1.6',
          maxWidth: '520px',
          margin: '0 auto 2.5rem',
          fontFamily: 'var(--font-body)',
        }}>
          The coordinates you entered did not resolve to an active battle sector. The tournament arena may have been decommissioned or moved.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <Link href="/">
            <Button variant="primary" style={{ padding: '0.8rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
              <Home size={18} />
              Return Home
            </Button>
          </Link>
          <Link href="/tournaments">
            <Button variant="outline" style={{ padding: '0.8rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '10px' }}>
              <Trophy size={18} />
              Tournaments
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
