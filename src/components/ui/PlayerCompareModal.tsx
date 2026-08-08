'use client';

import React, { useState, useEffect } from 'react';
import { X, Swords, Trophy, Zap, Shield, Flame, Activity, CheckCircle2, ArrowRight } from 'lucide-react';

interface PlayerStats {
  riotId: string;
  summonerName: string;
  tagLine: string;
  summonerLevel: number;
  acs: number;
  adr: number;
  kast: number;
  kd: number;
  headshotPct: number;
  firstKills: number;
  firstDeaths: number;
  shaktrixRating: number;
  rankInfo: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  source?: string;
}

interface PlayerCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRiotId1?: string;
  defaultRiotId2?: string;
}

export default function PlayerCompareModal({
  isOpen,
  onClose,
  defaultRiotId1 = 'Tarik#NA1',
  defaultRiotId2 = 'Singh#IND'
}: PlayerCompareModalProps) {
  const [riotId1, setRiotId1] = useState(defaultRiotId1);
  const [riotId2, setRiotId2] = useState(defaultRiotId2);

  const [player1Data, setPlayer1Data] = useState<PlayerStats | null>(null);
  const [player2Data, setPlayer2Data] = useState<PlayerStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultRiotId1) setRiotId1(defaultRiotId1);
    if (defaultRiotId2) setRiotId2(defaultRiotId2);
  }, [defaultRiotId1, defaultRiotId2]);

  useEffect(() => {
    if (isOpen) {
      handleCompare();
    }
  }, [isOpen]);

  const handleCompare = async () => {
    if (!riotId1.trim() || !riotId1.includes('#') || !riotId2.trim() || !riotId2.includes('#')) {
      setError("Please enter valid Riot IDs in name#tag format for both players (e.g. Tarik#NA1 vs Singh#IND).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/game-stats?riotId=${encodeURIComponent(riotId1.trim())}&action=compare`),
        fetch(`/api/game-stats?riotId=${encodeURIComponent(riotId2.trim())}&action=compare`)
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!res1.ok) throw new Error(data1.error || `Failed to fetch stats for ${riotId1}`);
      if (!res2.ok) throw new Error(data2.error || `Failed to fetch stats for ${riotId2}`);

      setPlayer1Data(data1);
      setPlayer2Data(data2);
    } catch (err: any) {
      console.error("Comparison error:", err);
      setError(err.message || "Failed to compare Riot IDs.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const p1Wins = (player1Data?.shaktrixRating || 0) >= (player2Data?.shaktrixRating || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 2000,
      background: 'rgba(2, 6, 16, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }} className="fade-in">
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          background: 'rgba(6, 14, 30, 0.96)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.2)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.15)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Swords size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: 'var(--font-title)' }}>
                VALORANT <span style={{ color: 'var(--neon-blue)' }}>HEAD-TO-HEAD</span> COMPARE
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Real gameplay performance evaluation using VCT ACS, ADR, KAST%, and SHAKTRIX Rating
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            className="hover-opacity"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Input Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neon-blue)', marginBottom: '0.3rem', display: 'block' }}>
              PLAYER 1 RIOT ID
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Tarik#NA1"
              value={riotId1}
              onChange={(e) => setRiotId1(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neon-purple)', marginBottom: '0.3rem', display: 'block' }}>
              PLAYER 2 RIOT ID
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Singh#IND"
              value={riotId2}
              onChange={(e) => setRiotId2(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.9rem' }}
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', padding: '0.65rem 1.5rem', fontWeight: 800 }}
          >
            {loading ? 'Analyzing...' : 'Compare'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 60, 60, 0.15)', border: '1px solid rgba(255, 60, 60, 0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Comparison Stats Rendering */}
        {player1Data && player2Data && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Winner Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(176, 38, 255, 0.12) 100%)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Trophy size={28} style={{ color: 'var(--accent-gold)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: 800 }}>
                    HIGHER PERFORMANCE RATING
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    @{p1Wins ? player1Data.riotId : player2Data.riotId} 
                    <span style={{ fontSize: '0.9rem', color: 'var(--neon-blue)', marginLeft: '0.5rem' }}>
                      (Rating: {p1Wins ? player1Data.shaktrixRating : player2Data.shaktrixRating})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Players Badges Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Player 1 Card */}
              <div style={{
                background: 'rgba(10, 20, 42, 0.8)',
                border: `1px solid ${p1Wins ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--neon-blue)', fontWeight: 800, textTransform: 'uppercase' }}>PLAYER 1</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0' }}>@{player1Data.riotId}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Rank: <strong style={{ color: 'var(--accent-gold)' }}>{player1Data.rankInfo.tier} {player1Data.rankInfo.rank}</strong></span>
                    <span>• Lvl {player1Data.summonerLevel}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SHAKTRIX Rating</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--neon-blue)' }}>{player1Data.shaktrixRating}</div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div style={{
                background: 'rgba(10, 20, 42, 0.8)',
                border: `1px solid ${!p1Wins ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--neon-purple)', fontWeight: 800, textTransform: 'uppercase' }}>PLAYER 2</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0' }}>@{player2Data.riotId}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Rank: <strong style={{ color: 'var(--accent-gold)' }}>{player2Data.rankInfo.tier} {player2Data.rankInfo.rank}</strong></span>
                    <span>• Lvl {player2Data.summonerLevel}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SHAKTRIX Rating</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--neon-purple)' }}>{player2Data.shaktrixRating}</div>
                </div>
              </div>
            </div>

            {/* Metrics Side-by-Side Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'ACS (Combat Score)', val1: player1Data.acs, val2: player2Data.acs, max: 350, unit: ' pts' },
                { label: 'ADR (Damage / Round)', val1: player1Data.adr, val2: player2Data.adr, max: 220, unit: ' hp' },
                { label: 'KAST % (Contribution)', val1: player1Data.kast, val2: player2Data.kast, max: 100, unit: '%' },
                { label: 'K/D Ratio', val1: player1Data.kd, val2: player2Data.kd, max: 2.0, unit: '' },
                { label: 'Headshot %', val1: player1Data.headshotPct, val2: player2Data.headshotPct, max: 50, unit: '%' },
                { label: 'Entry Differential (FK - FD)', val1: player1Data.firstKills - player1Data.firstDeaths, val2: player2Data.firstKills - player2Data.firstDeaths, max: 10, unit: ' kills' },
                { label: 'Win Rate %', val1: player1Data.rankInfo.winRate, val2: player2Data.rankInfo.winRate, max: 100, unit: '%' }
              ].map((m, idx) => {
                const p1Adv = m.val1 >= m.val2;

                return (
                  <div key={idx} style={{ background: 'rgba(8, 16, 34, 0.6)', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                      <span style={{ color: p1Adv ? 'var(--neon-blue)' : 'var(--text-muted)' }}>
                        {m.val1}{m.unit} {p1Adv && '⚡'}
                      </span>
                      <span style={{ color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.78rem' }}>
                        {m.label}
                      </span>
                      <span style={{ color: !p1Adv ? 'var(--neon-purple)' : 'var(--text-muted)' }}>
                        {!p1Adv && '⚡ '} {m.val2}{m.unit}
                      </span>
                    </div>

                    {/* Progress Bar Dual Comparison */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: `${Math.min(100, (m.val1 / m.max) * 100)}%`,
                          height: '100%',
                          background: p1Adv ? 'var(--neon-blue)' : 'rgba(0, 240, 255, 0.4)',
                          borderRadius: '4px 0 0 4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                          width: `${Math.min(100, (m.val2 / m.max) * 100)}%`,
                          height: '100%',
                          background: !p1Adv ? 'var(--neon-purple)' : 'rgba(176, 38, 255, 0.4)',
                          borderRadius: '0 4px 4px 0',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
