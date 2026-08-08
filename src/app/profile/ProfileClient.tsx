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
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { 
  Gamepad2, 
  Award, 
  User, 
  Settings, 
  Save, 
  Loader, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Check, 
  Trophy, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Video, 
  Link as LinkIcon, 
  ExternalLink,
  Users
} from 'lucide-react';
import { recommendGames } from '@/lib/recommendGames';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { achievementService } from '@/services/achievementService';
import StatsCharts from '@/components/ui/StatsCharts';
import { detectTeamScheduleConflicts, ConflictGroup } from '@/services/scheduleConflictService';
import ScheduleConflictModal from '@/components/ui/ScheduleConflictModal';

const AVAILABLE_GAMES = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];
const POPULAR_ROLES = ["Duelist", "Sentinel", "Mid Laner", "Jungler", "IGL (In-Game Leader)", "Entry Fragger", "Support", "Sniper", "Flex"];

export default function ProfileClient() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const team = useAppStore((state) => state.team);
  const loading = useAppStore((state) => state.loading);
  const router = useRouter();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'details' | 'career' | 'achievements' | 'matches' | 'charts'>('details');

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

  // Match history & VODs
  const [matches, setMatches] = useState<any[]>([]);
  const [userVods, setUserVods] = useState<Record<string, string>>({});
  
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [shake, setShake] = useState(false);
  const [loadedProfileUid, setLoadedProfileUid] = useState<string | null>(null);
  const [conflictGroup, setConflictGroup] = useState<ConflictGroup | null>(null);

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check for team tournament schedule conflicts
  useEffect(() => {
    if (!team?.id) return;
    detectTeamScheduleConflicts(team.id).then((groups) => {
      if (groups.length > 0) {
        setConflictGroup(groups[0]);
      } else {
        setConflictGroup(null);
      }
    });
  }, [team?.id]);

  // Subscribe to match history and VODs
  useEffect(() => {
    if (!profile?.uid) return;

    // Stream user's match history
    const historyRef = collection(db, "matchHistory");
    const q = query(
      historyRef,
      where("participantIds", "array-contains", profile.uid),
      orderBy("resolvedAt", "desc")
    );

    const unsubMatches = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatches(list);
    }, err => console.error("Error loading match history:", err));

    // Stream user's VOD clips
    const vodsRef = collection(db, "matchVods");
    const qVods = query(vodsRef, where("userId", "==", profile.uid));
    const unsubVods = onSnapshot(qVods, (snap) => {
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        map[d.data().matchId] = d.data().vodUrl;
      });
      setUserVods(map);
    }, err => console.error("Error loading match VODs:", err));

    return () => {
      unsubMatches();
      unsubVods();
    };
  }, [profile?.uid]);

  // Trigger Team Player achievement check when team loads
  useEffect(() => {
    if (profile && team) {
      achievementService.unlockAchievement(profile.uid, 'team_player', profile.achievements || []);
    }
  }, [profile, team]);

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
        },
      });

      setRiotLiveStats(data);
      setMessage({ type: 'success', text: `Riot Score synced! Rank: ${data.rankInfo?.tier || 'UNRANKED'} — ${data.riotScore.toLocaleString()} pts` });
    } catch {
      setRiotSyncError('Failed to connect to Riot Stats service.');
    } finally {
      setLoadingRiotSync(false);
    }
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

      // Trigger Sheriff check if Riot ID linked
      if (riotId.trim()) {
        await achievementService.unlockAchievement(profile.uid, 'sheriff', profile.achievements || []);
        // Auto-sync live Riot Score after saving Riot ID
        await syncRiotScore(riotId.trim());
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
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

  const handleAddGameFromRecommendation = async (gameName: string) => {
    if (!profile) return;
    if (selectedGames.includes(gameName)) return;

    setUpdating(true);
    setMessage(null);
    const updatedGames = [...selectedGames, gameName];
    setSelectedGames(updatedGames);

    try {
      const profileRef = doc(db, "profiles", profile.uid);
      await updateDoc(profileRef, {
        registeredGames: updatedGames
      });
      setMessage({ type: 'success', text: `Added ${gameName} to your registered games!` });
    } catch (err: unknown) {
      console.error("Error adding recommended game:", err);
      triggerShake();
      setMessage({ type: 'error', text: 'Failed to add recommended game.' });
    } finally {
      setUpdating(false);
    }
  };

  // Attach / Edit VOD Link
  const handleAttachVod = async (matchId: string, currentUrl?: string) => {
    if (!profile) return;
    const promptMsg = currentUrl ? "Update POV VOD Link (YouTube, Twitch, Medal):" : "Attach POV VOD Link (YouTube, Twitch, Medal):";
    const url = window.prompt(promptMsg, currentUrl || "");
    if (url === null) return; // Cancelled

    if (url.trim() && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|twitch\.tv|medal\.tv)\/.+$/i.test(url.trim())) {
      alert("Please enter a valid gaming video link from YouTube, Twitch, or Medal.");
      return;
    }

    try {
      const docId = `${matchId}_${profile.uid}`;
      const vodRef = doc(db, "matchVods", docId);
      
      if (url.trim() === "") {
        await deleteDoc(vodRef);
        setMessage({ type: 'success', text: 'VOD link cleared successfully.' });
      } else {
        await setDoc(vodRef, {
          matchId,
          userId: profile.uid,
          gamertag: profile.gamertag,
          username: profile.displayName,
          vodUrl: url.trim(),
          createdAt: serverTimestamp()
        }, { merge: true });
        setMessage({ type: 'success', text: 'POV VOD clip linked to match!' });
      }
    } catch (err) {
      console.error("Failed to link VOD:", err);
      setMessage({ type: 'error', text: 'Failed to save VOD link.' });
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <div className="glass-panel skeleton-pulse" style={{ padding: '2.5rem', height: '500px' }}>
            <div className="skeleton-text" style={{ width: '30%', height: '32px', marginBottom: '2.5rem' }} />
            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
              <div className="skeleton-text" style={{ width: '90%', height: '40px' }} />
              <div className="skeleton-text" style={{ width: '70%', height: '40px' }} />
              <div className="skeleton-text" style={{ width: '80%', height: '80px' }} />
              <div className="skeleton-button" style={{ width: '100%', marginTop: '2rem' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      
      <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
        
        {/* Profile Card Header */}
        <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
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
              {!profile.riotId && (
                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  (Link Riot ID to sync your live rank score)
                </span>
              )}
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

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'details', label: '👤 Profile Info' },
            { id: 'career', label: '📊 Career Stats' },
            { id: 'charts', label: '📈 Stats Charts' },
            { id: 'achievements', label: '🏆 Achievements' },
            { id: 'matches', label: '⚔️ Match History & VODs' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessage(null);
              }}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                boxShadow: activeTab === tab.id ? 'var(--glow-cyan)' : 'none',
                borderRadius: '8px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveProfile} className={`glass-panel ${shake ? 'shake' : ''}`} style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Settings size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Edit Player Profile</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2-col">
              {/* Display Name */}
              <div className="form-group">
                <label htmlFor="prof-displayname" className="form-label">Display Name</label>
                <div className="input-glow-wrapper">
                  <User size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
                  <input
                    id="prof-displayname"
                    type="text"
                    className="glass-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={updating}
                  />
                </div>
              </div>

              {/* Skill Level */}
              <div className="form-group">
                <label htmlFor="prof-skilllevel" className="form-label">Skill Level</label>
                <select
                  id="prof-skilllevel"
                  className="glass-input glass-select"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  disabled={updating}
                >
                  <option value="Beginner">Beginner / Casual</option>
                  <option value="Intermediate">Intermediate / Competitor</option>
                  <option value="Advanced">Advanced / Pro-Tier</option>
                </select>
              </div>
            </div>

            {/* Games Selection */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Gamepad2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                Registered Games (Games you actively play)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {AVAILABLE_GAMES.map((game) => {
                  const isSelected = selectedGames.includes(game);
                  return (
                    <button
                      type="button"
                      key={game}
                      onClick={() => handleGameToggle(game)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.85rem',
                        boxShadow: isSelected ? 'var(--glow-cyan)' : 'none'
                      }}
                      disabled={updating}
                    >
                      {game}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Roles Selection */}
            <div className="form-group" style={{ marginTop: '2rem' }}>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Award size={16} style={{ color: 'var(--accent-violet)' }} />
                Preferred Roles / Playstyles
              </span>

              {/* Role Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0 1rem 0' }}>
                {preferredRoles.map((role) => (
                  <span 
                    key={role} 
                    className="badge badge-violet" 
                    style={{ gap: '0.4rem', cursor: 'pointer', padding: '0.4rem 0.8rem' }}
                    onClick={() => handleRemoveRole(role)}
                    title="Click to remove"
                  >
                    {role} &times;
                  </span>
                ))}
                {preferredRoles.length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No preferred roles added yet.</span>
                )}
              </div>

              {/* Role quick add & input */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label htmlFor="prof-role-input" className="sr-only">Add Preferred Role</label>
                <input
                  id="prof-role-input"
                  type="text"
                  className="glass-input"
                  placeholder="Type custom role or select quick suggestions..."
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRole(newRole);
                    }
                  }}
                  disabled={updating}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleAddRole(newRole)}
                  disabled={updating}
                >
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {POPULAR_ROLES.filter(r => !preferredRoles.includes(r)).slice(0, 6).map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => handleAddRole(role)}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--text-secondary)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    disabled={updating}
                  >
                    + {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '2rem', height: '3.2rem' }}
              disabled={updating}
            >
              {updating ? 'Saving Changes...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Save size={18} /> Save Profile Settings
                </span>
              )}
            </button>
          </form>
        )}

        {/* CAREER TAB */}
        {activeTab === 'career' && (
          <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Trophy size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Career Stats & Game Sync</h2>
            </div>

            {/* Riot Games ID Link + Live Score Sync */}
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="prof-riotid" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Gamepad2 size={16} style={{ color: 'var(--accent-cyan)' }} />
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
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderColor: 'var(--accent-cyan)',
                      color: 'var(--accent-cyan)',
                      minWidth: '145px',
                      justifyContent: 'center'
                    }}
                    title="Fetch live rank data from Riot API"
                  >
                    {loadingRiotSync
                      ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Syncing…</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refresh Stats</>
                    }
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                Enter your Riot ID (name#tag) and save to sync your live League of Legends rank as your Riot Score. Unlocks the &quot;Sheriff&quot; achievement!
              </span>
            </div>

            {/* Live Riot Stats — read-only display */}
            {(riotLiveStats || (profile as any).riotStats) && (() => {
              const stats = riotLiveStats || (profile as any).riotStats;
              const rank = stats.rankInfo || {};
              const score = riotLiveStats?.riotScore ?? profile.stats?.points ?? 0;
              return (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡ Live Riot Stats</span>
                    {(profile as any).riotStats?.lastSynced && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Last synced: {new Date((profile as any).riotStats.lastSynced).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Rank</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {rank.tier && rank.tier !== 'UNRANKED' ? `${rank.tier} ${rank.rank}` : 'UNRANKED'}
                      </div>
                    </div>
                    {rank.tier !== 'UNRANKED' && rank.leaguePoints !== undefined && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>League Points</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-violet)' }}>{rank.leaguePoints} LP</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Ranked Wins</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-green)' }}>{rank.wins ?? 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Ranked Losses</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-red)' }}>{rank.losses ?? 0}</div>
                    </div>
                    {rank.winRate !== undefined && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Win Rate</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)' }}>{rank.winRate}%</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Riot Score</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-cyan)' }}>{score.toLocaleString()} pts</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {riotSyncError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem', background: 'hsla(350,85%,55%,0.08)', border: '1px solid var(--accent-red)', borderRadius: '8px', padding: '0.6rem 1rem' }}>
                <AlertCircle size={14} /> {riotSyncError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '3.2rem', marginTop: '1.5rem' }}
              disabled={updating}
            >
              {updating ? 'Saving Changes...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Save size={18} /> Update Career Statistics
                </span>
              )}
            </button>
          </form>
        )}

        {/* STATS CHARTS TAB */}
        {activeTab === 'charts' && (
          <div className="glass-panel fade-in" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Stats &amp; Analytics</h2>
            </div>
            <StatsCharts profile={profile} />
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Award size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Achievements & Badges</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = profile.achievements?.includes(ach.id);
                return (
                  <div 
                    key={ach.id} 
                    style={{
                      background: unlocked ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                      border: unlocked ? `1px solid ${ach.color}` : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: unlocked ? `0 0 15px ${ach.color}15` : 'none',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                      opacity: unlocked ? 1 : 0.4
                    }}
                    className={unlocked ? "table-row-hover" : ""}
                  >
                    {/* Badge Icon */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: ach.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      boxShadow: unlocked ? `0 0 10px ${ach.color}50` : 'none',
                      color: 'var(--bg-primary)',
                      filter: unlocked ? 'none' : 'grayscale(1)'
                    }}>
                      {ach.icon === 'ShieldAlert' ? '🛡️' :
                       ach.icon === 'Users' ? '👥' :
                       ach.icon === 'Trophy' ? '🏆' :
                       ach.icon === 'Award' ? '🏅' : '✨'}
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {ach.title}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                        {ach.description}
                      </p>
                    </div>

                    {unlocked ? (
                      <span style={{ fontSize: '0.7rem', color: ach.color, background: `${ach.color}15`, border: `1px solid ${ach.color}30`, borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Unlocked
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Trophy size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Match History & VOD Clips</h2>
            </div>

            {matches.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p>No tournament matches played yet.</p>
              </div>
            ) : (
              <div className="responsive-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Match</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Tournament</th>
                      <th style={{ padding: '0.75rem 1rem' }}>POV Clip / VOD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match: any) => {
                      const isTeam1 = match.team1Members?.includes(profile.uid);
                      const teamPlayedName = isTeam1 ? match.team1Name : match.team2Name;
                      const opponentName = isTeam1 ? match.team2Name : match.team1Name;
                      
                      const isWin = (isTeam1 && match.winnerId === match.team1Id) || 
                                    (!isTeam1 && match.winnerId === match.team2Id);
                      
                      const teamScore = isTeam1 ? match.score1 : match.score2;
                      const oppScore = isTeam1 ? match.score2 : match.score1;

                      const linkedVod = userVods[match.id];

                      return (
                        <tr key={match.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }} className="table-row-hover">
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className={`badge ${isWin ? 'badge-green' : 'badge-red'}`} style={{ minWidth: '24px', textAlign: 'center' }}>
                                {isWin ? 'W' : 'L'}
                              </span>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{teamPlayedName}</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>vs {opponentName}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                            {teamScore} - {oppScore}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                            {match.tournamentName}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {linkedVod ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <a 
                                  href={linkedVod} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--accent-cyan)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    textDecoration: 'none'
                                  }}
                                  className="hover-cyan"
                                >
                                  <Video size={12} /> Play VOD <ExternalLink size={10} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleAttachVod(match.id, linkedVod)}
                                  className="btn btn-outline touch-target"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                                >
                                  Edit Link
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAttachVod(match.id)}
                                className="btn btn-outline touch-target"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                              >
                                <LinkIcon size={10} /> Link VOD Clip
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AI GAME RECOMMENDATIONS DECK */}
        {activeTab === 'details' && (() => {
          const recommendations = recommendGames(selectedGames, preferredRoles);
          const isColdStart = selectedGames.length === 0 && preferredRoles.length === 0;

          return (
            <section className="glass-panel fade-in" style={{ padding: '2.5rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <Gamepad2 size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                  {isColdStart ? 'Popular Games to Get Started' : 'Recommended For You'}
                </h2>
                {isColdStart && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem', textTransform: 'none', marginLeft: '0.5rem' }}>
                    Catalog defaults
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2-col">
                {recommendations.map(({ game, explanation }) => (
                  <article 
                    key={game.id} 
                    className="glass-card table-row-hover" 
                    style={{ 
                      padding: '1.5rem',
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      gap: '1rem',
                      position: 'relative'
                    }}
                    tabIndex={0}
                    aria-label={`Recommended game: ${game.name}. Genre: ${game.genre}. ${explanation}`}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{game.name}</h3>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{game.genre}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                        {game.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontStyle: 'italic' }}>
                        {explanation}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddGameFromRecommendation(game.name)}
                        className="btn btn-outline touch-target"
                        style={{ 
                          width: '100%', 
                          fontSize: '0.8rem', 
                          padding: '0.4rem 0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                        disabled={updating}
                      >
                        <Plus size={14} /> Add to my games
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })()}

      </div>
      {/* Schedule Conflict Selection Modal */}
      {conflictGroup && team && (
        <ScheduleConflictModal
          conflictGroup={conflictGroup}
          teamId={team.id}
          isCaptain={team.captainId === user?.uid}
          onResolved={() => {
            setConflictGroup(null);
            if (team?.id) {
              detectTeamScheduleConflicts(team.id).then(groups => {
                setConflictGroup(groups.length > 0 ? groups[0] : null);
              });
            }
          }}
          onClose={() => setConflictGroup(null)}
        />
      )}
    </main>
  );
}
