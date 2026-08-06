'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { useAppStore } from '@/store/useAppStore';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Trophy, Gamepad2, Users, Flame, ChevronRight, Activity, Radio, Zap, ArrowDownRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import StatsTicker from '@/components/ui/StatsTicker';
import BentoGrid from '@/components/ui/BentoGrid';
import { initScrollReveals } from '@/animations/scroll';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SUPPORTED_GAMES = [
  {
    name: "Valorant",
    desc: "Tactical 5v5 character-based shooter where precise gunplay meets unique agent abilities.",
    roles: ["Duelist", "Sentinel", "Initiator", "Controller"],
    video: "/videos/valorant.mp4",
    bentoClass: "bento-wide"
  },
  {
    name: "League of Legends",
    desc: "A team-based strategy game where two teams of five champions face off to destroy the enemy Nexus.",
    roles: ["Top", "Jungler", "Mid", "ADC", "Support"],
    video: "/videos/lol.mp4",
    bentoClass: "bento-square"
  },
  {
    name: "CS:GO",
    desc: "The classic competitive tactical shooter focused on team strategy, economy, and precision recoil control.",
    roles: ["Entry Fragger", "AWPer", "Lurker"],
    video: "/videos/csgo.mp4",
    bentoClass: "bento-square"
  },
  {
    name: "Apex Legends",
    desc: "Fast-paced battle royale featuring legendary characters teaming up on the frontier.",
    roles: ["Scout", "Offensive", "Defensive"],
    video: "/videos/apex.mp4",
    bentoClass: "bento-square" 
  },
  {
    name: "Rocket League",
    desc: "High-flying, physics-based soccer with booster-equipped vehicles.",
    roles: ["Striker", "Defender"],
    video: "/videos/rocketleague.mp4",
    bentoClass: "bento-square" 
  },
  {
    name: "Overwatch 2",
    desc: "A vibrant team-based shooter set in an optimistic future battlefield.",
    roles: ["Tank", "Damage", "Support"],
    video: "/videos/overwatch.mp4",
    bentoClass: "bento-wide"
  }
];

