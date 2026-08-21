'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { doc, updateDoc, collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Gamepad2, User, Check, ArrowRight, Sparkles, Shield, Trophy, 
  Star, CheckCircle2, ChevronRight, Zap 
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';

const GAME_OPTIONS = [
  { id: 'valorant', name: 'Valorant', genre: 'Tactical Shooter', icon: '🎯' },
  { id: 'bgmi', name: 'BGMI / PUBG Mobile', genre: 'Battle Royale', icon: '🔫' },
  { id: 'cs2', name: 'Counter-Strike 2', genre: 'FPS', icon: '💥' },
  { id: 'lol', name: 'League of Legends', genre: 'MOBA', icon: '⚔️' },
  { id: 'rocketleague', name: 'Rocket League', genre: 'Sports / Action', icon: '⚽' },
  { id: 'fortnite', name: 'Fortnite', genre: 'Battle Royale', icon: '🪂' }
];

const ROLE_OPTIONS = ['Entry Fragger / Duelist', 'In-Game Leader (IGL)', 'Support / Controller', 'Sniper / Anchor', 'Flex'];
const SKILL_OPTIONS = ['Casual / Am', 'Intermediate / Competitive', 'Semi-Pro / Master', 'Pro / Radiant'];

export default function OnboardingClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gamertag, setGamertag] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gameIds, setGameIds] = useState({ riotId: '', steamId: '', bgmiId: '', discord: '' });
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Flex');
  const [skillLevel, setSkillLevel] = useState<string>('Intermediate / Competitive');
  const [saving, setSaving] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setGamertag(profile.gamertag || '');
      setDisplayName(profile.displayName || '');
      if (profile.registeredGames) setSelectedGames(profile.registeredGames);
      if (profile.skillLevel) setSkillLevel(profile.skillLevel);
    }
  }, [profile]);

  // Load featured tournaments for Step 3
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const q = query(collection(db, "tournaments"), limit(3));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setTournaments(list);
      } catch (err) {
        console.error('Error loading tournaments for onboarding:', err);
      }
    };
    fetchTournaments();
  }, []);

  const handleToggleGame = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter(g => g !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const handleCompleteStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamertag.trim()) return;
    setStep(2);
  };

  const handleCompleteStep2 = async () => {
    setSaving(true);
    try {
      if (user) {
        const ref = doc(db, "profiles", user.uid);
        await updateDoc(ref, {
          displayName: displayName.trim() || gamertag.trim(),
          gamertag: gamertag.trim(),
          registeredGames: selectedGames,
          preferredRoles: [selectedRole],
          skillLevel,
          onboarded: true,
          updatedAt: Date.now()
        });
      }
    } catch (err) {
      console.error('Failed to update onboarding profile:', err);
    } finally {
      setSaving(false);
      setStep(3);
    }
  };

  const handleFinishOnboarding = () => {
    router.push('/tournaments');
  };

  return (
    <main style={{ padding: '6.5rem 1.25rem 4rem 1.25rem', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* STEP PROGRESS BAR */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> PLAYER ONBOARDING SETUP
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            WELCOME TO <span className="text-gradient-cyan">SHAKTRIX</span>
          </h1>

          {/* Stepper indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', maxWidth: '450px', margin: '0 auto' }}>
            {[
              { num: 1, label: 'Gamer Identity' },
              { num: 2, label: 'Game Preferences' },
              { num: 3, label: 'First Tournament' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step >= s.num ? 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' : 'rgba(255, 255, 255, 0.08)',
                    border: step >= s.num ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border-color)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: step === s.num ? '0 0 15px rgba(0, 240, 255, 0.4)' : 'none'
                  }}>
                    {step > s.num ? <Check size={16} /> : s.num}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)', display: 'none' }} className="sm-show">
                    {s.label}
                  </span>
                </div>
                {idx < 2 && <div style={{ flex: 1, height: '2px', background: step > s.num ? 'var(--accent-cyan)' : 'var(--border-color)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* STEP 1: GAMER IDENTITY */}
        {step === 1 && (
          <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px' }} className="fade-in">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} style={{ color: 'var(--accent-cyan)' }} /> Step 1: Set Up Your Gamertag & Handle
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your unique Gamertag is your public competitive identity across tournaments, squad rosters, and leaderboards.
            </p>

            <form onSubmit={handleCompleteStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Unique Gamertag / Game ID <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', fontWeight: 800 }}>@</span>
                  <input
                    type="text"
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    placeholder="e.g. Phoenix#1337"
                    required
                    className="glass-input"
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>

              <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Riot ID (Valorant)</label>
                  <input
                    type="text"
                    value={gameIds.riotId}
                    onChange={(e) => setGameIds({ ...gameIds, riotId: e.target.value })}
                    placeholder="Name#TAG"
                    className="glass-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>BGMI Character ID</label>
                  <input
                    type="text"
                    value={gameIds.bgmiId}
                    onChange={(e) => setGameIds({ ...gameIds, bgmiId: e.target.value })}
                    placeholder="512345678"
                    className="glass-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '9999px', width: 'fit-content', alignSelf: 'flex-end' }}>
                CONTINUE TO GAME PREFERENCES <ArrowRight size={16} />
              </button>
            </form>
          </GlassCard>
        )}

        {/* STEP 2: GAME PREFERENCES */}
        {step === 2 && (
          <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px' }} className="fade-in">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gamepad2 size={20} style={{ color: 'var(--accent-violet)' }} /> Step 2: Select Favorite Games & Role
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              We use these choices to notify you when new tournaments launch in your favorite titles.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', display: 'block' }}>
                  Select Esports Games (Multi-Select)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                  {GAME_OPTIONS.map(g => {
                    const isSelected = selectedGames.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleToggleGame(g.id)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{g.icon}</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.85rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', display: 'block' }}>
                            {g.name}
                          </strong>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{g.genre}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                  Preferred Tactical Role
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ROLE_OPTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: selectedRole === r ? 'var(--neon-purple)' : 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        border: selectedRole === r ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid var(--border-color)'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleCompleteStep2}
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px' }}
                >
                  {saving ? 'Saving Profile...' : 'SAVE & VIEW RECOMMENDED TOURNAMENTS'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* STEP 3: FIRST TOURNAMENT NUDGE */}
        {step === 3 && (
          <GlassCard variant="panel" style={{ padding: '2rem', borderRadius: '16px', textAlign: 'center' }} className="fade-in">
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', margin: '0 auto 1rem auto' }}>
              <Trophy size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-title)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              PROFILE COMPLETE! READY FOR YOUR <span className="text-gradient-cyan">FIRST TOURNAMENT</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.5 }}>
              Your Gamertag <strong>@{gamertag}</strong> is locked and verified. Explore recommended tournaments matching your game preferences:
            </p>

            {/* Recommended Tournament Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
              {tournaments.length > 0 ? (
                tournaments.map(t => (
                  <div key={t.id} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(6, 12, 28, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                        {t.game || 'ESPORTS'}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block', marginTop: '0.2rem' }}>
                        {t.title || 'Weekly Showdown'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        Prize Pool: ₹{t.prizePool || '10,000'}
                      </span>
                    </div>

                    <Link href={`/tournaments/${t.id}`}>
                      <Button variant="primary" style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', borderRadius: '6px' }}>
                        ENTER TOURNAMENT <ChevronRight size={14} />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', gridColumn: '1 / -1' }}>
                  <Zap size={24} style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }} />
                  <strong style={{ display: 'block', color: '#fff', fontSize: '0.95rem' }}>No Active Tournaments Right Now</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Check back soon or create your own custom tournament lobby!</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button onClick={handleFinishOnboarding} variant="primary" style={{ padding: '0.75rem 2rem', borderRadius: '9999px', fontSize: '0.9rem' }}>
                BROWSE ALL TOURNAMENTS <ArrowRight size={16} />
              </Button>
              <Link href="/profile">
                <Button variant="outline" style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.9rem' }}>
                  VIEW MY PROFILE
                </Button>
              </Link>
            </div>
          </GlassCard>
        )}

      </div>
    </main>
  );
}
