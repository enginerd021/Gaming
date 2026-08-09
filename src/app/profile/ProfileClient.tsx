'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { 
  Gamepad2, 
  User, 
  Save, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Check, 
  Trophy, 
  Calendar, 
  Clock
} from 'lucide-react';
import { recommendGames } from '@/lib/recommendGames';

const AVAILABLE_GAMES = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];
const POPULAR_ROLES = ["Duelist", "Sentinel", "Mid Laner", "Jungler", "IGL (In-Game Leader)", "Entry Fragger", "Support", "Sniper", "Flex"];

export default function ProfileClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.loading);
  const router = useRouter();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [riotId, setRiotId] = useState('');

  // Live Riot Stats (fetched from /api/game-stats)
  const [riotLiveStats, setRiotLiveStats] = useState<Record<string, any> | null>(null);
  const [loadingRiotSync, setLoadingRiotSync] = useState(false);
  const [riotSyncError, setRiotSyncError] = useState<string | null>(null);

  // Tournament History
  const [tournamentHistory, setTournamentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [loadedProfileUid, setLoadedProfileUid] = useState<string | null>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // Sync state with store profile when profile loads/changes
  if (profile && profile.uid !== loadedProfileUid) {
    setLoadedProfileUid(profile.uid);
    setDisplayName(profile.displayName || '');
    setSkillLevel(profile.skillLevel || 'Intermediate');
    setSelectedGames(profile.registeredGames || []);
    setPreferredRoles(profile.preferredRoles || []);
    setRiotId(profile.riotId || '');
  }

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Syncs live Riot score from the Riot API and writes to Firestore
  const syncRiotScore = async (riotIdToSync: string) => {
    if (!profile) return;
    if (!riotIdToSync.trim() || !/^[^#]+#[^#]+$/.test(riotIdToSync.trim())) return;

    setLoadingRiotSync(true);
    setRiotSyncError(null);

    try {
      const res = await fetch(`/api/game-stats?riotId=${encodeURIComponent(riotIdToSync.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setRiotSyncError(data.error || `Riot API error (${res.status})`);
        return;
      }

      // Write the live Riot Score to stats.points and cache rank info on the profile doc
      const profileRef = doc(db, 'profiles', profile.uid);
      await updateDoc(profileRef, {
        'stats.points': data.riotScore,
        'stats.wins': data.rankInfo?.wins || profile.stats?.wins || 0,
        'stats.losses': data.rankInfo?.losses || 0,
        riotStats: {
          summonerLevel: data.summonerLevel,
          rankInfo: data.rankInfo,
          lastSynced: Date.now(),
          // Live Valorant Telemetry
          agent: data.agent,
          wins: data.wins,
          losses: data.losses,
          roundsPlayed: data.roundsPlayed,
          kills: data.kills,
          deaths: data.deaths,
          assists: data.assists,
          acs: data.acs,
          adr: data.adr,
          kast: data.kast,
          kd: data.kd,
          headshotPct: data.headshotPct,
          firstKills: data.firstKills,
          firstDeaths: data.firstDeaths,
          shaktrixRating: data.shaktrixRating,
        },
      });

      setRiotLiveStats(data);
    } catch {
      setRiotSyncError('Failed to connect to Riot Stats service.');
    } finally {
      setLoadingRiotSync(false);
    }
  };

  // Auto-sync live Riot score when the profile page loads if they have a Riot ID linked
  useEffect(() => {
    if (profile?.riotId) {
      syncRiotScore(profile.riotId);
    }
  }, [profile?.uid, profile?.riotId]);

  // Subscribe to Tournament Registrations & load tournament details
  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'tournamentRegistrations'),
      where('userId', '==', profile.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      setLoadingHistory(true);
      const regList = snap.docs.map(doc => doc.data());
      
      const historyList: any[] = [];
      for (const reg of regList) {
        try {
          const tDoc = await getDoc(doc(db, 'tournaments', reg.tournamentId));
          if (tDoc.exists()) {
            const tData = tDoc.data();
            historyList.push({
              id: tDoc.id,
              name: tData.name,
              status: tData.status, // Upcoming, Active, Completed
              startTime: tData.startTime,
              winnerId: tData.winnerId || null,
              teamId: reg.teamId,
              registeredAt: reg.registeredAt
            });
          }
        } catch (e) {
          console.error("Error loading tournament details:", e);
        }
      }
      
      // Sort by registeredAt desc
      historyList.sort((a, b) => b.registeredAt - a.registeredAt);
      setTournamentHistory(historyList);
      setLoadingHistory(false);
    });

    return () => unsub();
  }, [profile?.uid]);

  const handleGameToggle = (game: string) => {
    if (selectedGames.includes(game)) {
      setSelectedGames(selectedGames.filter(g => g !== game));
    } else {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleAddRole = (role: string) => {
    const trimmed = role.trim();
    if (trimmed && !preferredRoles.includes(trimmed)) {
      setPreferredRoles([...preferredRoles, trimmed]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setPreferredRoles(preferredRoles.filter(r => r !== roleToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display Name is required.' });
      triggerShake();
      return;
    }

    if (riotId.trim() && !/^[^#]+#[^#]+$/.test(riotId.trim())) {
      setMessage({ type: 'error', text: 'Invalid Riot ID format. Please use name#tag (e.g. Rioter#NA1).' });
      triggerShake();
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const profileRef = doc(db, 'profiles', profile.uid);
      await updateDoc(profileRef, {
        displayName: displayName.trim(),
        skillLevel,
        registeredGames: selectedGames,
        preferredRoles: preferredRoles,
        riotId: riotId.trim(),
      });

      if (riotId.trim()) {
        await syncRiotScore(riotId.trim());
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      triggerShake();
      const pErr = err as { code?: string; message?: string };
      if (pErr.code === 'permission-denied') {
        setMessage({ type: 'error', text: 'Action failed: You do not have permission to modify this profile.' });
      } else {
        setMessage({ type: 'error', text: pErr.message || 'Failed to update profile.' });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', gap: '1rem', flexDirection: 'column' }}>
        <Loader className="animate-spin text-cyan" size={40} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile data...</p>
      </div>
    );
  }

  // Filter tournaments
  const upcomingTournaments = tournamentHistory.filter(t => t.status !== 'Completed');
  const pastTournaments = tournamentHistory.filter(t => t.status === 'Completed');

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      
      <div className="container" style={{ maxWidth: '1200px', position: 'relative', zIndex: 1 }}>
        
        {/* Profile Card Header */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ 
            width: '70px', 
            height: '70px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--bg-primary)'
          }}>
            {profile.displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile.displayName}</span>
              <span className="badge badge-cyan">@{profile.gamertag}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Riot Score: <strong style={{ color: 'var(--accent-gold)' }}>{(profile.stats?.points || 0).toLocaleString()} pts</strong> &bull; <strong style={{ color: 'var(--accent-green)' }}>{profile.stats?.wins || 0} Wins</strong>
            </p>
          </div>
        </div>

        {/* Global Feedback message */}
        <div aria-live="assertive">
          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: message.type === 'error' ? 'hsla(350, 85%, 55%, 0.12)' : 'hsla(145, 80%, 45%, 0.12)',
              border: `1px solid ${message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)'}`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)',
              fontSize: '0.9rem'
            }}>
              {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Two-Column Dashboard Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Profile Settings & Valorant Live Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Valorant Stats Panel */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Gamepad2 size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Valorant Status & Riot ID Link</h2>
              </div>

              {/* Riot Games ID Form Input */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="prof-riotid" className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Linked Riot Games ID
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="input-glow-wrapper" style={{ flex: 1 }}>
                    <input
                      id="prof-riotid"
                      type="text"
                      className="glass-input"
                      placeholder="e.g. Rioter#NA1"
                      value={riotId}
                      onChange={(e) => setRiotId(e.target.value)}
                      disabled={updating || loadingRiotSync}
                    />
                  </div>
                  {riotId.trim() && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => syncRiotScore(riotId.trim())}
                      disabled={loadingRiotSync || updating}
                      style={{
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderColor: 'var(--accent-cyan)',
                        color: 'var(--accent-cyan)',
                        padding: '0 1rem',
                        justifyContent: 'center'
                      }}
                      title="Fetch live rank data from Riot API"
                    >
                      {loadingRiotSync
                        ? <Loader size={14} className="animate-spin" />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      }
                      <span style={{ fontSize: '0.78rem' }}>Refresh Stats</span>
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem', lineHeight: 1.4 }}>
                  Synchronize your live rank data from your Riot account. The score rating points fetched will be directly used for seeding brackets.
                </span>
              </div>

              {/* Live Valorant Stats Display */}
              {(riotLiveStats || (profile as any).riotStats) ? (() => {
                const stats = riotLiveStats || (profile as any).riotStats;
                const rank = stats.rankInfo || {};
                const score = riotLiveStats?.riotScore ?? profile.stats?.points ?? 0;
                return (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Live Stats Panel</span>
                      {stats.lastSynced && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Synced: {new Date(stats.lastSynced).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank Level</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                          {rank.tier && rank.tier !== 'UNRANKED' ? `${rank.tier} ${rank.rank}` : 'UNRANKED'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Riot Score</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>{score.toLocaleString()} pts</div>
                      </div>
                      
                      {stats.agent && (
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Character</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-violet)' }}>👤 {stats.agent}</div>
                        </div>
                      )}
                      {stats.kills > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kills / Deaths / Assists</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-green)' }}>
                            ⚔️ {stats.kills}/{stats.deaths}/{stats.assists}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.4rem', fontWeight: 600 }}>({stats.kd} K/D)</span>
                          </div>
                        </div>
                      )}
                      {stats.acs > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score / Rounds</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            🔥 {stats.acs} ACS <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({stats.roundsPlayed} rounds)</span>
                          </div>
                        </div>
                      )}
                      {stats.adr > 0 && (
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Damage</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-red)' }}>💥 {stats.adr} ADR</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '1rem', border: '1px dashed var(--border-color)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No Riot ID linked. Enter your Riot ID above to display your live stats.
                </div>
              )}

              {riotSyncError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontSize: '0.78rem', marginTop: '1rem', background: 'hsla(350,85%,55%,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                  <AlertCircle size={14} /> {riotSyncError}
                </div>
              )}
            </div>

            {/* Profile Info Settings Form */}
            <form onSubmit={handleSaveProfile} className={`glass-panel ${shake ? 'shake' : ''}`} style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <User size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Profile Information</h2>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="prof-name" className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Display Name
                </label>
                <div className="input-glow-wrapper">
                  <input
                    id="prof-name"
                    type="text"
                    className="glass-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Registered Games
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {AVAILABLE_GAMES.map((game) => {
                    const isSelected = selectedGames.includes(game);
                    return (
                      <button
                        key={game}
                        type="button"
                        onClick={() => handleGameToggle(game)}
                        disabled={updating}
                        className={`badge ${isSelected ? 'badge-cyan' : 'badge-outline'}`}
                        style={{ padding: '0.35rem 0.75rem', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                      >
                        {isSelected && <Check size={10} style={{ marginRight: '0.25rem', display: 'inline' }} />}
                        {game}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Preferred Roles
                </label>
                
                {preferredRoles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {preferredRoles.map((role) => (
                      <span
                        key={role}
                        className="badge badge-violet"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0 0.1rem', fontSize: '0.7rem' }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {POPULAR_ROLES.filter(r => !preferredRoles.includes(r)).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleAddRole(role)}
                      disabled={updating}
                      className="badge badge-outline table-row-hover"
                      style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={10} /> {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '2.8rem' }}
                disabled={updating}
              >
                {updating ? 'Saving...' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    <Save size={16} /> Save Profile Settings
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Shaktrix Tournament History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Shaktrix History Card */}
            <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Trophy size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Shaktrix History</h2>
              </div>

              {loadingHistory ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem 0' }}>
                  <Loader className="animate-spin text-cyan" size={20} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Retrieving tournament history...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Section 1: Upcoming Tournaments */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} /> Registered / Upcoming Tournaments
                    </h3>

                    {upcomingTournaments.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                        No upcoming tournaments registered.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {upcomingTournaments.map((t) => (
                          <div 
                            key={t.id} 
                            style={{ 
                              background: 'var(--bg-secondary)', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '1rem', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{t.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> {t.startTime ? new Date(t.startTime).toLocaleDateString() : 'TBD'}
                              </div>
                            </div>
                            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Past Tournaments */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Trophy size={14} /> Past Participation Results
                    </h3>

                    {pastTournaments.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                        No completed tournaments played yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pastTournaments.map((t) => {
                          const userWon = t.winnerId && t.winnerId === t.teamId;
                          return (
                            <div 
                              key={t.id} 
                              style={{ 
                                background: 'var(--bg-secondary)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px', 
                                padding: '1rem', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center' 
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>{t.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  Played on {t.startTime ? new Date(t.startTime).toLocaleDateString() : 'Past'}
                                </div>
                              </div>
                              <span 
                                className={`badge ${userWon ? 'badge-green' : 'badge-outline'}`} 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '0.15rem 0.45rem', 
                                  fontWeight: 800,
                                  color: userWon ? 'var(--accent-green)' : 'var(--text-muted)',
                                  borderColor: userWon ? 'var(--accent-green)' : 'var(--border-color)'
                                }}
                              >
                                {userWon ? '🏆 WON / CHAMPION' : 'ELIMINATED'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
            
          </div>

        </div>

      </div>
    </main>
  );
}
