'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { Trophy, Gamepad2, Flame, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import StatsTicker from '@/components/ui/StatsTicker';
import ZentryHero from '@/components/ui/ZentryHero';
import BentoGrid from '@/components/ui/BentoGrid';
import { initScrollReveals } from '@/animations/scroll';

const SUPPORTED_GAMES = [
  {
    name: "Valorant",
    desc: "Tactical 5v5 character-based shooter where precise gunplay meets unique agent abilities.",
    roles: ["Duelist", "Sentinel", "Initiator", "Controller", "IGL"],
    gradient: "linear-gradient(135deg, hsl(350, 85%, 55%) 0%, hsl(20, 80%, 50%) 100%)"
  },
  {
    name: "League of Legends",
    desc: "A team-based strategy game where two teams of five champions face off to destroy the enemy Nexus.",
    roles: ["Top", "Jungler", "Mid", "ADC", "Support"],
    gradient: "linear-gradient(135deg, hsl(210, 80%, 45%) 0%, hsl(186, 100%, 40%) 100%)"
  },
  {
    name: "CS:GO",
    desc: "The classic competitive tactical shooter focused on team strategy, economy, and precision recoil control.",
    roles: ["Entry Fragger", "AWPer / Sniper", "Lurker", "Support", "IGL"],
    gradient: "linear-gradient(135deg, hsl(45, 100%, 50%) 0%, hsl(25, 100%, 45%) 100%)"
  },
  {
    name: "Apex Legends",
    desc: "Fast-paced battle royale featuring legendary characters with powerful abilities teaming up on the frontier.",
    roles: ["Scout / Recon", "Offensive", "Defensive", "Support", "Flex"],
    gradient: "linear-gradient(135deg, hsl(355, 80%, 48%) 0%, hsl(265, 89%, 55%) 100%)"
  },
  {
    name: "Rocket League",
    desc: "High-flying, physics-based soccer with booster-equipped vehicles. Unleash your aerial maneuvers.",
    roles: ["Striker", "Goalkeeper / Defender", "Midfielder / Passer", "Rotation Specialist"],
    gradient: "linear-gradient(135deg, hsl(195, 100%, 45%) 0%, hsl(220, 80%, 40%) 100%)"
  },
  {
    name: "Overwatch 2",
    desc: "A vibrant team-based shooter set in an optimistic future, where every match is an intense 5v5 battlefield.",
    roles: ["Tank", "Damage / DPS", "Support / Healer"],
    gradient: "linear-gradient(135deg, hsl(25, 95%, 55%) 0%, hsl(270, 95%, 60%) 100%)"
  }
];

export default function HomeView() {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const list = await tournamentService.getRecentTournaments(3);
        setActiveTournaments(list);
      } catch (err) {
        console.error("Failed to load home tournaments:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
    initScrollReveals();
  }, []);

  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Chapter 1: 100vh Interactive Zentry Video Hero */}
      <ZentryHero />

      {/* Stats Ticker Banner */}
      <div className="container" style={{ position: 'relative', zIndex: 10, marginTop: '-2.5rem', marginBottom: '3rem' }}>
        <StatsTicker />
      </div>

      {/* Chapter 2: Zentry Bento Grid Feature Showcase */}
      <div data-scroll-section>
        <BentoGrid />
      </div>

      {/* Chapter 3: Game Discovery Section */}
      <section data-scroll-section className="section-padding" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              <Gamepad2 size={16} /> DISCOVER COMPETITIVE ARENAS
            </div>
            <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', fontWeight: 900 }}>SUPPORTED ESPORTS TITLES</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '600px', margin: '0.4rem auto 0 auto' }}>
              Select your battleground, customize your role preferences in your profile, and search for compatible teammates.
            </p>
          </div>

          <div className="grid-responsive">
            {SUPPORTED_GAMES.map((game) => (
              <GlassCard key={game.name} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Visual Header Gradient */}
                <div style={{
                  height: '6px',
                  background: game.gradient,
                  borderRadius: '10px 10px 0 0',
                  margin: '-1.5rem -1.5rem 1.5rem -1.5rem'
                }} />

                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {game.name}
                  <Gamepad2 size={18} style={{ opacity: 0.3 }} />
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flexGrow: 1 }}>
                  {game.desc}
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Popular Team Roles
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {game.roles.map(r => (
                      <Badge key={r} variant="cyan" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', textTransform: 'none' }}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Link href={`/tournaments?game=${encodeURIComponent(game.name)}`} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: 'auto' }} className="hover-cyan">
                  Explore Tournaments <ChevronRight size={16} />
                </Link>
              </GlassCard>
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

    </main>
  );
}
