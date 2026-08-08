'use client';

import React, { useState } from 'react';
import { 
  ConflictGroup, 
  ScheduledTournament, 
  resolveScheduleConflict 
} from '@/services/scheduleConflictService';
import { ShieldAlert, Calendar, Clock, Check, Loader, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ScheduleConflictModalProps {
  conflictGroup: ConflictGroup;
  teamId: string;
  isCaptain: boolean;
  onResolved: () => void;
  onClose?: () => void;
}

export default function ScheduleConflictModal({
  conflictGroup,
  teamId,
  isCaptain,
  onResolved,
  onClose
}: ScheduleConflictModalProps) {
  const [selectedId, setSelectedId] = useState<string>(conflictGroup.tournaments[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmChoice = async () => {
    if (!selectedId || !teamId) return;
    setSubmitting(true);
    setError(null);

    try {
      const allIds = conflictGroup.tournaments.map((t) => t.id);
      await resolveScheduleConflict(teamId, selectedId, allIds);
      onResolved();
    } catch (err: any) {
      console.error("Failed to resolve schedule conflict:", err);
      setError(err.message || "Failed to resolve conflict.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      className="fade-in"
    >
      <div 
        style={{
          maxWidth: '580px',
          width: '100%',
          background: 'rgba(10, 16, 36, 0.95)',
          border: '1px solid rgba(255, 42, 109, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 42, 109, 0.25)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Header Alert Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 42, 109, 0.15)',
            border: '1px solid rgba(255, 42, 109, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-red)'
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SCHEDULE CONFLICT DETECTED
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Concurrent Tournament Matches
            </h2>
          </div>
        </div>

        {/* Description Banner */}
        <div style={{
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.9rem 1rem',
          borderRadius: '10px',
          borderLeft: '3px solid var(--accent-red)'
        }}>
          Your roster is registered for <strong>{conflictGroup.tournaments.length} tournaments</strong> scheduled for the exact same time slot ({conflictGroup.dateLabel} @ {conflictGroup.timeSlotLabel}). 
          {isCaptain 
            ? " As Captain, please choose 1 tournament for your roster to compete in. Unchosen tournament entries will be automatically withdrawn."
            : " Players can only participate in 1 live match at a time. Notify your Team Captain to resolve this schedule choice."}
        </div>

        {/* Tournament Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conflictGroup.tournaments.map((t: ScheduledTournament) => {
            const isSelected = selectedId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (isCaptain) setSelectedId(t.id);
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(176, 38, 255, 0.15) 100%)' 
                    : 'rgba(16, 24, 53, 0.6)',
                  border: isSelected 
                    ? '1.5px solid var(--neon-blue)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: isCaptain ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#000' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800
                  }}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                      <span style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>{t.game}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={12} /> {t.scheduledDate}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> {t.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {isCaptain && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                    background: isSelected ? 'var(--neon-blue)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000'
                  }}>
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ color: 'var(--accent-red)', fontSize: '0.82rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Review Later
            </Button>
          )}
          {isCaptain ? (
            <Button 
              variant="primary" 
              onClick={handleConfirmChoice} 
              disabled={!selectedId || submitting}
              style={{ background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' }}
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" style={{ marginRight: '0.4rem' }} /> Confirming Choice...
                </>
              ) : (
                'Confirm Selection & Resolve Conflict'
              )}
            </Button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
              Only Team Captain can resolve tournament schedule selection.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
