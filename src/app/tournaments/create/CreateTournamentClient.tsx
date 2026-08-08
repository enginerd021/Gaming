'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { isAdmin } from '@/lib/adminConfig';
import {
  Trophy,
  Gamepad2,
  Layers,
  DollarSign,
  ArrowLeft,
  Loader,
  AlertCircle,
  Calendar,
  ShieldOff,
} from 'lucide-react';
import Link from 'next/link';

export default function CreateTournamentClient() {
  const user    = useAppStore((state) => state.user);
  const loading = useAppStore((state) => state.loading);
  const router  = useRouter();

  // Form states
  const [name,      setName]      = useState('');
  const [game,      setGame]      = useState('Valorant');
  const [entryType, setEntryType] = useState<'Free' | 'Paid'>('Free');
  const [maxTeams,  setMaxTeams]  = useState<number>(8);
  // startTime stored as an ISO datetime-local string, converted to Timestamp on submit
  const [startTime, setStartTime] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [shake,         setShake]         = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  // ── Auth guard: redirect unauthenticated users ──────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // ── Admin guard: redirect non-admins once auth is resolved ──────
  // This is UX-only. The actual security enforcement is in firestore.rules
  // via isAdminEmail() which checks request.auth.token.email server-side.
  const userIsAdmin = !loading && !!user && isAdmin(user.email);

  if (!loading && user && !userIsAdmin) {
    return (
      <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="glass-panel" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <ShieldOff size={48} style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Admin Access Required</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Only platform admins can create tournaments.
            If you believe this is an error, contact your administrator.
          </p>
          <Link href="/tournaments">
            <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.75rem 2rem' }}>
              Back to Tournaments
            </button>
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 4.5rem)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Verifying admin session...</p>
      </div>
    );
  }

  // ── Form submission ─────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tournament name is required.');
      triggerShake();
      return;
    }

    if (!startTime) {
      setError('Start date & time is required.');
      triggerShake();
      return;
    }

    const startDate = new Date(startTime);
    if (startDate <= new Date()) {
      setError('Start time must be in the future.');
      triggerShake();
      return;
    }

    if (!Number.isInteger(maxTeams) || maxTeams < 2 || maxTeams > 64) {
      setError('Bracket size must be between 2 and 64 teams.');
      triggerShake();
      return;
    }

    setActionLoading(true);

    try {
      // ── 1. Create the tournament document ────────────────────────
      const startTimestamp = Timestamp.fromDate(startDate);
      const tournamentRef = await addDoc(collection(db, 'tournaments'), {
        name:              name.trim(),
        game,
        entryType,
        maxTeams:          Number(maxTeams),
        startTime:         startTimestamp,
        status:            'Upcoming',
        organizerId:       user!.uid,
        registeredTeamIds: [],
        createdAt:         serverTimestamp(),
      });

      // ── 2. Broadcast new_tournament notification to ALL users ───
      // ⚠️ Performance note: this is a client-side fan-out — reads all profile
      // UIDs then writes one notification per user in batched writes (≤500 ops
      // per batch). This is acceptable at hundreds of users but becomes slow
      // and cost-heavy at thousands+. At that scale, a Cloud Function trigger
      // on tournament creation would be the correct solution.
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const uids = profilesSnap.docs.map((d) => d.id);

      const formattedDate = startDate.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      const notifMessage = `New tournament: ${name.trim()} (${game}) — starts ${formattedDate}`;

      // Chunk into batches of 500 (Firestore limit)
      const BATCH_LIMIT = 500;
      for (let i = 0; i < uids.length; i += BATCH_LIMIT) {
        const chunk = uids.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach((uid) => {
          const notifRef = doc(
            collection(db, 'profiles', uid, 'notifications')
          );
          batch.set(notifRef, {
            type:      'new_tournament',
            message:   notifMessage,
            relatedId: tournamentRef.id,
            read:      false,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      router.push('/tournaments');
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      if (err?.code === 'permission-denied') {
        setError('Permission denied. Only admins can create tournaments. If you are an admin, ensure your email is registered in firestore.rules.');
      } else {
        setError(err.message || 'Failed to host tournament.');
      }
      triggerShake();
    } finally {
      setActionLoading(false);
    }
  };

  const uniqueGames = [
    'Valorant', 'League of Legends', 'CS:GO', 'Apex Legends',
    'Rocket League', 'Overwatch 2', 'Fortnite', 'PUBG',
  ];

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className="container" style={{ maxWidth: '600px', position: 'relative', zIndex: 1 }}>

        {/* Back Link */}
        <Link href="/tournaments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }} className="hover-cyan">
          <ArrowLeft size={16} /> Back to Tournaments
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Trophy size={28} style={{ color: 'var(--accent-cyan)' }} />
          <h1 style={{ fontSize: '1.75rem' }}>Host Tournament</h1>
        </div>

        {/* Error banner */}
        <div aria-live="assertive">
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'hsla(350, 85%, 55%, 0.12)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px', padding: '0.75rem 1rem',
              marginBottom: '1.5rem', color: 'var(--accent-red)', fontSize: '0.9rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Creation Form */}
        <form onSubmit={handleCreate} className={`glass-panel ${shake ? 'shake' : ''}`} style={{ padding: '2.5rem' }}>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="create-tourney-name" className="form-label">Tournament Name</label>
            <div className="input-glow-wrapper">
              <Trophy size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <input
                id="create-tourney-name"
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. Winter Valorant Clash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={actionLoading}
                required
              />
            </div>
          </div>

          {/* Game */}
          <div className="form-group">
            <label htmlFor="create-tourney-game" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Gamepad2 size={16} style={{ color: 'var(--accent-cyan)' }} />
              Select Game
            </label>
            <select
              id="create-tourney-game"
              className="glass-input glass-select"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              disabled={actionLoading}
            >
              {uniqueGames.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div className="form-group">
            <label htmlFor="create-tourney-starttime" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} style={{ color: 'var(--accent-violet)' }} />
              Start Date &amp; Time
            </label>
            <div className="input-glow-wrapper">
              <input
                id="create-tourney-starttime"
                type="datetime-local"
                className="glass-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={actionLoading}
                required
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Must be at least 1 minute in the future.
            </p>
          </div>

          {/* Bracket size & Entry type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2-col">

            {/* Max Teams */}
            <div className="form-group">
              <label htmlFor="create-tourney-maxteams" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} style={{ color: 'var(--accent-violet)' }} />
                Bracket Size
              </label>
              <select
                id="create-tourney-maxteams"
                className="glass-input glass-select"
                value={maxTeams}
                onChange={(e) => setMaxTeams(Number(e.target.value))}
                disabled={actionLoading}
              >
                <option value={4}>4 Rosters (2 Rounds)</option>
                <option value={8}>8 Rosters (3 Rounds)</option>
                <option value={16}>16 Rosters (4 Rounds)</option>
                <option value={32}>32 Rosters (5 Rounds)</option>
                <option value={64}>64 Rosters (6 Rounds)</option>
              </select>
            </div>

            {/* Entry Type */}
            <div className="form-group">
              <label htmlFor="create-tourney-entrytype" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={16} style={{ color: 'var(--accent-cyan)' }} />
                Registration Access
              </label>
              <select
                id="create-tourney-entrytype"
                className="glass-input glass-select"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as any)}
                disabled={actionLoading}
              >
                <option value="Free">Free to Join</option>
                <option value="Paid">Paid Entry (Ticket/Pass Required)</option>
              </select>
            </div>

          </div>

          {/* Submit */}
          <button
            type="submit"
            id="create-tourney-submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', height: '3rem' }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Creating Tournament...' : 'Launch Tournament'}
          </button>
        </form>

      </div>
    </main>
  );
}