const ZentryBentoCard = ({ game }: { game: typeof SUPPORTED_GAMES[0] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <article className={`zentry-bento-card ${game.bentoClass}`}>
      <div className="zentry-bento-media">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="zentry-video"
        >
          <source src={game.video} type="video/mp4" />
        </video>
        <div className="zentry-bento-overlay" />
      </div>

      <div className="zentry-bento-content">
        <div>
          <h3 className="zentry-bento-title">{game.name}</h3>
          <p className="zentry-bento-desc">{game.desc}</p>
        </div>
        
        <div className="zentry-bento-footer">
          <div className="zentry-bento-roles">
            {game.roles.map(r => (
              <span key={r} className="zentry-role-badge">{r}</span>
            ))}
          </div>

          <Link 
            href={`/tournaments?game=${encodeURIComponent(game.name)}`} 
            style={{ 
              fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', 
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', 
              textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' 
            }} 
            className="hover-cyan"
          >
            Explore Tournaments <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default function HomeView() {
  const user = useAppStore((state) => state.user);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = useAutoRefresh();

  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTournaments.length === 0) {
      setLoading(true);
    }
    const unsub = tournamentService.subscribeRecentTournaments(
      3,
      (list) => {
        setActiveTournaments(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    initScrollReveals();

    return () => {
      unsub();
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!heroWrapperRef.current || !videoFrameRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(videoFrameRef.current, {
        scrollTrigger: {
          trigger: heroWrapperRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        clipPath: 'polygon(3% 3%, 97% 3%, 97% 97%, 3% 97%)',
        borderRadius: '24px',
        scale: 0.92,
        opacity: 0.4,
        ease: 'none',
      });

      gsap.to('.cockpit-hud', {
        scrollTrigger: { trigger: heroWrapperRef.current, start: 'top top', end: 'center top', scrub: true },
        opacity: 0, y: -40, ease: 'none',
      });

      gsap.fromTo('.zentry-reveal-text', 
        { y: 80, opacity: 0, rotateX: -45 }, 
        { 
          y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.1, 
          ease: 'power3.out', 
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
        }
      );
    }, heroWrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <main style={{ position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* COCKPIT HERO SECTION */}
      <section ref={heroWrapperRef} style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div ref={videoFrameRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', overflow: 'hidden' }}>
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}>
            <source src="/videos/hero-drive.mp4" type="video/mp4" />
          </video>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 40%, rgba(2, 9, 22, 0.9) 100%)', pointerEvents: 'none' }} />
        </div>

        <div className="cockpit-hud" style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '7rem 2.5rem 2.5rem 2.5rem', maxWidth: '1440px', margin: '0 auto', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(3.5rem, 7vw, 6rem)', lineHeight: '0.9', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                <span style={{ color: 'var(--neon-blue)', textShadow: '0 0 35px rgba(0, 240, 255, 0.85)' }}>SHAKT</span>
                <span style={{ color: 'var(--neon-purple)', textShadow: '0 0 35px rgba(176, 38, 255, 0.85)' }}>RIX</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {user ? (
                <Link href="/tournaments" className="btn btn-primary glow-pulse" style={{ padding: '1rem 2rem', borderRadius: '12px' }}><ArrowDownRight size={18} /> Enter Arena</Link>
              ) : (
                <Link href="/register" className="btn btn-primary glow-pulse" style={{ padding: '1rem 2rem', borderRadius: '12px' }}>Join Now</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker Banner */}
      <div className="container" style={{ position: 'relative', zIndex: 10, marginTop: '2rem', marginBottom: '4rem' }}>
        <StatsTicker />
      </div>

      {/* Chapter 2: Zentry Bento Grid Feature Showcase */}
      <div data-scroll-section>
        <BentoGrid />
      </div>

      {/* ZENTRY BENTO GRID SECTION WITH RESTORED LINKS */}
      <section 
        ref={sectionRef} 
        style={{ 
          padding: '8rem 2rem', 
          background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)', 
          position: 'relative', 
          zIndex: 2,
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ overflow: 'hidden' }}>
              <p className="zentry-reveal-text" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-cyan)' }}>
                Explore SHAKTRIX's Integrated Arenas
              </p>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p className="zentry-reveal-text" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', maxWidth: '600px', lineHeight: 1.6, fontWeight: 500 }}>
                Select your battleground, customize your roles, and experience high-stakes esports matchmaking built for the modern competitive player.
              </p>
            </div>
          </div>

          {/* The Bento Grid */}
          <div className="zentry-bento-grid">
            {SUPPORTED_GAMES.map(game => (
              <ZentryBentoCard key={game.name} game={game} />
            ))}
          </div>

        </div>
      </section>

      {/* Chapter 4: Active Championship Arenas Section */}
      <section data-scroll-section className="section-padding" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                <Flame size={16} /> Active Arenas
              </div>
              <h2 style={{ fontSize: '2.25rem', textTransform: 'uppercase', fontWeight: 900 }}>Championship Clashes</h2>
            </div>
            <Link href="/tournaments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600, color: 'var(--accent-cyan)' }} className="hover-cyan">
              View All Brackets <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-responsive">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-panel skeleton-pulse" style={{ padding: '2rem', height: '220px' }} />
              ))}
            </div>
          ) : activeTournaments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {activeTournaments.map((t) => (
                <GlassCard key={t.id} variant="panel" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <Badge variant={t.status === 'Active' ? 'live' : t.status === 'Upcoming' ? 'cyan' : 'gold'}>
                      {t.status === 'Active' ? 'Live' : t.status}
                    </Badge>
                    <Badge variant="cyan" style={{ fontSize: '0.75rem', textTransform: 'none' }}>{t.game}</Badge>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <span>Rosters Registered</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{t.registeredTeamIds?.length || 0} / {t.maxTeams}</strong>
                  </div>
                  <Link href={`/tournaments/${t.id}`}>
                    <Button variant="outline" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                      Spectate Bracket
                    </Button>
                  </Link>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <Trophy size={32} style={{ opacity: 0.25, margin: '0 auto 0.75rem auto' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No tournaments hosted yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* BENTO STYLES */}
      <style jsx global>{`
        .zentry-bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        @media (min-width: 768px) {
          .zentry-bento-grid {
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 420px;
          }
          .bento-wide {
            grid-column: span 2;
          }
          .bento-square {
            grid-column: span 1;
          }
        }

        .zentry-bento-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .zentry-bento-card:hover {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 30px var(--border-glow), inset 0 0 15px var(--border-glow);
          transform: translateY(-6px);
        }

        .zentry-bento-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .zentry-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.7;
          transform: scale(1);
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease;
        }

        .zentry-bento-card:hover .zentry-video {
          transform: scale(1.08);
          opacity: 0.95;
        }

        .zentry-bento-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(6, 11, 25, 0.2) 0%, rgba(6, 11, 25, 0.9) 100%);
          transition: opacity 0.4s ease;
        }

        .zentry-bento-card:hover .zentry-bento-overlay {
          opacity: 0.4;
        }

        .zentry-bento-content {
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem;
        }

        .zentry-bento-title {
          font-family: var(--font-title);
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.9;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          text-shadow: 0 2px 15px rgba(0,0,0,0.8);
          margin-bottom: 0.75rem;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .zentry-bento-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: 420px;
          margin-bottom: 1rem;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }

        .zentry-bento-footer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .zentry-bento-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .zentry-bento-card:hover .zentry-bento-roles {
          opacity: 1;
          transform: translateY(0);
        }

        .zentry-role-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.4rem 0.85rem;
          background: hsla(210, 100%, 55%, 0.15);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          color: var(--text-primary);
          box-shadow: 0 0 15px var(--border-glow);
        }
      `}</style>
    </main>
  );
}