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
  Clock,
  Activity,
  Flame,
  Target
} from 'lucide-react';

const AVAILABLE_GAMES = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];
const POPULAR_ROLES = ["Duelist", "Sentinel", "Mid Laner", "Jungler", "IGL (In-Game Leader)", "Entry Fragger", "Support", "Sniper", "Flex"];

export default function ProfileClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const loading = useAppStore((state) => state.loading);
  const router = useRouter();

  // Active section state
  const [activeSection, setActiveSection] = useState<'personal' | 'valorant' | 'shaktrix' | 'other_games'>('personal');

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
      setMessage({ type: 'success', text: 'Profile settings updated successfully!' });
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

  const upcomingTournaments = tournamentHistory.filter(t => t.status !== 'Completed');
  const pastTournaments = tournamentHistory.filter(t => t.status === 'Completed');

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      
      <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
        
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

        {/* Section Selection Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => { setActiveSection('personal'); setMessage(null); }}
            className={`btn ${activeSection === 'personal' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', boxShadow: activeSection === 'personal' ? 'var(--glow-cyan)' : 'none' }}
          >
            <User size={14} /> Personal Information
          </button>
          <button
            onClick={() => { setActiveSection('valorant'); setMessage(null); }}
            className={`btn ${activeSection === 'valorant' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', boxShadow: activeSection === 'valorant' ? 'var(--glow-cyan)' : 'none' }}
          >
            <Gamepad2 size={14} /> VALORANT Details
          </button>
          <button
            onClick={() => { setActiveSection('shaktrix'); setMessage(null); }}
            className={`btn ${activeSection === 'shaktrix' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', boxShadow: activeSection === 'shaktrix' ? 'var(--glow-cyan)' : 'none' }}
          >
            <Trophy size={14} /> Shaktrix History
          </button>
          <button
            onClick={() => { setActiveSection('other_games'); setMessage(null); }}
            className={`btn ${activeSection === 'other_games' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', boxShadow: activeSection === 'other_games' ? 'var(--glow-cyan)' : 'none' }}
          >
            <Activity size={14} /> CS:GO & Other Games
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 1: PERSONAL INFORMATION (Riot ID taken here) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeSection === 'personal' && (
          <form onSubmit={handleSaveProfile} className={`glass-panel fade-in ${shake ? 'shake' : ''}`} style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <User size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Personal Information Settings</h2>
            </div>

            {/* Riot Games ID (Necessarily Taken Here) */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="prof-riotid" className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Gamepad2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                Linked Riot Games ID <span style={{ color: 'var(--accent-red)' }}>*Required for stats sync</span>
              </label>
              <div className="input-glow-wrapper">
                <input
                  id="prof-riotid"
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Rioter#NA1"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  disabled={updating}
                  style={{ height: '3rem' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem', lineHeight: 1.4 }}>
                Enter your global Riot ID (Format: Username#Tagline). Once linked, your profile will pull live statistics which will be used for seeding match brackets.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="prof-name" className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
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
                  style={{ height: '3rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
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
                      style={{ padding: '0.4rem 0.85rem', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                    >
                      {isSelected && <Check size={12} style={{ marginRight: '0.25rem', display: 'inline' }} />}
                      {game}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Preferred Roles
              </label>
              
              {preferredRoles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  {preferredRoles.map((role) => (
                    <span
                      key={role}
                      className="badge badge-violet"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
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
                    style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={12} /> {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '3rem', fontSize: '0.9rem' }}
              disabled={updating}
            >
              {updating ? 'Saving Changes...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Save size={18} /> Save Settings
                </span>
              )}
            </button>
          </form>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 2: VALORANT DETAILS */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeSection === 'valorant' && (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gamepad2 size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>VALORANT Career Details</h2>
              </div>
              {profile.riotId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => syncRiotScore(profile.riotId || '')}
                  disabled={loadingRiotSync}
                  style={{
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    borderColor: 'var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    padding: '0.4rem 0.85rem'
                  }}
                >
                  {loadingRiotSync ? <Loader size={14} className="animate-spin" /> : <Activity size={14} />}
                  <span>Refresh Stats</span>
                </button>
              )}
            </div>

            {profile.riotId ? (() => {
              const stats = riotLiveStats || (profile as any).riotStats || {};
              const rank = stats.rankInfo || {};
              const score = stats.riotScore ?? profile.stats?.points ?? 0;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Summary Block */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '1.25rem 1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked Account</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '0.15rem' }}>@{stats.summonerName || profile.riotId}</div>
                    </div>
                    {stats.lastSynced && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Last Sync: {new Date(stats.lastSynced).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Rank Level</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                        {rank.tier && rank.tier !== 'UNRANKED' ? `${rank.tier} ${rank.rank}` : 'UNRANKED'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Riot Score Rating</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {score.toLocaleString()} pts
                      </div>
                    </div>

                    {stats.agent && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Preferred Agent</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-violet)' }}>
                          👤 {stats.agent}
                        </div>
                      </div>
                    )}

                    {stats.kills > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Tournament K/D Ratio</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          ⚔️ {stats.kills}/{stats.deaths}/{stats.assists}
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({stats.kd} K/D)</span>
                        </div>
                      </div>
                    )}

                    {stats.acs > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Performance Metrics (ACS & Rounds)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Flame size={18} style={{ color: 'var(--accent-gold)' }} />
                          {stats.acs} ACS
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({stats.roundsPlayed} rounds played)</span>
                        </div>
                      </div>
                    )}

                    {stats.adr > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Avg Damage / Round</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                          💥 {stats.adr} ADR
                        </div>
                      </div>
                    )}

                    {stats.headshotPct > 0 && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Headshot Accuracy</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Target size={16} /> {stats.headshotPct}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                <Gamepad2 size={40} style={{ margin: '0 auto 1.25rem auto', color: 'var(--accent-cyan)', opacity: 0.7 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff' }}>No Riot ID Configured</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.4 }}>
                  Please navigate to the **Personal Information** section first, enter your Riot ID, and save to unlock your live VALORANT statistics here.
                </p>
              </div>
            )}

            {riotSyncError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '1.5rem', background: 'hsla(350,85%,55%,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', padding: '0.6rem 1rem' }}>
                <AlertCircle size={14} /> {riotSyncError}
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 3: SHAKTRIX HISTORY */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeSection === 'shaktrix' && (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Trophy size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Tournament History &amp; Records</h2>
            </div>

            {loadingHistory ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem 0' }}>
                <Loader className="animate-spin text-cyan" size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading Shaktrix records...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* Upcoming */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} /> Registered / Upcoming Tournaments
                  </h3>

                  {upcomingTournaments.length === 0 ? (
                    <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No registered upcoming tournaments. Check out the **Tournaments** tab in the header to join!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {upcomingTournaments.map((t) => (
                        <div 
                          key={t.id} 
                          style={{ 
                            background: 'var(--bg-secondary)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px', 
                            padding: '1.25rem', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{t.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={12} /> Registered for {t.startTime ? new Date(t.startTime).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                          <span className="badge badge-cyan" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', textTransform: 'uppercase' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Win/Loss Results */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Trophy size={14} /> Match Results &amp; Standings
                  </h3>

                  {pastTournaments.length === 0 ? (
                    <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No past tournament results recorded on this profile.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {pastTournaments.map((t) => {
                        const userWon = t.winnerId && t.winnerId === t.teamId;
                        return (
                          <div 
                            key={t.id} 
                            style={{ 
                              background: 'var(--bg-secondary)', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '1.25rem', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{t.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Finished on {t.startTime ? new Date(t.startTime).toLocaleDateString() : 'Past'}
                              </div>
                            </div>
                            <span 
                              className={`badge ${userWon ? 'badge-green' : 'badge-outline'}`} 
                              style={{ 
                                fontSize: '0.72rem', 
                                padding: '0.2rem 0.5rem', 
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
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 4: CS:GO & OTHER GAMES */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeSection === 'other_games' && (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Activity size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>CS:GO &amp; Multi-Game Hub</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* CS:GO Card */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', fontSize: '5rem', opacity: 0.05, fontWeight: 900, pointerEvents: 'none' }}>
                  CS:GO
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Counter-Strike (CS:GO / CS2)</span>
                    <span className="badge badge-outline" style={{ fontSize: '0.65rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>Link Pending</span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', opacity: 0.6 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CS Rating / Rank</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>14,580 pts (Gold)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>K/D Ratio</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-green)', marginTop: '0.2rem' }}>1.15 K/D</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Headshot %</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)', marginTop: '0.2rem' }}>46.2%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg ADR</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginTop: '0.2rem' }}>84.5 damage</div>
                  </div>
                </div>
                <div style={{ marginTop: '1.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid hsla(0,0%,100%,0.05)', paddingTop: '0.75rem' }}>
                  ℹ️ CS:GO live stats sync system is currently in queue. You will be able to bind your Steam/CS2 tag in an upcoming update!
                </div>
              </div>

              {/* Other Games Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                
                {/* Apex Legends */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', opacity: 0.75 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem' }}>Apex Legends</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Tracks Kills, Damage, and Arena Placement.
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    Coming Soon
                  </span>
                </div>

                {/* Rocket League */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', opacity: 0.75 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem' }}>Rocket League</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Tracks Division Rank, Goals, Assists, and Saves.
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    Coming Soon
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
