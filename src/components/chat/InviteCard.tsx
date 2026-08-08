'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Trophy, Gamepad2, Users, UserPlus, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface InviteCardProps {
  inviteData: {
    tournamentId: string;
    tournamentName: string;
    game: string;
    teamId: string;
    teamName: string;
    slotsLeft: number;
    slotsTotal: number;
    status: 'active' | 'expired' | 'full';
  };
  senderGamertag: string;
  senderId: string;
  onJoinSuccess?: (message: string, team: { id: string; name: string }) => void;
  onJoinError?: (error: string) => void;
}

function getGameTeamSizeLimit(game: string): number {
  const g = (game || '').toLowerCase();
  if (g.includes('valorant') || g.includes('league') || g.includes('overwatch')) {
    return 5;
  }
  if (g.includes('apex') || g.includes('rocket')) {
    return 3;
  }
  return 5; // Standard esports roster limit
}

export default function InviteCard({ inviteData, senderGamertag, senderId, onJoinSuccess, onJoinError }: InviteCardProps) {
  const user = useAppStore((state) => state.user);
  const team = useAppStore((state) => state.team);
  const [joining, setJoining] = useState(false);
  const [localJoined, setLocalJoined] = useState(false);

  const {
    tournamentId,
    tournamentName,
    game,
    teamId,
    teamName,
    slotsTotal
  } = inviteData;

  // Live states
  const [liveTeamMembers, setLiveTeamMembers] = useState<string[]>([]);
  const [liveTournamentStatus, setLiveTournamentStatus] = useState<string>('Upcoming');
  const [liveGame, setLiveGame] = useState<string>('');

  // 1. Listen to target team in real-time
  useEffect(() => {
    if (!teamId) return;
    const unsub = onSnapshot(doc(db, 'teams', teamId), (snap) => {
      if (snap.exists()) {
        setLiveTeamMembers(snap.data().members || []);
      }
    }, (err) => console.error('Failed to listen to team:', err));
    return () => unsub();
  }, [teamId]);

  // 2. Listen to target tournament in real-time
  useEffect(() => {
    if (!tournamentId) return;
    const unsub = onSnapshot(doc(db, 'tournaments', tournamentId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveTournamentStatus(data.status || 'Upcoming');
        setLiveGame(data.game || '');
      }
    }, (err) => console.error('Failed to listen to tournament:', err));
    return () => unsub();
  }, [tournamentId]);

  // Dynamic calculations based on live snapshot data
  const currentGame = liveGame || game;
  const currentSizeLimit = getGameTeamSizeLimit(currentGame);
  const currentSlotsLeft = Math.max(0, currentSizeLimit - liveTeamMembers.length);

  const isAlreadyInThisTeam = team?.id === teamId || localJoined || liveTeamMembers.includes(user?.uid || '');
  const isFull = currentSlotsLeft <= 0;
  const isExpired = liveTournamentStatus !== 'Upcoming';
  const isDisabled = isExpired || isFull || isAlreadyInThisTeam || !user || joining;

  const handleJoin = async () => {
    if (isDisabled) return;
    setJoining(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/teams/join-via-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ teamId, tournamentId, senderId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join team.');
      }

      setLocalJoined(true);
      if (onJoinSuccess) {
        onJoinSuccess(data.message || `Joined ${teamName}!`, data.team);
      }
    } catch (err: any) {
      console.error(err);
      if (onJoinError) {
        onJoinError(err.message || 'Failed to join team.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div 
      className={`glass-panel ${isExpired ? 'opacity-60' : ''}`}
      style={{
        padding: '1.25rem',
        borderRadius: '16px',
        border: isExpired 
          ? '1px solid var(--border-color)' 
          : isAlreadyInThisTeam 
            ? '1px solid rgba(0, 240, 255, 0.4)' 
            : '1px solid rgba(176, 38, 255, 0.3)',
        background: isExpired 
          ? 'rgba(4, 9, 20, 0.40)' 
          : isAlreadyInThisTeam 
            ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(4, 9, 20, 0.8) 100%)' 
            : 'linear-gradient(135deg, rgba(176, 38, 255, 0.04) 0%, rgba(4, 9, 20, 0.85) 100%)',
        boxShadow: isExpired ? 'none' : '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        width: '100%',
        maxWidth: '380px',
        margin: '0.4rem 0',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Trophy size={14} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Tournament Recruitment
            </span>
          </div>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {tournamentName}
          </h4>
        </div>
        <Badge variant={isAlreadyInThisTeam ? 'cyan' : isFull ? 'red' : isExpired ? undefined : 'violet'} style={{ fontSize: '0.65rem' }}>
          {currentGame}
        </Badge>
      </div>

      {/* Roster & Slots Details */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={14} style={{ color: 'var(--accent-cyan)' }} />
            Team:
          </span>
          <strong style={{ color: 'var(--text-primary)' }}>{teamName}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span>Slots Available:</span>
          {isExpired ? (
            <span style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Lock size={12} /> Closed
            </span>
          ) : (
            <strong style={{ color: isFull ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
              {isFull ? 'Roster Full' : `${currentSlotsLeft} / ${slotsTotal} Open`}
            </strong>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Recruiter: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>@{senderGamertag}</span>
        </span>

        {user ? (
          isAlreadyInThisTeam ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700 }}>
              <CheckCircle size={15} /> Joined Team
            </div>
          ) : isExpired ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Lock size={15} /> Closed
            </div>
          ) : isFull ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-red)', fontSize: '0.8rem', fontWeight: 700 }}>
              <AlertTriangle size={15} /> Full
            </div>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleJoin} 
              disabled={joining}
              style={{ 
                padding: '0.45rem 1rem', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 800,
                minHeight: 'auto'
              }}
            >
              <UserPlus size={14} />
              {joining ? 'Joining...' : 'Join Team'}
            </Button>
          )
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Log in to Join
          </span>
        )}
      </div>
    </div>
  );
}
