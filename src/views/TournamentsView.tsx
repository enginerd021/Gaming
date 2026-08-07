'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { tournamentService, Tournament } from '@/services/tournamentService';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Search, Gamepad2, PlusCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';

import { useAutoRefresh } from '@/hooks/useAutoRefresh';

export default function TournamentsView() {
  const user = useAppStore((state) => state.user);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = useAutoRefresh();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEntryType, setSelectedEntryType] = useState('All');

  useEffect(() => {
    const unsub = tournamentService.subscribeAllTournaments(
      (list) => {
        setTournaments(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsub();
    };
  }, [refreshCount]);

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'Upcoming':
        return <Badge variant="cyan">Upcoming</Badge>;
      case 'Active':
        return <Badge variant="live">Live</Badge>;
      case 'Completed':
        return <Badge variant="gold">Completed</Badge>;
    }
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = selectedGame === 'All' || tournament.game === selectedGame;
    const matchesStatus = selectedStatus === 'All' || tournament.status === selectedStatus;
    const matchesEntryType = selectedEntryType === 'All' || tournament.entryType === selectedEntryType;

    return matchesSearch && matchesGame && matchesStatus && matchesEntryType;
  });

  const uniqueGames = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Header section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Trophy size={32} style={{ color: 'var(--accent-gold)' }} />
              Championship Tournaments
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              Browse live and upcoming bracket tournaments. Assemble your roster and compete.
            </p>
          </div>
          {user && (
            <Link href="/tournaments/create">
              <Button variant="primary">
                <PlusCircle size={18} />
                Host Tournament
              </Button>
            </Link>
          )}
        </div>

        {/* Filters Section */}
        <div className="glass-panel filters-layout" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Search */}
          <div style={{ flex: '1 0 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
            <label htmlFor="search-input" className="sr-only">Search tournaments</label>
            <input
              id="search-input"
              type="text"
              className="glass-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

              return (
                <GlassCard key={tournament.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    {getStatusBadge(tournament.status)}
                    <Badge variant={tournament.entryType === 'Free' ? 'cyan' : 'gold'}>
                      {tournament.entryType}
                    </Badge>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{tournament.name}</h3>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    <Gamepad2 size={16} /> {tournament.game}
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <span>Rosters</span>
                      <strong style={{ color: isFull ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                        {registeredCount} / {tournament.maxTeams} {isFull && '(FULL)'}
                      </strong>
                    </div>

                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant={tournament.status === 'Active' ? 'primary' : 'outline'} style={{ width: '100%', justifyContent: 'center' }}>
                        {tournament.status === 'Active' ? 'Spectate Bracket' : 'View Tournament Details'}
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
