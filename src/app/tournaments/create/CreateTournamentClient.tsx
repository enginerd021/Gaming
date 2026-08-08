'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Gamepad2, Layers, DollarSign, ArrowLeft, Loader, AlertCircle, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CreateTournamentClient() {
  const user = useAppStore((state) => state.user);
  const loading = useAppStore((state) => state.loading);
  const router = useRouter();

  // Helper to format ISO datetime-local string (default 1 hour from now)
  const getDefaultStartDateStr = () => {
    const d = new Date(Date.now() + 3600000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Form states
  const [name, setName] = useState('');
  const [game, setGame] = useState('Valorant');
  const [entryType, setEntryType] = useState<'Free' | 'Paid'>('Free');
  const [maxTeams, setMaxTeams] = useState<number>(4);
  const [startDateStr, setStartDateStr] = useState<string>(getDefaultStartDateStr());
  const [roundDurationMins, setRoundDurationMins] = useState<number>(45);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Calculate estimated end time dynamically
  const rounds = Math.max(1, Math.ceil(Math.log2(maxTeams)));
  const effectiveRoundMins = Math.max(45, Number(roundDurationMins) || 45);
  const totalDurationMins = rounds * effectiveRoundMins;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Tournament name is required.");
      triggerShake();
      return;
    }

    if (!startDateStr) {
      setError("Please select a tournament start date & time.");
      triggerShake();
      return;
    }

    const startTimestamp = new Date(startDateStr).getTime();
    if (isNaN(startTimestamp)) {
      setError("Invalid start date format.");
      triggerShake();
      return;
    }

    if (effectiveRoundMins < 45) {
      setError("Each round must be allocated AT LEAST 45 minutes.");
      triggerShake();
      return;
    }

    const estimatedEndTime = startTimestamp + totalDurationMins * 60 * 1000;

    setActionLoading(true);

    try {
      await addDoc(collection(db, "tournaments"), {
        name: name.trim(),
        game,
        entryType,
        maxTeams: Number(maxTeams),
        status: 'Upcoming',
        organizerId: user!.uid,
        registeredTeamIds: [],
        bracket: {
          matches: []
        },
        startDate: startTimestamp,
        roundDurationMins: effectiveRoundMins,
        estimatedEndTime: estimatedEndTime,
        createdAt: Date.now()
      });

      router.push('/tournaments');
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      setError(err.message || "Failed to host tournament.");
      triggerShake();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 4.5rem)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader className="animate-spin text-cyan" size={40} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Verifying organizer session...</p>
      </div>
    );
  }

  const uniqueGames = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];

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

        {/* Assertive live region for validation error announcer */}
        <div aria-live="assertive">
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'hsla(350, 85%, 55%, 0.12)',
              border: '1px solid var(--accent-red)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--accent-red)',
              fontSize: '0.9rem'
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

          {/* Start Date & Time */}
          <div className="form-group">
            <label htmlFor="create-tourney-startdate" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
              Tournament Start Schedule
            </label>
            <input
              id="create-tourney-startdate"
              type="datetime-local"
              className="glass-input"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              disabled={actionLoading}
            />
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
              </select>
            </div>

            {/* Round Duration */}
            <div className="form-group">
              <label htmlFor="create-tourney-roundmins" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
                Round Allocation (mins)
              </label>
              <input
                id="create-tourney-roundmins"
                type="number"
                min={45}
                className="glass-input"
                value={roundDurationMins}
                onChange={(e) => setRoundDurationMins(Math.max(45, Number(e.target.value)))}
                disabled={actionLoading}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Min 45 mins per round
              </span>
            </div>

          </div>

          {/* Access Type */}
          <div className="form-group">
            <label htmlFor="create-tourney-entrytype" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={16} style={{ color: 'var(--accent-gold)' }} />
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

          {/* Schedule Summary Preview */}
          <div style={{
            background: 'hsla(185, 85%, 50%, 0.05)',
            border: '1px solid hsla(185, 85%, 50%, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
              Est. Schedule Summary:
            </div>
            <div>Total Rounds: <strong>{rounds} rounds</strong></div>
            <div>Time per round: <strong>{effectiveRoundMins} mins</strong> (Rule: min 45m)</div>
            <div>Est. Total Duration: <strong>{totalDurationMins} minutes ({Math.floor(totalDurationMins / 60)}h {totalDurationMins % 60}m)</strong></div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', height: '3rem' }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Launching Tournament...' : 'Launch Tournament'}
          </button>
        </form>

      </div>
    </main>
  );
}
