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
  Target,
  Link as LinkIcon,
  CheckCircle2,
  ShieldCheck,
  RefreshCcw,
  X
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

  // Account Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Riot ID Input State
  const [riotInput, setRiotInput] = useState('');

  const handleNavigateToLinkRiot = (tagToLink: string) => {
    const cleanId = tagToLink.trim();
    if (!cleanId) {
      setMessage({ type: 'error', text: 'Please enter your Riot ID (e.g. YashiAdarsh#6946 or TenZ#SEN).' });
      triggerShake();
      return;
    }
    if (!/^[^#]+#[^#]+$/.test(cleanId)) {
      setMessage({ type: 'error', text: 'Invalid Riot ID format. Use GameName#TagLine (e.g. YashiAdarsh#6946 or TenZ#SEN).' });
      triggerShake();
      return;
    }
    // Navigate to verification page in the same window
    router.push(`/link-riot-id?tag=${encodeURIComponent(cleanId)}`);
  };

  const handleUnlinkRiot = async () => {
    if (!profile?.uid) return;
    if (!window.confirm('Are you sure you want to unlink your Riot ID? Live VALORANT stats sync will be disabled.')) return;

    try {
      const profileRef = doc(db, 'profiles', profile.uid);
      await updateDoc(profileRef, {
        riotId: '',
        'gameConnections.riotId': '',
      });
      setRiotId('');
      setRiotLiveStats(null);
      setMessage({ type: 'success', text: 'Riot ID unlinked successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to unlink Riot ID.' });
    }
  };

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

  const handleDeleteAccount = async () => {
    if (!profile || !user) return;
    if (deleteConfirmText.trim() !== profile.gamertag) {
      triggerShake();
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      // 1. Get client ID Token from current user
      const idToken = await user.getIdToken(true);

      // 2. Call delete API
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      // 3. Clear store and navigate away
      const logout = useAppStore.getState().logout;
      await logout();
      
      // Navigate to register/join page with a success message query
      router.push('/register?deleted=true');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      triggerShake();
      setMessage({ type: 'error', text: err.message || 'An error occurred during account deletion.' });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
      setDeleteConfirmText('');
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

  // Read-only info field styles
  const infoFieldStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
  };
  const infoLabelStyle: React.CSSProperties = {
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    marginBottom: '0.35rem',
  };
  const infoValueStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    wordBreak: 'break-word' as const,
  };

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
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <User size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Personal Information</h2>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.2rem 0.7rem', border: '1px solid var(--border-color)', borderRadius: '9999px' }}>
                View Only
              </span>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>

              {/* Display Name */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Display Name</div>
                <div style={infoValueStyle}>{profile.displayName || '—'}</div>
              </div>

              {/* Gamertag */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Gamertag / Handle</div>
                <div style={{ ...infoValueStyle, color: 'var(--accent-cyan)' }}>@{profile.gamertag || '—'}</div>
              </div>

              {/* Email */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Email Address</div>
                <div style={infoValueStyle}>{user?.email || '—'}</div>
              </div>

              {/* Member since */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Member Since</div>
                <div style={infoValueStyle}>
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </div>
              </div>

              {/* Date of Birth */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Date of Birth</div>
                <div style={infoValueStyle}>
                  {(profile as any).dob
                    ? new Date((profile as any).dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>Not provided</span>}
                </div>
              </div>

              {/* Skill Level */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Skill Level</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.35rem 0.85rem', borderRadius: '9999px',
                    fontFamily: 'var(--font-title)', fontSize: '0.78rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: profile.skillLevel === 'Advanced' ? 'rgba(255,42,109,0.14)' : profile.skillLevel === 'Intermediate' ? 'rgba(0,240,255,0.14)' : 'rgba(0,255,136,0.12)',
                    border: `1px solid ${profile.skillLevel === 'Advanced' ? 'var(--accent-red)' : profile.skillLevel === 'Intermediate' ? 'var(--accent-cyan)' : 'var(--accent-green)'}`,
                    color: profile.skillLevel === 'Advanced' ? 'var(--accent-red)' : profile.skillLevel === 'Intermediate' ? 'var(--accent-cyan)' : 'var(--accent-green)',
                  }}>
                    {profile.skillLevel === 'Advanced' ? '🔥' : profile.skillLevel === 'Intermediate' ? '⚡' : '🌱'} {profile.skillLevel || 'Intermediate'}
                  </span>
                </div>
              </div>

              {/* Linked Riot ID */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Linked Riot ID</div>
                <div style={{ marginTop: '0.4rem' }}>
                  {profile.riotId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.95rem' }}>
                        Riot ID: {profile.riotId}
                      </span>
                      
                      {/* Linked successfully badge */}
                      <span style={{ 
                        padding: '0.2rem 0.65rem', 
                        borderRadius: '9999px', 
                        background: 'rgba(0, 255, 170, 0.12)', 
                        border: '1px solid #00ffaa', 
                        color: '#00ffaa', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem',
                        boxShadow: '0 0 10px rgba(0, 255, 170, 0.2)'
                      }}>
                        <CheckCircle2 size={13} /> Linked successfully
                      </span>

                      <button
                        type="button"
                        onClick={handleUnlinkRiot}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                      >
                        Unlink
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      marginTop: '0.35rem', 
                      padding: '1.25rem', 
                      borderRadius: '12px', 
                      background: 'rgba(6, 14, 30, 0.6)', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.75rem' 
                    }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Riot ID (GameName#TagLine)
                      </label>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="e.g. YashiAdarsh#6946 or TenZ#SEN"
                          value={riotInput}
                          onChange={(e) => setRiotInput(e.target.value)}
                          className="glass-input"
                          style={{ flex: 1, minWidth: '220px' }}
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => handleNavigateToLinkRiot(riotInput)}
                          className="btn btn-primary"
                          style={{
                            padding: '0.6rem 1.4rem',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Add Riot ID
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Login */}
              <div style={infoFieldStyle}>
                <div style={infoLabelStyle}>Last Login</div>
                <div style={infoValueStyle}>
                  {user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>
              </div>

            </div>

            {/* Registered Games */}
            <div style={{ marginTop: '2rem' }}>
              <div style={infoLabelStyle}>Registered Games</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                {(profile.registeredGames || []).length > 0
                  ? (profile.registeredGames as string[]).map((game) => (
                    <span key={game} style={{ padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: 'var(--accent-cyan)' }}>{game}</span>
                  ))
                  : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No games registered</span>}
              </div>
            </div>

            {/* Preferred Roles */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={infoLabelStyle}>Preferred Roles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                {(profile.preferredRoles || []).length > 0
                  ? (profile.preferredRoles as string[]).map((role) => (
                    <span key={role} style={{ padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(176,38,255,0.12)', border: '1px solid rgba(176,38,255,0.3)', color: 'var(--accent-violet)' }}>{role}</span>
                  ))
                  : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No roles set</span>}
              </div>
            </div>

            {/* Lock notice */}
            <div style={{ marginTop: '2rem', padding: '0.9rem 1.25rem', borderRadius: '10px', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.15)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '0.05rem' }} />
              <span>
                Personal information is <strong style={{ color: 'var(--text-primary)' }}>read-only</strong> and set at registration.
                To update games or roles, contact a SHAKTRIX admin.
                Your Riot ID can be linked from the <strong style={{ color: 'var(--accent-cyan)' }}>VALORANT Details</strong> tab.
              </span>
            </div>

            {/* Danger Zone: Delete Account */}
            <div style={{ 
              marginTop: '2.5rem', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              background: 'rgba(255, 60, 60, 0.03)', 
              border: '1px solid rgba(255, 60, 60, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={20} style={{ color: 'var(--accent-red)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>Danger Zone</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Permanently delete your SHAKTRIX account, release your Gamertag <strong style={{ color: 'var(--accent-cyan)' }}>@{profile.gamertag}</strong>, and remove all associated team and profile records. This action is irreversible.
              </p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="btn"
                style={{ 
                  width: 'fit-content', 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #ff3c3c 0%, #aa0000 100%)', 
                  border: 'none', 
                  color: '#fff', 
                  fontWeight: 700, 
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(255, 60, 60, 0.2)'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
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
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '16px', background: 'rgba(6, 14, 30, 0.6)', color: 'var(--text-secondary)' }}>
                <Gamepad2 size={44} style={{ margin: '0 auto 1rem auto', color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', color: '#fff', fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>No Riot ID Linked</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.55 }}>
                  Link your Riot ID to sync VALORANT stats and tournament data.
                </p>
                <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'left' }}>
                    Riot ID (GameName#TagLine)
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="e.g. YashiAdarsh#6946 or TenZ#SEN"
                      value={riotInput}
                      onChange={(e) => setRiotInput(e.target.value)}
                      className="glass-input"
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleNavigateToLinkRiot(riotInput)}
                      className="btn btn-primary"
                      style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                      Add Riot ID
                    </button>
                  </div>
                </div>
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
      {/* ACCOUNT DELETION CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: 'rgba(2, 6, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'dropdownFadeIn 0.2s ease forwards'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '440px',
            border: '1px solid rgba(255, 60, 60, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 60, 60, 0.2)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 60, 60, 0.15)',
              border: '1px solid rgba(255, 60, 60, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--accent-red)'
            }}>
              <AlertCircle size={28} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ffffff' }}>
              Confirm Account Deletion
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This is permanent and cannot be undone. To confirm, please type your gamertag <strong style={{ color: 'var(--accent-cyan)' }}>{profile.gamertag}</strong> below:
            </p>

            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <input
                type="text"
                className="glass-input"
                style={{ textAlign: 'center', fontSize: '1.05rem', letterSpacing: '0.05em' }}
                placeholder="Type your gamertag"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText.trim() !== profile.gamertag}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  background: deleteConfirmText.trim() === profile.gamertag 
                    ? 'linear-gradient(135deg, #ff3c3c 0%, #aa0000 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: 'none',
                  color: deleteConfirmText.trim() === profile.gamertag ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: deleteConfirmText.trim() === profile.gamertag ? 'pointer' : 'not-allowed',
                  boxShadow: deleteConfirmText.trim() === profile.gamertag ? '0 0 15px rgba(255, 60, 60, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {deleting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
