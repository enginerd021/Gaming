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

  const [stats, setStats] = useState({ users: 0, tournaments: 0, teams: 0, activeTournaments: 0 });
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments'>('overview');

  // Guard: redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin(user.email))) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [usersSnap, tournamentsSnap, teamsSnap] = await Promise.all([
        getCountFromServer(collection(db, 'profiles')),
        getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(50))),
        getCountFromServer(collection(db, 'teams')),
      ]);

      const tRows: TournamentRow[] = tournamentsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TournamentRow, 'id'>),
      }));

      const active = tRows.filter((t) => t.status === 'Active').length;

      setStats({
        users: usersSnap.data().count,
        tournaments: tournamentsSnap.size,
        teams: teamsSnap.data().count,
        activeTournaments: active,
      });
      setTournaments(tRows);
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

  const handleDelete = async (tournamentId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
      setStats((s) => ({ ...s, tournaments: s.tournaments - 1 }));
      showMsg('success', `Tournament "${name}" deleted.`);
    } catch {
      showMsg('error', 'Failed to delete tournament.');
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  if (loading || loadingData) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#02040a', flexDirection: 'column', gap: '1rem'
      }}>
        <Loader size={36} style={{ color: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading admin panel...</p>
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) return null;

  const statCards: StatCard[] = [
    {
      label: 'Total Users', value: stats.users,
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
      label: 'Total Teams', value: stats.teams,
      icon: <Shield size={22} />,
      color: 'var(--accent-violet)', glow: '0 0 20px rgba(176, 38, 255, 0.3)'
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
      {/* ── Top Admin Bar ── */}
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
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '0.75rem', marginLeft: '0.5rem' }}>ADMIN</span>
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
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            padding: '0.35rem 0.75rem', borderRadius: '8px',
            border: '1px solid var(--border-color)',
            transition: 'all 0.2s',
          }}>
            <Eye size={14} /> View Site
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

        {/* ── Page Title ── */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', margin: 0 }}>
              Admin <span style={{ color: 'var(--accent-cyan)' }}>Dashboard</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
              Platform management and tournament control center
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
              {refreshing ? 'Refreshing...' : 'Refresh'}
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

        {/* ── Action Message Toast ── */}
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
              transition: 'transform 0.2s, box-shadow 0.2s',
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

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['overview', 'tournaments'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
              border: activeTab === tab ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-color)',
              color: activeTab === tab ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            }}>
              {tab === 'overview' ? '📊 Overview' : '🏆 Tournaments'}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Quick Actions */}
            <div style={{
              background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-cyan)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Settings size={14} /> Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Create Tournament', href: '/tournaments/create', icon: <Plus size={16} />, color: 'var(--accent-cyan)' },
                  { label: 'View All Tournaments', href: '/tournaments', icon: <Trophy size={16} />, color: 'var(--accent-gold)' },
                  { label: 'View Leaderboard', href: '/leaderboard', icon: <BarChart3 size={16} />, color: 'var(--accent-violet)' },
                  { label: 'Chat Moderation', href: '/chat', icon: <Shield size={16} />, color: '#34d399' },
                ].map((action) => (
                  <Link key={action.href} href={action.href} style={{
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
                ))}
              </div>
            </div>

            {/* Recent Tournaments Summary */}
            <div style={{
              background: 'rgba(6, 12, 26, 0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trophy size={14} /> Recent Tournaments
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {tournaments.slice(0, 6).map((t) => (
                  <Link key={t.id} href={`/tournaments/${t.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px', color: 'var(--text-primary)',
                    transition: 'background 0.2s',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {t.game} · {t.registeredTeamIds?.length ?? 0}/{t.maxTeams} teams
                      </div>
                    </div>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: statusColor[t.status] || 'var(--text-muted)',
                      background: `${statusColor[t.status] || 'var(--text-muted)'}18`,
                      border: `1px solid ${statusColor[t.status] || 'var(--text-muted)'}35`,
                      padding: '0.2rem 0.55rem', borderRadius: '9999px',
                    }}>
                      {statusIcon[t.status]} {t.status}
                    </span>
                  </Link>
                ))}
                {tournaments.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0', textAlign: 'center' }}>
                    No tournaments found.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ── Tournaments Tab ── */}
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
                <Plus size={13} /> New
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
                  transition: 'background 0.2s',
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
                        borderRadius: '6px', color: 'var(--accent-cyan)', cursor: 'pointer', transition: 'all 0.2s',
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
                          borderRadius: '6px', color: '#34d399', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {t.status === 'Upcoming' ? <Zap size={13} /> : <CheckCircle size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      title="Delete tournament"
                      style={{
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255, 60, 60, 0.2)',
                        borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', transition: 'all 0.2s',
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
