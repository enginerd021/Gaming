'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { useAppStore } from '@/store/useAppStore';
import { isAdmin } from '@/lib/adminConfig';
import { Trophy, Search, Gamepad2, PlusCircle, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import { TournamentCountdown } from '@/components/TournamentCountdown';
import { getEffectiveTournamentStatus, autoCheckTournamentStatus } from '@/lib/tournamentUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TournamentsView() {
  const user    = useAppStore((state) => state.user);
  // UX-only guard: used to show/hide the Create Tournament button.
  // Real security enforcement is in firestore.rules → isAdminEmail().
  const userIsAdmin = !!user && isAdmin(user.email);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEntryType, setSelectedEntryType] = useState('All');

  useEffect(() => {
    const unsub = tournamentService.subscribeAllTournaments(
      (list) => {
        list.forEach(t => autoCheckTournamentStatus(t));
        setTournaments(list);
        setLoading(false);

        // Asynchronously sync any status changes (e.g. auto-ended or active) to Firestore
        list.forEach(async (t) => {
          const effStatus = getEffectiveTournamentStatus(t);
          if (effStatus !== t.status) {
            try {
              await updateDoc(doc(db, "tournaments", t.id), { status: effStatus });
            } catch (err) {
              console.error("Auto status sync failed for tournament:", t.id, err);
            }
          }
        });
      },
      () => setLoading(false)
    );

    return () => {
      unsub();
    };
  }, []);

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'Upcoming':
        return (
          <Badge variant="cyan">
            Upcoming
            <span 
              style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: '#00ff88', 
                boxShadow: '0 0 6px #00ff88',
                display: 'inline-block',
                marginLeft: '0.35rem',
                verticalAlign: 'middle'
              }} 
              aria-hidden="true" 
            />
          </Badge>
        );
      case 'Active':
        return <Badge variant="live">Live</Badge>;
      case 'Completed':
        return <Badge variant="gold">Completed</Badge>;
      default:
        return <Badge variant="cyan">{status}</Badge>;
    }
  };

  // Derive games list
  const uniqueGames = Array.from(new Set(tournaments.map(t => t.game).filter(Boolean)));

  // Filter tournaments
  const filteredTournaments = tournaments.filter(t => {
    const effectiveStatus = getEffectiveTournamentStatus(t);
    const matchesSearch = !searchTerm.trim() || 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.game.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGame = selectedGame === 'All' || t.game.toLowerCase() === selectedGame.toLowerCase();
    const matchesStatus = selectedStatus === 'All' || effectiveStatus === selectedStatus;
    const matchesEntry = selectedEntryType === 'All' || (t.entryType || 'Free') === selectedEntryType;

    return matchesSearch && matchesGame && matchesStatus && matchesEntry;
  });

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Background Decorative Glows */}
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Trophy size={32} style={{ color: 'var(--accent-cyan)' }} />
              <h1 style={{ fontSize: '2.25rem' }}>Tournaments Hub</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Compete in official brackets, track live match progression, and claim championship points.
            </p>
          </div>

          {/* Only admins can create tournaments (UX gate; real enforcement is in firestore.rules) */}
          {userIsAdmin && (
            <Link href="/tournaments/create">
              <Button variant="primary" style={{ borderRadius: '9999px', padding: '0.75rem 1.5rem' }}>
                <PlusCircle size={18} />
                Create Tournament
              </Button>
            </Link>
          )}
        </div>

        {/* Filters Panel */}
        <div className="glass-panel filters-layout" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Search */}
          <div style={{ flex: '1 0 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <label htmlFor="search-input" className="sr-only">Search tournaments</label>
            <input
              id="search-input"
              type="text"
              className="glass-input"
              style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '1rem' }}
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search query"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Game filter */}
          <div style={{ flex: '1 0 160px' }}>
            <label htmlFor="game-filter" className="sr-only">Filter by Game</label>
            <select
              id="game-filter"
              className="glass-input glass-select"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              <option value="All">All Games</option>
              {uniqueGames.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div style={{ flex: '1 0 140px' }}>
            <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
            <select
              id="status-filter"
              className="glass-input glass-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Live</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Entry Type filter */}
          <div style={{ flex: '1 0 140px' }}>
            <label htmlFor="entry-type-filter" className="sr-only">Filter by Entry Fee</label>
            <select
              id="entry-type-filter"
              className="glass-input glass-select"
              value={selectedEntryType}
              onChange={(e) => setSelectedEntryType(e.target.value)}
            >
              <option value="All">All Fees</option>
              <option value="Free">Free Entry</option>
              <option value="Paid">Paid Entry</option>
            </select>
          </div>

        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="grid-responsive">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-panel skeleton-pulse" style={{ padding: '2rem', height: '240px' }} />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <GlassCard variant="panel" style={{ 
            textAlign: 'center', 
            padding: '3.5rem 2rem', 
            border: '1px solid rgba(255, 42, 109, 0.3)',
            background: 'radial-gradient(circle at center, rgba(255, 42, 109, 0.08) 0%, rgba(6, 12, 28, 0.95) 100%)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--accent-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem auto', color: 'var(--accent-red)'
            }}>
              <Trophy size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              No Tournaments Available
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem auto', lineHeight: 1.6, fontSize: '0.98rem' }}>
              {searchTerm || selectedGame !== 'All' || selectedStatus !== 'All' || selectedEntryType !== 'All' ? (
                <>No competitive brackets matched your selected filter criteria. Try adjusting your filters or resetting search parameters.</>
              ) : (
                <>There are currently no live or upcoming tournaments listed in the platform directory.</>
              )}
            </p>

            {/* Active Filter Tags */}
            {(searchTerm || selectedGame !== 'All' || selectedStatus !== 'All' || selectedEntryType !== 'All') && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
                {searchTerm && <Badge variant="red">Search: &quot;{searchTerm}&quot;</Badge>}
                {selectedGame !== 'All' && <Badge variant="cyan">Game: {selectedGame}</Badge>}
                {selectedStatus !== 'All' && <Badge variant="gold">Status: {selectedStatus}</Badge>}
                {selectedEntryType !== 'All' && <Badge variant="violet">Entry: {selectedEntryType}</Badge>}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(searchTerm || selectedGame !== 'All' || selectedStatus !== 'All' || selectedEntryType !== 'All') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGame('All');
                    setSelectedStatus('All');
                    setSelectedEntryType('All');
                  }}
                  style={{ borderRadius: '9999px', padding: '0.75rem 1.75rem' }}
                >
                  Clear All Filters
                </Button>
              )}

              {user && (
                <Link href="/tournaments/create">
                  <Button variant="primary" style={{ borderRadius: '9999px', padding: '0.75rem 1.75rem' }}>
                    <PlusCircle size={16} /> Host First Tournament
                  </Button>
                </Link>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid-responsive">
            {filteredTournaments.map(tournament => {
              const registeredCount = tournament.registeredTeamIds?.length || 0;
              const isFull = registeredCount >= tournament.maxTeams;
              const effectiveStatus = getEffectiveTournamentStatus(tournament);

              return (
                <GlassCard key={tournament.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {getStatusBadge(effectiveStatus)}
                    <Badge variant={tournament.entryType === 'Free' ? 'cyan' : 'gold'}>
                      {tournament.entryType}
                    </Badge>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{tournament.name}</h3>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                    <Gamepad2 size={16} /> {tournament.game}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <TournamentCountdown tournament={tournament} compact={true} />
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <span>Rosters</span>
                      <strong style={{ color: isFull ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                        {registeredCount} / {tournament.maxTeams} {isFull && '(FULL)'}
                      </strong>
                    </div>

                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant={effectiveStatus === 'Active' ? 'primary' : 'outline'} style={{ width: '100%', justifyContent: 'center' }}>
                        {effectiveStatus === 'Active' ? 'Spectate Bracket' : effectiveStatus === 'Completed' ? 'View Results & Bracket' : 'View Tournament Details'}
                      </Button>
                    </Link>
                  </div>

                </GlassCard>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
