'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { Shield, Trash2, AlertOctagon, Check, UserMinus, UserCheck, Search, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface ChatReport {
  id: string;
  messageId: string;
  messageText: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserGamertag: string;
  reason: string;
  createdAt: any;
}

interface FlaggedMessage {
  id: string;
  userId: string;
  userGamertag: string;
  text: string;
  reason: string;
  createdAt: any;
}

interface MutedUser {
  id: string;
  uid: string;
  gamertag: string;
  mutedUntil: number;
  reason: string;
  mutedBy: string;
  createdAt: number;
}

interface ModerationPanelProps {
  onClose: () => void;
}

export default function ModerationPanel({ onClose }: ModerationPanelProps) {
  const profile = useAppStore((state) => state.profile);
  const user = useAppStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<'reports' | 'mutes' | 'flagged'>('reports');
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [flagged, setFlagged] = useState<FlaggedMessage[]>([]);
  const [mutes, setMutes] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual mute form states
  const [manualUid, setManualUid] = useState('');
  const [manualDuration, setManualDuration] = useState('15'); // minutes
  const [manualReason, setManualReason] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Stream Flagged Reports
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const reportsQuery = query(collection(db, "chatReports"));
    const unsubscribe = onSnapshot(reportsQuery, (snap) => {
      const list: ChatReport[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          messageId: data.messageId || '',
          messageText: data.messageText || '',
          reporterId: data.reporterId || '',
          reportedUserId: data.reportedUserId || '',
          reportedUserGamertag: data.reportedUserGamertag || 'Player',
          reason: data.reason || '',
          createdAt: data.createdAt
        });
      });
      // Sort reports by date descending
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      setReports(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch reports:", err);
      setError("Failed to fetch flagged reports.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  // Stream Muted Users
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const mutesQuery = query(collection(db, "mutedUsers"));
    const unsubscribe = onSnapshot(mutesQuery, (snap) => {
      const list: MutedUser[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          uid: data.uid || d.id,
          gamertag: data.gamertag || 'Player',
          mutedUntil: data.mutedUntil || 0,
          reason: data.reason || '',
          mutedBy: data.mutedBy || 'admin',
          createdAt: data.createdAt || 0
        });
      });
      setMutes(list);
    }, (err) => {
      console.error("Failed to fetch muted list:", err);
    });

    return () => unsubscribe();
  }, [profile]);

  // Stream System Flagged Messages
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const flaggedQuery = query(collection(db, "flaggedMessages"));
    const unsubscribe = onSnapshot(flaggedQuery, (snap) => {
      const list: FlaggedMessage[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          userId: data.userId || '',
          userGamertag: data.userGamertag || 'Player',
          text: data.text || '',
          reason: data.reason || '',
          createdAt: data.createdAt
        });
      });
      // Sort by date descending
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      setFlagged(list);
    }, (err) => {
      console.error("Failed to fetch flagged messages:", err);
    });

    return () => unsubscribe();
  }, [profile]);

  // Action: Dismiss report
  const handleDismissReport = async (reportId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "chatReports", reportId));
      setSuccess("Report dismissed successfully.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to dismiss report.");
    }
  };

  // Action: Dismiss system flagged message log
  const handleDismissFlagged = async (flagId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "flaggedMessages", flagId));
      setSuccess("Flagged record dismissed.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to dismiss flagged record.");
    }
  };

  // Action: Delete violating message
  const handleDeleteMessage = async (messageId: string, reportId?: string) => {
    setError(null);
    setSuccess(null);
    try {
      // 1. Delete message
      await deleteDoc(doc(db, "globalChatMessages", messageId));
      
      // 2. Delete report if provided
      if (reportId) {
        await deleteDoc(doc(db, "chatReports", reportId));
      }
      setSuccess("Message deleted successfully.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete message. Verify admin privileges in firestore.rules.");
    }
  };

  // Action: Mute user
  const handleMuteUser = async (targetUid: string, targetGamertag: string, durationMinutes: number, reason: string, reportId?: string) => {
    setError(null);
    setSuccess(null);
    try {
      const now = Date.now();
      const mutedUntil = now + durationMinutes * 60 * 1000;
      
      // 1. Save mute doc
      await setDoc(doc(db, "mutedUsers", targetUid), {
        uid: targetUid,
        gamertag: targetGamertag,
        mutedUntil: mutedUntil,
        reason: reason || 'Muted by administrator',
        mutedBy: user?.uid || 'admin',
        createdAt: now
      });

      // 2. Clear strikes in target profile
      await updateDoc(doc(db, "profiles", targetUid), {
        chatStrikes: 0
      }).catch(() => {});

      // 3. Dismiss report if this mute resolved one
      if (reportId) {
        await deleteDoc(doc(db, "chatReports", reportId));
      }

      setSuccess(`Muted @${targetGamertag} for ${durationMinutes} minutes.`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to mute user.");
    }
  };

  // Action: Unmute user
  const handleUnmuteUser = async (targetUid: string, targetGamertag: string) => {
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "mutedUsers", targetUid));
      setSuccess(`Unmuted @${targetGamertag}.`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to unmute user.");
    }
  };

  // Action: Manual Mute submit
  const handleManualMuteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUid.trim()) return;
    setManualLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let targetUid = manualUid.trim();
      let targetGamertag = 'Player';

      // Verify if they entered a gamertag instead of a UID, search profiles
      if (!targetUid.startsWith('uid-') && targetUid.length < 20) {
        // Assume it is a gamertag, try to resolve UID
        const cleanTag = targetUid.toLowerCase().trim();
        const tagDoc = await getDoc(doc(db, "gamertags", cleanTag));
        if (tagDoc.exists()) {
          targetUid = tagDoc.data().uid;
        } else {
          throw new Error(`Gamertag @${manualUid} not found.`);
        }
      }

      // Fetch user profile to get exact gamertag
      const pSnap = await getDoc(doc(db, "profiles", targetUid));
      if (pSnap.exists()) {
        targetGamertag = pSnap.data().gamertag || targetGamertag;
      }

      await handleMuteUser(targetUid, targetGamertag, Number(manualDuration), manualReason || 'Muted manually by Admin');
      setManualUid('');
      setManualReason('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to resolve player or mute user.");
    } finally {
      setManualLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-red)' }}>
        <Shield size={48} style={{ margin: '0 auto 1rem auto' }} />
        <h3>Access Denied</h3>
        <p>You must be an administrator to access the moderation command center.</p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div 
      className="glass-panel fade-in"
      style={{
        position: 'fixed',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '750px',
        maxHeight: '80vh',
        zIndex: 500,
        background: 'rgba(6, 12, 26, 0.98)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 240, 255, 0.1)',
        borderRadius: '20px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Shield size={24} style={{ color: 'var(--accent-cyan)' }} />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Moderation Center</h2>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
        >
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{
            background: 'none', border: 'none',
            color: activeTab === 'reports' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', paddingBottom: '0.5rem',
            borderBottom: activeTab === 'reports' ? '2px solid var(--accent-cyan)' : 'none',
            fontSize: '0.9rem'
          }}
        >
          Flagged Reports ({reports.length})
        </button>
        <button 
          onClick={() => setActiveTab('flagged')}
          style={{
            background: 'none', border: 'none',
            color: activeTab === 'flagged' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', paddingBottom: '0.5rem',
            borderBottom: activeTab === 'flagged' ? '2px solid var(--accent-cyan)' : 'none',
            fontSize: '0.9rem'
          }}
        >
          System Flagged ({flagged.length})
        </button>
        <button 
          onClick={() => setActiveTab('mutes')}
          style={{
            background: 'none', border: 'none',
            color: activeTab === 'mutes' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 700, cursor: 'pointer', paddingBottom: '0.5rem',
            borderBottom: activeTab === 'mutes' ? '2px solid var(--accent-cyan)' : 'none',
            fontSize: '0.9rem'
          }}
        >
          Muted Players ({mutes.length})
        </button>
      </div>

      {/* Action Feedback */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 60, 60, 0.15)', border: '1px solid var(--accent-red)', color: '#ff4d4d', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          <AlertOctagon size={16} />
          {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          <Check size={16} />
          {success}
        </div>
      )}

      {/* Tab Panels */}
      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '150px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : activeTab === 'reports' ? (
          reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No flagged reports! Chat is clean. 🎯
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Reported: <strong style={{ color: 'var(--text-primary)' }}>@{report.reportedUserGamertag}</strong>
                  </span>
                  <Badge variant="red" style={{ fontSize: '0.65rem' }}>{report.reason}</Badge>
                </div>

                <div 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    borderLeft: '3px solid var(--accent-red)',
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}
                >
                  "{report.messageText}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Reporter: {report.reporterId === 'system' ? '💻 SYSTEM' : `@${report.reporterId.substring(0, 8)}`}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDismissReport(report.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', minHeight: 'auto' }}
                    >
                      Dismiss
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleDeleteMessage(report.messageId, report.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => handleMuteUser(report.reportedUserId, report.reportedUserGamertag, 15, 'Muted due to flagged chat behavior', report.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Clock size={12} /> Mute 15m
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'flagged' ? (
          flagged.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No system-flagged messages! Lounge is secure. 🛡️
            </div>
          ) : (
            flagged.map((flag) => (
              <div 
                key={flag.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Player: <strong style={{ color: 'var(--text-primary)' }}>@{flag.userGamertag}</strong>
                  </span>
                  <Badge variant="red" style={{ fontSize: '0.65rem' }}>{flag.reason}</Badge>
                </div>

                <div 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    borderLeft: '3px solid var(--accent-cyan)',
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                  }}
                >
                  "{flag.text}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Logged: {flag.createdAt?.toDate ? flag.createdAt.toDate().toLocaleTimeString() : 'Recent'}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDismissFlagged(flag.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', minHeight: 'auto' }}
                    >
                      Dismiss
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => handleMuteUser(flag.userId, flag.userGamertag, 15, `Muted due to flagged: ${flag.reason}`)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Clock size={12} /> Mute 15m
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          /* Muted Users list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Manual mute Form */}
            <form onSubmit={handleManualMuteSubmit} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Player UID or Gamertag..." 
                  value={manualUid}
                  onChange={e => setManualUid(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem', height: '2rem' }}
                  required
                />
              </div>
              <div style={{ width: '80px' }}>
                <select 
                  className="glass-input"
                  value={manualDuration}
                  onChange={e => setManualDuration(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem', height: '2rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="15">15m</option>
                  <option value="60">1h</option>
                  <option value="1440">24h</option>
                  <option value="525600">Perm</option>
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Reason..." 
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem', height: '2rem' }}
                />
              </div>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={manualLoading}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px', minHeight: 'auto' }}
              >
                Mute
              </Button>
            </form>

            {/* Muted List */}
            {mutes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No players are currently muted.
              </div>
            ) : (
              mutes.map((mute) => {
                const now = Date.now();
                const timeLeftMs = mute.mutedUntil - now;
                const minutesLeft = timeLeftMs > 0 ? Math.ceil(timeLeftMs / 60000) : 0;
                
                return (
                  <div 
                    key={mute.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                        @{mute.gamertag}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Reason: {mute.reason}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        UID: {mute.uid}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <Badge variant="cyan" style={{ fontSize: '0.68rem' }}>
                        {minutesLeft > 365 * 1440 ? 'Permanent' : `${minutesLeft} min left`}
                      </Badge>
                      <Button 
                        variant="outline" 
                        onClick={() => handleUnmuteUser(mute.uid, mute.gamertag)}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', borderRadius: '6px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                      >
                        <UserCheck size={12} /> Unmute
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <Button variant="outline" onClick={onClose} style={{ borderRadius: '8px', padding: '0.5rem 1.25rem' }}>Close</Button>
      </div>
    </div>
  );
}
