'use client';

import { useState, useEffect, useMemo } from 'react';
import { leaderboardService } from '@/services/leaderboardService';
import { Profile, Team } from '@/store/useAppStore';
import { Trophy, Search, Users, Award, X, Swords } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import Podium from '@/components/ui/Podium';
import PlayerCompareModal from '@/components/ui/PlayerCompareModal';

export default function LeaderboardView() {
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerLimit, setPlayerLimit] = useState(50);
  const [teamLimit, setTeamLimit] = useState(50);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');

  // Real-time snapshot listener via leaderboardService
  useEffect(() => {
    const unsubProfiles = leaderboardService.subscribeProfiles(
      playerLimit,
      (list) => {
        setProfiles(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubTeams = leaderboardService.subscribeTeams(
      teamLimit,
      (list) => {
        setTeams(list);
      }
    );

    return () => {
      unsubProfiles();
      unsubTeams();
    };
  }, [playerLimit, teamLimit]);

  // Derived filtered players list
  const filteredPlayers = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch = p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.gamertag.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGame = selectedGame === 'All' || p.registeredGames?.includes(selectedGame);
      return matchesSearch && matchesGame;
    });
  }, [profiles, searchQuery, selectedGame]);

  // Derived processed and sorted teams list
  const processedTeams = useMemo(() => {
    return teams.map(t => {
      const teamPoints = t.members.reduce((acc, memberUid) => {
        const memberProf = profiles.find(p => p.uid === memberUid);
        return acc + (memberProf?.stats?.points || 0);
      }, 0);
      const teamWins = t.members.reduce((acc, memberUid) => {
        const memberProf = profiles.find(p => p.uid === memberUid);
        return acc + (memberProf?.stats?.wins || 0);
      }, 0);
      return {
        ...t,
        points: teamPoints,
        wins: teamWins
      };
    }).sort((a, b) => b.points - a.points);
  }, [teams, profiles]);

  // Derived filtered teams list
  const filteredTeams = useMemo(() => {
    return processedTeams.filter((t) => {
      return t.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [processedTeams, searchQuery]);

  const topThreePlayers = useMemo(() => filteredPlayers.slice(0, 3), [filteredPlayers]);

  const uniqueGames = ["Valorant", "League of Legends", "CS:GO", "Apex Legends", "Rocket League", "Overwatch 2"];

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Trophy size={36} style={{ color: 'var(--accent-gold)' }} />
            Live Hall of Fame
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Ranked player and team leaderboards, synced live in real-time.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Button
              onClick={() => { setActiveTab('players'); setSearchQuery(''); }}
              variant={activeTab === 'players' ? 'primary' : 'outline'}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none' }}
              aria-label="Show player rankings leaderboard"
            >
              <Award size={16} /> Player Rankings
            </Button>
            <Button
              onClick={() => { setActiveTab('teams'); setSearchQuery(''); }}
              variant={activeTab === 'teams' ? 'primary' : 'outline'}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', border: 'none' }}
              aria-label="Show team rosters leaderboard"
            >
              <Users size={16} /> Team Rosters
            </Button>
            <Button
              onClick={() => setCompareModalOpen(true)}
              variant="outline"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)', fontWeight: 800 }}
              aria-label="Compare two Riot IDs head-to-head"
            >
              <Swords size={16} /> Compare Riot IDs
            </Button>
          </div>

          {/* Search Inputs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1 0 280px', maxWidth: '500px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
              <label htmlFor="search-query" className="sr-only">Search rankings</label>
              <input
                id="search-query"
                type="text"
                className="glass-input"
                style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '1rem', fontSize: '0.9rem' }}
                placeholder={activeTab === 'players' ? "Search players by tag..." : "Search team name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
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

            {activeTab === 'players' && (
              <div style={{ width: '160px' }}>
                <label htmlFor="leaderboard-game-filter" className="sr-only">Filter by Game</label>
                <select
                  id="leaderboard-game-filter"
                  className="glass-input glass-select"
                  style={{ fontSize: '0.9rem' }}
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <option value="All">All Games</option>
                  {uniqueGames.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="glass-panel skeleton-pulse" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: n === 5 ? 'none' : '1px solid var(--border-color)', paddingBottom: n === 5 ? '0' : '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div className="skeleton-text" style={{ width: '32px', height: '32px', borderRadius: '50%', marginBottom: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-text" style={{ width: '120px', height: '16px', marginBottom: '0.4rem' }} />
                      <div className="skeleton-text" style={{ width: '80px', height: '12px', marginBottom: 0 }} />
                    </div>
                  </div>
                  <div className="skeleton-text" style={{ width: '80px', height: '16px', marginBottom: 0 }} />
                  <div className="skeleton-text" style={{ width: '60px', height: '16px', marginBottom: 0, marginLeft: '2rem' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* PLAYERS LEADERBOARD */}
            {activeTab === 'players' && (
              <>
                {/* Reusable Podium Component */}
                <Podium topThree={topThreePlayers} />

                {/* Table for Players */}
                <GlassCard variant="panel" className="responsive-table" style={{ padding: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <caption>Player Leaderboard rankings based on aggregated match performance and XP score.</caption>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '1rem' }}>Rank</th>
                        <th style={{ padding: '1rem' }}>Player</th>
                        <th style={{ padding: '1rem' }}>Active Games</th>
                        <th style={{ padding: '1rem' }}>Skill Level</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>XP Points</th>
                      </tr>
                    </thead>
                    <tbody aria-live="polite">
                      {filteredPlayers.map((player, idx) => (
                        <tr key={`${player.uid}-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }} className="table-row-hover status-flash">
                          <td data-label="Rank" style={{ padding: '1rem', fontWeight: 800, color: idx === 0 ? 'var(--accent-gold)' : idx === 1 ? 'var(--accent-violet)' : idx === 2 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                            #{idx + 1}
                          </td>
                          <td data-label="Player" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                {player.displayName.substring(0, 2).toUpperCase()}
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <Link href={`/players/${player.gamertag}`} style={{ fontWeight: 700 }} className="hover-cyan">
                                  {player.displayName}
                                </Link>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{player.gamertag}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Active Games" style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {player.registeredGames?.slice(0, 2).map(g => (
                                <Badge key={g} variant="cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'none' }}>{g}</Badge>
                              ))}
                              {player.registeredGames?.length > 2 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{player.registeredGames.length - 2}</span>}
                            </div>
                          </td>
                          <td data-label="Skill Level" style={{ padding: '1rem' }}>
                            <Badge variant={player.skillLevel === 'Advanced' ? 'gold' : player.skillLevel === 'Intermediate' ? 'violet' : 'cyan'} style={{ fontSize: '0.7rem' }}>
                              {player.skillLevel}
                            </Badge>
                          </td>
                          <td data-label="XP Points" style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                            {player.stats?.points || 1000}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GlassCard>
              </>
            )}

            {/* TEAMS LEADERBOARD */}
            {activeTab === 'teams' && (
              <GlassCard variant="panel" className="responsive-table" style={{ padding: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <caption>Team Roster Rankings based on combined member stats.</caption>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem' }}>Rank</th>
                      <th style={{ padding: '1rem' }}>Team Name</th>
                      <th style={{ padding: '1rem' }}>Roster Size</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Total XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team, idx) => (
                      <tr key={team.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem' }} className="table-row-hover">
                        <td data-label="Rank" style={{ padding: '1rem', fontWeight: 800, color: idx === 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                          #{idx + 1}
                        </td>
                        <td data-label="Team Name" style={{ padding: '1rem' }}>
                          <Link href={`/teams/${team.id}`} style={{ fontWeight: 700 }} className="hover-cyan">
                            {team.name}
                          </Link>
                        </td>
                        <td data-label="Roster Size" style={{ padding: '1rem' }}>
                          <Badge variant="violet">{team.members.length} Members</Badge>
                        </td>
                        <td data-label="Total XP" style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-gold)' }}>
                          {team.points} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </>
        )}

      </div>

      <PlayerCompareModal 
        isOpen={compareModalOpen} 
        onClose={() => setCompareModalOpen(false)} 
      />
    </main>
  );
}
