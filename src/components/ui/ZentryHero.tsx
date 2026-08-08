'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Trophy, Sparkles, Volume2, VolumeX, Shield, ArrowRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { initHeroTimeline } from '@/animations/hero';

export function ZentryHero() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // High quality local esports trailer video clips
  const VIDEO_SOURCES = [
    '/videos/lol.mp4',
    '/videos/overwatch.mp4'
  ];

  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);

  useEffect(() => {
    const ctx = initHeroTimeline({
      heroRef: heroRef.current,
      videoRef: videoRef.current,
      overlayRef: overlayRef.current,
      badgeRef: badgeRef.current,
      headlineRef: headlineRef.current,
      subtitleRef: subtitleRef.current,
      ctaRef: ctaRef.current,
      scrollIndicatorRef: scrollIndicatorRef.current,
    });

    return () => {
      if (ctx) ctx.kill();
    };
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentVideoIdx((prev) => (prev + 1) % VIDEO_SOURCES.length);
  };

  return (
    <section ref={heroRef} className="zentry-hero-wrapper" style={{ height: '100vh', minHeight: '100vh', padding: '0', position: 'relative', overflow: 'hidden' }}>
      
      {/* Cyber Grid & Ambient Glow Background */}
      <div 
        ref={overlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.12) 0%, rgba(176, 38, 255, 0.06) 45%, var(--bg-primary) 85%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} 
      />

      <div className="ambient-glow-cyan" style={{ top: '10%', left: '15%', opacity: 0.3 }} />
      <div className="ambient-glow-violet" style={{ bottom: '10%', right: '15%', opacity: 0.3 }} />

      {/* Hero Content Layer */}
      <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '960px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Subtitle Badge */}
        <div ref={badgeRef} style={{ marginBottom: '1.5rem' }}>
          <div className="zentry-sub-badge">
            <span className="live-dot" />
            <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>WELCOME TO SHAKTRIX METAGAME</span>
          </div>
        </div>

        {/* 100vh Hero Headlines */}
        <h1 ref={headlineRef} className="zentry-hero-title" style={{ marginBottom: '1.25rem' }}>
          DOMINATE THE <br />
          <span className="text-gradient-cyan">ARENA</span>
        </h1>

        <p ref={subtitleRef} style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.6,
          fontWeight: 400
        }}>
          India&apos;s next-generation esports platform for competitive gamers. Build pro rosters, host bracket tournaments, and climb the live Hall of Fame.
        </p>

        {/* Action Controls */}
        <div ref={ctaRef} style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/tournaments">
            <Button variant="primary" style={{ padding: '0.95rem 2.5rem', fontSize: '1.05rem', borderRadius: '9999px' }}>
              <Trophy size={18} />
              ENTER ARENA
              <ArrowRight size={16} />
            </Button>
          </Link>
          <button 
            onClick={toggleExpand}
            className="btn btn-outline"
            style={{ padding: '0.95rem 2.25rem', fontSize: '1.05rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Play size={16} fill="currentColor" />
            WATCH TRAILER
          </button>
        </div>

        {/* Animated Scroll Indicator (Bottom of 100vh) */}
        <div 
          ref={scrollIndicatorRef}
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
          }}
        >
          <span>SCROLL TO EXPLORE</span>
          <ChevronDown size={18} style={{ color: 'var(--accent-cyan)' }} />
        </div>

      </div>

      {/* Floating Sound Toggle */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: '2rem',
        zIndex: 20
      }}>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="btn btn-outline touch-target"
          style={{ borderRadius: '50%', padding: '0.6rem', color: 'var(--accent-cyan)', borderColor: 'var(--border-color)', background: 'hsla(225, 24%, 9%, 0.8)' }}
          title={isMuted ? "Unmute Ambient Sound" : "Mute Sound"}
          aria-label={isMuted ? "Unmute Ambient Sound" : "Mute Sound"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

    </section>
  );
}

export default ZentryHero;
