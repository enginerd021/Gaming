'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { isAdmin } from '@/lib/adminConfig';
import {
  Users,
  Trophy,
  Shield,
  Plus,
  Loader,
  ArrowRight,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Eye,
  Zap,
  Search,
  Ban,
  VolumeX,
  Volume2,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';

interface TournamentRow {
  id: string;
  name: string;
  game: string;
  status: string;
  registeredTeamIds: string[];
  maxTeams: number;
  entryType: string;
  entryFee?: number;
  createdAt: number;
  startDate?: number;
  cancelledReason?: string;
}

interface PlayerRow {
  id: string;
  gamertag: string;
  displayName?: string;
  email?: string;
  role?: string;
  skillLevel?: string;
  isBanned?: boolean;
  bannedReason?: string;
  isMuted?: boolean;
  createdAt?: number;
}

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}

export default function AdminClient() {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const loading = useAppStore((s) => s.loading);
  const logout = useAppStore((s) => s.logout);
  const router = useRouter();

  const [stats, setStats] = useState({ users: 0, tournaments: 0, teams: 0, activeTournaments: 0, bannedUsers: 0 });
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'tournaments'>('overview');

  // Player search & filter state
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerFilter, setPlayerFilter] = useState<'all' | 'active' | 'banned' | 'muted'>('all');

  // Ban modal state
  const [selectedPlayerForBan, setSelectedPlayerForBan] = useState<PlayerRow | null>(null);
  const [banReason, setBanReason] = useState('Violation of Community Guidelines');
  const [banningActionLoading, setBanningActionLoading] = useState(false);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin(user.email))) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersCountSnap, tournamentsSnap, teamsSnap, profilesSnap, mutesSnap] = await Promise.all([
        getCountFromServer(collection(db, 'profiles')),
        getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(100))),
        getCountFromServer(collection(db, 'teams')),
        getDocs(query(collection(db, 'profiles'), limit(150))),
        getDocs(collection(db, 'mutedUsers')),
      ]);

      const mutedUidSet = new Set(mutesSnap.docs.map((d) => d.id));

      const pRows: PlayerRow[] = profilesSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          gamertag: data.gamertag || 'Unknown',
          displayName: data.displayName || data.gamertag || '',
          email: data.email || '',
          role: data.role || 'player',
          skillLevel: data.skillLevel || 'Intermediate',
          isBanned: !!data.isBanned,
          bannedReason: data.bannedReason || '',
          isMuted: mutedUidSet.has(d.id),
          createdAt: data.createdAt || 0,
        };
      });

      const tRows: TournamentRow[] = tournamentsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TournamentRow, 'id'>),
      }));

      const activeCount = tRows.filter((t) => t.status === 'Active').length;
      const bannedCount = pRows.filter((p) => p.isBanned).length;

      setStats({
        users: usersCountSnap.data().count,
        tournaments: tournamentsSnap.size,
        teams: teamsSnap.data().count,
        activeTournaments: activeCount,
        bannedUsers: bannedCount,
      });
      setTournaments(tRows);
      setPlayers(pRows);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin(user.email)) {
      fetchData();
    }
  }, [user]);

  const handleStatusChange = async (tournamentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tournaments', tournamentId), { status: newStatus });
      setTournaments((prev) =>
        prev.map((t) => (t.id === tournamentId ? { ...t, status: newStatus } : t))
      );
      showMsg('success', `Tournament marked as ${newStatus}.`);
    } catch {
      showMsg('error', 'Failed to update tournament status.');
    }
  };

  const handleDeleteTournament = async (tournamentId: string, name: string) => {
    if (!confirm(`Delete tournament "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
      setStats((s) => ({ ...s, tournaments: s.tournaments - 1 }));
      showMsg('success', `Tournament "${name}" deleted.`);
    } catch {
      showMsg('error', 'Failed to delete tournament.');
    }
  };

  // BAN PLAYER
  const confirmBanPlayer = async () => {
    if (!selectedPlayerForBan) return;
    setBanningActionLoading(true);
    try {
      await updateDoc(doc(db, 'profiles', selectedPlayerForBan.id), {
        isBanned: true,
        bannedReason: banReason.trim() || 'Account suspended by administrator.',
        bannedAt: Date.now(),
      });
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === selectedPlayerForBan.id
            ? { ...p, isBanned: true, bannedReason: banReason.trim() }
            : p
        )
      );
      setStats((s) => ({ ...s, bannedUsers: s.bannedUsers + 1 }));
      showMsg('success', `Player @${selectedPlayerForBan.gamertag} has been BANNED.`);
      setSelectedPlayerForBan(null);
    } catch (err) {
      console.error('Ban error:', err);
      showMsg('error', 'Failed to ban player.');
    } finally {
      setBanningActionLoading(false);
    }
  };

  // UNBAN PLAYER
  const handleUnbanPlayer = async (player: PlayerRow) => {
    if (!confirm(`Unban player @${player.gamertag}?`)) return;
    try {
      await updateDoc(doc(db, 'profiles', player.id), {
        isBanned: false,
        bannedReason: null,
        unbannedAt: Date.now(),
      });
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, isBanned: false, bannedReason: '' } : p))
      );
      setStats((s) => ({ ...s, bannedUsers: Math.max(0, s.bannedUsers - 1) }));
      showMsg('success', `Player @${player.gamertag} has been UNBANNED.`);
    } catch {
      showMsg('error', 'Failed to unban player.');
    }
  };

  // MUTE / UNMUTE PLAYER
  const handleToggleMutePlayer = async (player: PlayerRow) => {
    try {
      if (player.isMuted) {
        await deleteDoc(doc(db, 'mutedUsers', player.id));
        setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, isMuted: false } : p)));
        showMsg('success', `@${player.gamertag} has been UNMUTED from chat.`);
      } else {
        await setDoc(doc(db, 'mutedUsers', player.id), {
          uid: player.id,
          gamertag: player.gamertag,
          mutedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
          reason: 'Muted by Administrator',
          createdAt: Date.now(),
        });
        setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, isMuted: true } : p)));
        showMsg('success', `@${player.gamertag} has been MUTED in chat for 30 days.`);
      }
    } catch {
      showMsg('error', 'Failed to toggle player mute status.');
    }
  };

  // DELETE PLAYER PROFILE
  const handleDeletePlayer = async (player: PlayerRow) => {
    if (!confirm(`DELETE player profile @${player.gamertag}? This will permanently remove their profile data.`)) return;
    try {
      await deleteDoc(doc(db, 'profiles', player.id));
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      setStats((s) => ({ ...s, users: Math.max(0, s.users - 1) }));
      showMsg('success', `Player profile @${player.gamertag} deleted.`);
    } catch {
      showMsg('error', 'Failed to delete player profile.');
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  // Filtered Players
  const filteredPlayers = players.filter((p) => {
    const q = playerSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.gamertag.toLowerCase().includes(q) ||
      (p.displayName && p.displayName.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (playerFilter === 'banned') return p.isBanned;
    if (playerFilter === 'muted') return p.isMuted;
    if (playerFilter === 'active') return !p.isBanned && !p.isMuted;
    return true;
  });

  if (loading || loadingData) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#02040a', flexDirection: 'column', gap: '1rem'
      }}>
        <Loader size={36} style={{ color: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Admin Panel...</p>
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) return null;

  const statCards: StatCard[] = [
    {
      label: 'Total Players Registered', value: stats.users,
      icon: <Users size={22} />,
      color: 'var(--accent-cyan)', glow: '0 0 20px rgba(0, 240, 255, 0.3)'
    },
    {
      label: 'Total Tournaments', value: stats.tournaments,
      icon: <Trophy size={22} />,
      color: 'var(--accent-gold)', glow: '0 0 20px rgba(255, 200, 0, 0.3)'
    },
    {
      label: 'Active Tournaments', value: stats.activeTournaments,
      icon: <Zap size={22} />,
      color: '#22d3ee', glow: '0 0 20px rgba(34, 211, 238, 0.3)'
    },
    {
      label: 'Banned Players', value: stats.bannedUsers,
      icon: <Ban size={22} />,
      color: '#ff4d4d', glow: '0 0 20px rgba(255, 77, 77, 0.3)'
    },
  ];

  const statusColor: Record<string, string> = {
    Upcoming: '#60a5fa',
    Active: '#34d399',
    Completed: '#94a3b8',
  };

  const statusIcon: Record<string, React.ReactNode> = {
    Upcoming: <Clock size={12} />,
    Active: <CheckCircle size={12} />,
    Completed: <XCircle size={12} />,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#02040a', color: 'var(--text-primary)' }}>
      {/* ── Top Admin Header ── */}
      <div style={{
        background: 'rgba(6, 12, 26, 0.98)',
        borderBottom: '1px solid rgba(176, 38, 255, 0.25)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={22} style={{ color: 'var(--accent-violet)' }} />
          <span style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>Shakt</span><span style={{ color: 'var(--accent-violet)' }}>rix</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '0.75rem', marginLeft: '0.5rem' }}>ADMIN PANEL</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {profile?.gamertag || user.email}
          </span>
          <span style={{
            padding: '0.15rem 0.6rem', borderRadius: '9999px',
            background: 'rgba(176, 38, 255, 0.15)', border: '1px solid rgba(176, 38, 255, 0.4)',
            color: 'var(--accent-violet)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em'
          }}>
            ADMIN
          </span>
          <Link href="/tournaments" style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            padding: '0.35rem 0.75rem', borderRadius: '8px',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s',
          }}>
            <Trophy size={14} /> Tournaments
          </Link>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', color: 'var(--accent-red)',
            background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.25)',
            borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Page Title & Controls ── */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', margin: 0 }}>
              Admin <span style={{ color: 'var(--accent-cyan)' }}>Control Center</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
              Manage players, ban/unban users, and control esports tournaments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchData}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '0.5rem 1rem',
                color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <Link href="/tournaments/create" style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)',
              color: '#fff', borderRadius: '8px', padding: '0.5rem 1.25rem',
              fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.25)', transition: 'all 0.2s',
            }}>
              <Plus size={16} /> Create Tournament
            </Link>
          </div>
        </div>

        {/* ── Toast Notification Message ── */}
        {actionMsg && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: actionMsg.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 80, 80, 0.1)',
            border: `1px solid ${actionMsg.type === 'success' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 80, 80, 0.35)'}`,
            color: actionMsg.type === 'success' ? '#34d399' : '#ff6b6b',
          }}>
            {actionMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {actionMsg.text}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}>
          {statCards.map((card) => (
            <div key={card.label} style={{
              background: 'rgba(6, 12, 26, 0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
              }} />
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${card.color}18`,
                border: `1px solid ${card.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color, marginBottom: '1rem',
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-title)', lineHeight: 1, color: '#fff' }}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontWeight: 600 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs Navigation ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(
            [
              { id: 'overview', label: '📊 Overview' },
              { id: 'players', label: '👥 Players & Ban Management' },
              { id: 'tournaments', label: '🏆 Tournaments Control' },
            ] as const
          ).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
              border: activeTab === tab.id ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid var(--border-color)',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: OVERVIEW */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Quick Actions Panel */}
            <div style={{
              background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-cyan)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Settings size={14} /> Quick Admin Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Create New Tournament', href: '/tournaments/create', icon: <Plus size={16} />, color: 'var(--accent-cyan)' },
                  { label: 'Search & Ban Players', onClick: () => setActiveTab('players'), icon: <Ban size={16} />, color: '#ff4d4d' },
                  { label: 'Manage Tournaments & Status', onClick: () => setActiveTab('tournaments'), icon: <Trophy size={16} />, color: 'var(--accent-gold)' },
                  { label: 'Chat Moderation Panel', href: '/chat', icon: <Shield size={16} />, color: '#34d399' },
                ].map((action, idx) => (
                  action.href ? (
                    <Link key={idx} href={action.href} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.9rem 1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: action.color }}>
                        {action.icon} <span style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                      </span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </Link>
                  ) : (
                    <button key={idx} onClick={action.onClick} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.9rem 1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem',
                      cursor: 'pointer', width: '100%', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: action.color }}>
                        {action.icon} <span style={{ color: 'var(--text-primary)' }}>{action.label}</span>
                      </span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Recent Registered Players Overview */}
            <div style={{
              background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} /> Registered Players ({players.length})
                </h3>
                <button onClick={() => setActiveTab('players')} style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  Manage All →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {players.slice(0, 5).map((p) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        @{p.gamertag}
                        {p.isBanned && (
                          <span style={{ fontSize: '0.6rem', background: '#ff4d4d20', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Banned
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {p.displayName} {p.email ? `(${p.email})` : ''}
                      </div>
                    </div>
                    {p.isBanned ? (
                      <button onClick={() => handleUnbanPlayer(p)} style={{ fontSize: '0.7rem', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>
                        Unban
                      </button>
                    ) : (
                      <button onClick={() => setSelectedPlayerForBan(p)} style={{ fontSize: '0.7rem', color: '#ff4d4d', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>
                        Ban
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: PLAYERS & BAN MANAGEMENT */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'players' && (
          <div style={{
            background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            {/* Player Search & Controls Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} style={{ color: 'var(--accent-cyan)' }} /> Player Management &amp; Moderation
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Search registered players and apply immediate bans or mutes.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search gamertag, name, email..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem 0.5rem 2.4rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Sub-filters */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: 700 }}>Filter Status:</span>
              {(['all', 'active', 'banned', 'muted'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPlayerFilter(f)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: playerFilter === f ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    border: playerFilter === f ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid var(--border-color)',
                    color: playerFilter === f ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  }}
                >
                  {f} ({
                    f === 'all' ? players.length :
                    f === 'banned' ? players.filter(p => p.isBanned).length :
                    f === 'muted' ? players.filter(p => p.isMuted).length :
                    players.filter(p => !p.isBanned && !p.isMuted).length
                  })
                </button>
              ))}
            </div>

            {/* Players Table */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 180px',
              padding: '0.6rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-muted)',
            }}>
              <span>Player</span>
              <span>Email</span>
              <span>Skill Level</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {filteredPlayers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No players match your search filter.
              </div>
            ) : (
              filteredPlayers.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 180px',
                  padding: '0.85rem 1.5rem',
                  alignItems: 'center',
                  borderBottom: i < filteredPlayers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}>
                  {/* Gamertag & Name */}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff' }}>
                      @{p.gamertag}
                    </div>
                    {p.displayName && p.displayName !== p.gamertag && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{p.displayName}</div>
                    )}
                    {p.bannedReason && (
                      <div style={{ fontSize: '0.68rem', color: '#ff4d4d', marginTop: '0.15rem' }}>
                        Ban Reason: {p.bannedReason}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.email || '—'}</span>

                  {/* Skill Level */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.skillLevel || 'Intermediate'}</span>

                  {/* Status Badge */}
                  <div>
                    {p.isBanned ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: '#ff4d4d', background: '#ff4d4d18', border: '1px solid #ff4d4d35',
                        padding: '0.2rem 0.55rem', borderRadius: '9999px',
                      }}>
                        <UserX size={12} /> BANNED
                      </span>
                    ) : p.isMuted ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: '#fbbf24', background: '#fbbf2418', border: '1px solid #fbbf2435',
                        padding: '0.2rem 0.55rem', borderRadius: '9999px',
                      }}>
                        <VolumeX size={12} /> MUTED
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: '#34d399', background: '#34d39918', border: '1px solid #34d39935',
                        padding: '0.2rem 0.55rem', borderRadius: '9999px',
                      }}>
                        <UserCheck size={12} /> ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {/* Ban / Unban */}
                    {p.isBanned ? (
                      <button
                        onClick={() => handleUnbanPlayer(p)}
                        title="Unban player"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.7rem', fontWeight: 700, color: '#34d399',
                          background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)',
                          borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer',
                        }}
                      >
                        <UserCheck size={12} /> Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPlayerForBan(p)}
                        title="Ban player"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          fontSize: '0.7rem', fontWeight: 700, color: '#ff4d4d',
                          background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)',
                          borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer',
                        }}
                      >
                        <Ban size={12} /> Ban
                      </button>
                    )}

                    {/* Mute / Unmute */}
                    <button
                      onClick={() => handleToggleMutePlayer(p)}
                      title={p.isMuted ? 'Unmute' : 'Mute chat'}
                      style={{
                        width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.isMuted ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: p.isMuted ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--border-color)',
                        borderRadius: '6px', color: p.isMuted ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer',
                      }}
                    >
                      {p.isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    </button>

                    {/* Delete Profile */}
                    <button
                      onClick={() => handleDeletePlayer(p)}
                      title="Delete player profile"
                      style={{
                        width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.2)',
                        borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: TOURNAMENTS CONTROL */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'tournaments' && (
          <div style={{
            background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={14} /> All Tournaments ({tournaments.length})
              </h3>
              <Link href="/tournaments/create" style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)',
                background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '8px', padding: '0.4rem 0.9rem',
              }}>
                <Plus size={13} /> New Tournament
              </Link>
            </div>

            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 130px',
              padding: '0.6rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-muted)',
            }}>
              <span>Tournament</span>
              <span>Game</span>
              <span>Teams</span>
              <span>Entry</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {/* Rows */}
            {tournaments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No tournaments yet. <Link href="/tournaments/create" style={{ color: 'var(--accent-cyan)' }}>Create one →</Link>
              </div>
            ) : (
              tournaments.map((t, i) => (
                <div key={t.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 130px',
                  padding: '1rem 1.5rem',
                  alignItems: 'center',
                  borderBottom: i < tournaments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}>
                  {/* Name */}
                  <div>
                    <Link href={`/tournaments/${t.id}`} style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                      {t.name}
                    </Link>
                    {t.cancelledReason && (
                      <div style={{ fontSize: '0.68rem', color: '#ff6b6b', marginTop: '0.15rem' }}>
                        ⚠️ {t.cancelledReason}
                      </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No date set'}
                    </div>
                  </div>
                  {/* Game */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.game}</span>
                  {/* Teams */}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {t.registeredTeamIds?.length ?? 0} / {t.maxTeams}
                  </span>
                  {/* Entry */}
                  <span style={{ fontSize: '0.78rem', color: t.entryType === 'Paid' ? 'var(--accent-gold)' : '#34d399' }}>
                    {t.entryType === 'Paid' ? `₹${t.entryFee ?? 100}` : 'Free'}
                  </span>
                  {/* Status Badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: statusColor[t.status] || 'var(--text-muted)',
                    background: `${statusColor[t.status] || 'var(--text-muted)'}18`,
                    border: `1px solid ${statusColor[t.status] || 'var(--text-muted)'}35`,
                    padding: '0.2rem 0.6rem', borderRadius: '9999px', width: 'fit-content',
                  }}>
                    {statusIcon[t.status]} {t.status}
                  </span>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Link
                      href={`/tournaments/${t.id}`}
                      title="View tournament"
                      style={{
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '6px', color: 'var(--accent-cyan)', cursor: 'pointer',
                      }}
                    >
                      <Eye size={13} />
                    </Link>
                    {t.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(t.id, t.status === 'Upcoming' ? 'Active' : 'Completed')}
                        title={t.status === 'Upcoming' ? 'Activate' : 'Mark Completed'}
                        style={{
                          width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)',
                          borderRadius: '6px', color: '#34d399', cursor: 'pointer',
                        }}
                      >
                        {t.status === 'Upcoming' ? <Zap size={13} /> : <CheckCircle size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTournament(t.id, t.name)}
                      title="Delete tournament"
                      style={{
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.2)',
                        borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* BAN PLAYER MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {selectedPlayerForBan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(2, 6, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px',
            background: 'rgba(6, 12, 26, 0.98)', border: '1px solid rgba(255, 77, 77, 0.4)',
            borderRadius: '16px', padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(255, 77, 77, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ff4d4d', marginBottom: '1rem' }}>
              <AlertTriangle size={24} />
              <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>Ban Player Account</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              You are banning <strong style={{ color: '#fff' }}>@{selectedPlayerForBan.gamertag}</strong>. This will restrict their access to tournaments and platform features.
            </p>

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Reason for Ban
            </label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g. Toxic behavior, Cheating, Match fixing..."
              style={{
                width: '100%', padding: '0.6rem 0.85rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none',
                marginBottom: '1.5rem'
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedPlayerForBan(null)}
                style={{
                  padding: '0.5rem 1.25rem', background: 'transparent',
                  border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBanPlayer}
                disabled={banningActionLoading}
                style={{
                  padding: '0.5rem 1.25rem', background: '#ff4d4d',
                  border: 'none', borderRadius: '8px',
                  color: '#fff', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(255, 77, 77, 0.4)'
                }}
              >
                {banningActionLoading ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
