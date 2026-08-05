'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Search, Gamepad2, PlusCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  entryType: 'Free' | 'Paid';
  maxTeams: number;
  registeredTeamIds: string[];
  organizerId: string;
  createdAt: number;
}

export default function TournamentsView() {
  const user = useAppStore((state) => state.user);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEntryType, setSelectedEntryType] = useState('All');

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "tournaments"));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      // Sort by newest first
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTournaments(list);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

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
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '3rem 1.5rem' }}>
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
          <GlassCard variant="panel" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <Trophy size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Tournaments Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Try broadening your search or filter settings.</p>
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
