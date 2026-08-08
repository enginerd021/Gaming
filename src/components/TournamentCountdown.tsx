'use client';

import { useState, useEffect } from 'react';
import { Timer, Clock, Flame, CheckCircle2 } from 'lucide-react';
import { Tournament } from '@/services/tournamentService';
import { calculateTournamentTimeWindow } from '@/lib/tournamentUtils';

interface TournamentCountdownProps {
  tournament: Tournament;
  compact?: boolean;
  showDetails?: boolean;
}

export function TournamentCountdown({ tournament, compact = false, showDetails = false }: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const timeWindow = calculateTournamentTimeWindow(tournament);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = timeWindow.startDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeWindow.startDate]);

  if (tournament.status === 'Completed') {
    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.35rem', 
          padding: compact ? '0.25rem 0.6rem' : '0.4rem 0.85rem',
          borderRadius: '9999px',
          background: 'hsla(215, 15%, 25%, 0.4)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: 600
        }}
      >
        <CheckCircle2 size={compact ? 13 : 15} />
        <span>Tournament Ended</span>
      </div>
    );
  }

  if (tournament.status === 'Active' || timeLeft.isPast) {
    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          padding: compact ? '0.25rem 0.65rem' : '0.4rem 0.85rem',
          borderRadius: '9999px',
          background: 'hsla(350, 85%, 55%, 0.15)',
          border: '1px solid var(--accent-red)',
          color: 'var(--accent-red)',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.03em'
        }}
      >
        <span 
          style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'var(--accent-red)',
            boxShadow: '0 0 8px var(--accent-red)',
            animation: 'pulse 1.5s infinite'
          }} 
        />
        <Flame size={compact ? 13 : 15} />
        <span>LIVE NOW</span>
        {showDetails && (
          <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
            ({timeWindow.totalRounds} Rounds • 45m/round)
          </span>
        )}
      </div>
    );
  }

  // Upcoming status with active live countdown
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? '0.4rem' : '0.25rem',
        padding: compact ? '0.3rem 0.75rem' : '0.6rem 1rem',
        borderRadius: compact ? '9999px' : '10px',
        background: 'linear-gradient(135deg, hsla(185, 85%, 50%, 0.08) 0%, hsla(270, 85%, 60%, 0.08) 100%)',
        border: '1px solid hsla(185, 85%, 50%, 0.3)',
        boxShadow: '0 0 15px hsla(185, 85%, 50%, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)', fontSize: compact ? '0.75rem' : '0.8rem', fontWeight: 600 }}>
        <Timer size={compact ? 13 : 15} />
        <span>Starts In:</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'monospace', fontWeight: 800, fontSize: compact ? '0.8rem' : '1.1rem', color: '#ffffff' }}>
        {timeLeft.days > 0 && (
          <>
            <span style={{ color: 'var(--accent-cyan)' }}>{pad(timeLeft.days)}</span>
            <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginRight: '0.15rem' }}>d</span>
          </>
        )}
        <span style={{ color: 'var(--accent-cyan)' }}>{pad(timeLeft.hours)}</span>
        <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>h</span>
        <span>:</span>
        <span style={{ color: 'var(--accent-cyan)' }}>{pad(timeLeft.minutes)}</span>
        <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>m</span>
        <span>:</span>
        <span style={{ color: 'var(--accent-cyan)' }}>{pad(timeLeft.seconds)}</span>
        <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>s</span>
      </div>

      {showDetails && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />{timeWindow.totalRounds} Rounds (min 45m/round)</span>
          <span>•</span>
          <span>Est. Duration: {timeWindow.totalRounds * timeWindow.roundDurationMins}m</span>
        </div>
      )}
    </div>
  );
}
