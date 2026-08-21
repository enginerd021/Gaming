'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant: 'tournament' | 'player' | 'full-page';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant, count = 3 }) => {
  if (variant === 'tournament') {
    return (
      <div className="grid-responsive" style={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div 
            key={idx} 
            className="glass-card" 
            style={{ 
              minHeight: '280px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(0, 240, 255, 0.1)',
              background: 'rgba(10, 16, 36, 0.75)'
            }}
          >
            {/* Top accent bar shimmer */}
            <div className="shimmer-skeleton" style={{ height: '4px', width: '100%' }} />
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
              {/* Badges row */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="shimmer-skeleton" style={{ width: '60px', height: '20px', borderRadius: '4px' }} />
                <div className="shimmer-skeleton" style={{ width: '50px', height: '20px', borderRadius: '4px' }} />
              </div>
              
              {/* Title */}
              <div className="shimmer-skeleton" style={{ width: '85%', height: '24px', borderRadius: '4px', marginTop: '0.25rem' }} />
              
              {/* Game name */}
              <div className="shimmer-skeleton" style={{ width: '40%', height: '16px', borderRadius: '4px' }} />
              
              {/* Countdown/Status */}
              <div className="shimmer-skeleton" style={{ width: '100%', height: '40px', borderRadius: '6px', marginTop: '0.5rem' }} />
              
              {/* Progress bar */}
              <div style={{ marginTop: '0.5rem' }}>
                <div className="shimmer-skeleton" style={{ width: '100%', height: '8px', borderRadius: '999px' }} />
              </div>
            </div>
            
            {/* Button */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(0, 240, 255, 0.08)' }}>
              <div className="shimmer-skeleton" style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'player') {
    return (
      <div className="grid-responsive" style={{ width: '100%' }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div 
            key={idx} 
            className="glass-card" 
            style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem',
              border: '1px solid rgba(0, 240, 255, 0.1)',
              background: 'rgba(10, 16, 36, 0.75)'
            }}
          >
            {/* Avatar + name header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="shimmer-skeleton" style={{ width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="shimmer-skeleton" style={{ width: '70%', height: '20px', borderRadius: '4px' }} />
                <div className="shimmer-skeleton" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0, 240, 255, 0.08)', paddingTop: '1rem' }} />

            {/* Grid stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div className="shimmer-skeleton" style={{ width: '50%', height: '12px', borderRadius: '3px', marginBottom: '0.4rem' }} />
                <div className="shimmer-skeleton" style={{ width: '80%', height: '18px', borderRadius: '4px' }} />
              </div>
              <div>
                <div className="shimmer-skeleton" style={{ width: '50%', height: '12px', borderRadius: '3px', marginBottom: '0.4rem' }} />
                <div className="shimmer-skeleton" style={{ width: '80%', height: '18px', borderRadius: '4px' }} />
              </div>
            </div>

            {/* CTA action */}
            <div className="shimmer-skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px', marginTop: '0.5rem' }} />
          </div>
        ))}
      </div>
    );
  }

  // full-page loader
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#02040a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
    }}>
      {/* Subtle glows in background */}
      <div className="hero-glow hero-glow-1" style={{ opacity: 0.1, transform: 'scale(1.5)', top: '10%', left: '20%' }} />
      <div className="hero-glow hero-glow-2" style={{ opacity: 0.1, transform: 'scale(1.5)', bottom: '10%', right: '20%' }} />

      {/* Pulsing branding */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }} className="fade-in">
        
        {/* Glowing esports loading ring */}
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid rgba(0, 240, 255, 0.05)',
          borderTopColor: 'var(--accent-cyan)',
          borderBottomColor: 'var(--accent-violet)',
          animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
          marginBottom: '1.5rem'
        }} />

        {/* Shaktrix Branding */}
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          letterSpacing: '0.15em',
          color: '#fff',
          fontFamily: 'var(--font-title)',
          margin: 0,
          textShadow: '0 0 10px rgba(0,240,255,0.4)',
        }}>
          SHAKT<span style={{ color: 'var(--accent-cyan)' }}>RIX</span>
        </h2>

        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          margin: 0,
          animation: 'pulseSkeleton 1.5s infinite ease-in-out',
          marginTop: '0.5rem'
        }}>
          Synchronizing Arena...
        </p>
      </div>
    </div>
  );
};

export default SkeletonLoader;
