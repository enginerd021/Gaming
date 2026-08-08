'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore, Profile, Team } from '@/store/useAppStore';
import { Users, UserPlus, UserMinus, Check, X, Shield, LogOut, PlusCircle, AlertCircle, Crown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import { transferLeaderOrDisband, transferCaptainToSelectedMember } from '@/services/teamService';

export default function TeamsView() {
  const user = useAppStore((state) => state.user);
  const profile = useAppStore((state) => state.profile);
  const teams = useAppStore((state) => state.teams);
  const activeTeamId = useAppStore((state) => state.activeTeamId);
  const setActiveTeamId = useAppStore((state) => state.setActiveTeamId);
  const team = useAppStore((state) => state.team);
  const teamLoading = useAppStore((state) => state.teamLoading);
  const loading = useAppStore((state) => state.loading);
  const router = useRouter();

  // Component states
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteGamertag, setInviteGamertag] = useState('');
  const [memberProfiles, setMemberProfiles] = useState<Profile[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Team[]>([]);
  const [actioningInviteId, setActioningInviteId] = useState<string | null>(null);
  
  // Leadership transfer & leave modal states
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedNewCaptainId, setSelectedNewCaptainId] = useState<string>('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Real-time stream of member profiles in user's team
  useEffect(() => {
    if (!team?.members || team.members.length === 0) {
      setMemberProfiles([]);
      return;
    }

    const profilesRef = collection(db, "profiles");
    const chunks = [];
    const memberIds = [...team.members];
    while (memberIds.length > 0) {
      chunks.push(memberIds.splice(0, 30));
    }

    const unsubs: (() => void)[] = [];
    const profilesMap = new Map<string, Profile>();

    for (const chunk of chunks) {
      const q = query(profilesRef, where("uid", "in", chunk));
      const u = onSnapshot(q, (snap) => {
        snap.docs.forEach(d => profilesMap.set(d.id, d.data() as Profile));
        setMemberProfiles(Array.from(profilesMap.values()));
      }, (err) => {
        console.error("Error streaming member profiles:", err);
      });
      unsubs.push(u);
    }

    return () => unsubs.forEach(fn => fn());
  }, [team?.members]);

  // Real-time stream of pending invitations for this user (handles case variations)
  useEffect(() => {
    if (!profile?.gamertag) {
      setReceivedInvites([]);
      return;
    }

    const tag = profile.gamertag;
    const tagLower = profile.gamertag.toLowerCase();

    const q1 = query(collection(db, "teams"), where("pendingInvites", "array-contains", tag));
    const q2 = query(collection(db, "teams"), where("pendingInvites", "array-contains", tagLower));

    const unsub1 = onSnapshot(q1, (snap1) => {
      const list1 = snap1.docs.map(d => ({ id: d.id, ...d.data() } as Team));
      onSnapshot(q2, (snap2) => {
        const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        const combined = [...list1, ...list2].reduce((acc: Team[], current) => {
          if (!acc.some(t => t.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);
        setReceivedInvites(combined);
      }, () => {});
    }, (err) => {
      console.error("Error streaming received invites:", err);
    });

    return () => unsub1();
  }, [profile?.gamertag, team]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Create team action
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!newTeamName.trim()) {
      setError("Team name cannot be empty.");
      return;
    }

    setActionLoading(true);
    try {
      const docRef = await addDoc(collection(db, "teams"), {
        name: newTeamName.trim(),
        captainId: user!.uid,
        members: [user!.uid],
        pendingInvites: [],
        createdAt: Date.now()
      });

      setNewTeamName('');
      setActiveTeamId(docRef.id);
      setSuccess(`Team "${newTeamName}" created successfully!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create team.");
    } finally {
      setActionLoading(false);
    }
  };

  // Send invite action (Resolves gamertags accurately & handles casing)
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const inputTag = inviteGamertag.trim().replace(/^@/, '');
    if (!inputTag) {
      setError("Please enter a gamertag.");
      return;
    }

    if (!team) {
      setError("You must have a team to send invites.");
      return;
    }

    setActionLoading(true);

    try {
      // 1. Look up gamertag document in /gamertags collection
      const tagDocRef = doc(db, "gamertags", inputTag.toLowerCase());
      const tagDocSnap = await getDoc(tagDocRef);

      let targetUid: string | null = null;
      let targetGamertag: string = inputTag;

      if (tagDocSnap.exists()) {
        targetUid = tagDocSnap.data().uid;
      } else {
        // Fallback: Query profiles collection
        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef, where("gamertag", "==", inputTag));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
        }
      }

      if (!targetUid) {
        setError(`Player @${inputTag} does not exist.`);
        setActionLoading(false);
        return;
      }

      // Fetch target profile for official casing
      const targetProfileSnap = await getDoc(doc(db, "profiles", targetUid));
      if (targetProfileSnap.exists()) {
        targetGamertag = targetProfileSnap.data().gamertag || inputTag;
      }

      if (team.members.includes(targetUid)) {
        setError(`@${targetGamertag} is already a member of your team.`);
        setActionLoading(false);
        return;
      }

      const isAlreadyPending = (team.pendingInvites || []).some(
        g => g.toLowerCase() === targetGamertag.toLowerCase() || g.toLowerCase() === inputTag.toLowerCase()
      );
      if (isAlreadyPending) {
        setError(`An invitation is already pending for @${targetGamertag}.`);
        setActionLoading(false);
        return;
      }

      const teamRef = doc(db, "teams", team.id);
      // Store both exact gamertag and lowercase representation for reliable matching
      await updateDoc(teamRef, {
        pendingInvites: arrayUnion(targetGamertag, targetGamertag.toLowerCase())
      });

      // Write notification document to the invited player's notifications subcollection
      const notificationRef = collection(db, "profiles", targetUid, "notifications");
      await addDoc(notificationRef, {
        type: 'team_invite',
        message: `You have been invited to join team ${team.name}.`,
        relatedId: team.id,
        read: false,
        createdAt: serverTimestamp(),
        teamId: team.id
      });

      setInviteGamertag('');
      setSuccess(`Invited @${targetGamertag} to join your team.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("Action failed: Only the team captain can invite players.");
      } else {
        setError(err.message || "Failed to send invitation.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke invite (Captain only)
  const handleRevokeInvite = async (gamertag: string) => {
    if (!team) return;
    clearMessages();
    try {
      const teamRef = doc(db, "teams", team.id);
      const updatedPending = (team.pendingInvites || []).filter(
        g => g.toLowerCase() !== gamertag.toLowerCase()
      );
      await updateDoc(teamRef, {
        pendingInvites: updatedPending
      });
      setSuccess(`Revoked invitation for @${gamertag}.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("Action failed: Only the team captain can revoke invites.");
      } else {
        setError("Failed to revoke invitation.");
      }
    }
  };

  // Accept invite
  const handleAcceptInvite = async (invitingTeam: Team) => {
    if (!profile || !user) {
      setError("You must be logged in with an active profile to accept invitations.");
      return;
    }
    clearMessages();
    setActioningInviteId(invitingTeam.id);
    setActionLoading(true);

    try {
      const teamRef = doc(db, "teams", invitingTeam.id);
      // Cleanly remove any case variation of user's gamertag from pendingInvites
      const updatedPending = (invitingTeam.pendingInvites || []).filter(
        g => g.toLowerCase() !== profile.gamertag.toLowerCase()
      );

      await updateDoc(teamRef, {
        members: arrayUnion(user.uid),
        pendingInvites: updatedPending
      });
      
      setActiveTeamId(invitingTeam.id);
      setSuccess(`Successfully joined team ${invitingTeam.name}!`);
    } catch (err: any) {
      console.error("Invite acceptance error:", err);
      setError(err.message || "Failed to accept team invitation.");
    } finally {
      setActioningInviteId(null);
      setActionLoading(false);
    }
  };

  // Reject invite
  const handleRejectInvite = async (invitingTeam: Team) => {
    if (!profile) return;
    clearMessages();
    setActioningInviteId(invitingTeam.id);
    setActionLoading(true);

    try {
      const teamRef = doc(db, "teams", invitingTeam.id);
      const updatedPending = (invitingTeam.pendingInvites || []).filter(
        g => g.toLowerCase() !== profile.gamertag.toLowerCase()
      );

      await updateDoc(teamRef, {
        pendingInvites: updatedPending
      });
      setSuccess(`Declined invitation from team ${invitingTeam.name}.`);
    } catch (err: any) {
      console.error("Invite rejection error:", err);
      setError(err.message || "Failed to reject invitation.");
    } finally {
      setActioningInviteId(null);
      setActionLoading(false);
    }
  };

  // Transfer Team Captain leadership to a designated member (while staying on roster)
  const handleTransferCaptaincy = async (targetUid: string, targetGamertag: string) => {
    if (!team || !user) return;
    if (!window.confirm(`👑 Are you sure you want to promote @${targetGamertag} to Team Captain of ${team.name}?`)) return;

    clearMessages();
    setActionLoading(true);

    try {
      const res = await transferCaptainToSelectedMember(team, targetUid);
      setSuccess(`👑 Transferred Team Captain leadership to @${res.newCaptainGamertag}!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transfer leadership.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Leave Modal or Trigger Solo Leave
  const handleLeaveTeam = async () => {
    if (!team || !user) return;
    const isCaptain = team.captainId === user.uid;
    const activeMemberUids = (team.members || []).filter(id => id !== user.uid);
    const eligibleMembers = activeMemberUids.map(uid => {
      const prof = memberProfiles.find(p => p.uid === uid);
      return prof || {
        uid,
        displayName: 'Active Roster Member',
        gamertag: 'player',
        registeredGames: [],
        preferredRoles: [],
        skillLevel: 'Intermediate' as const,
        stats: { wins: 0, losses: 0, points: 1000 },
        createdAt: Date.now()
      };
    });

    if (isCaptain) {
      if (eligibleMembers.length > 0) {
        // Open modal to select new leader before leaving
        setSelectedNewCaptainId(eligibleMembers[0].uid);
        setLeaveModalOpen(true);
        return;
      } else {
        // Captain is alone - prompt disband
        if (!window.confirm("⚠️ You are the last remaining member of this team. Leaving will disband the team organization. Proceed?")) return;
        clearMessages();
        setActionLoading(true);
        try {
          await transferLeaderOrDisband(team, user.uid);
          setSuccess("You left the team. The team organization was disbanded.");
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to leave team.");
        } finally {
          setActionLoading(false);
        }
      }
    } else {
      // Regular roster member leaving
      if (!window.confirm(`Are you sure you want to leave ${team.name}?`)) return;
      clearMessages();
      setActionLoading(true);
      try {
        const teamRef = doc(db, "teams", team.id);
        await updateDoc(teamRef, {
          members: arrayRemove(user.uid)
        });
        setSuccess("Successfully left the team.");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to leave team.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Confirm Leave with Selected New Captain
  const handleConfirmLeaveWithNewCaptain = async () => {
    if (!team || !user || !selectedNewCaptainId) return;

    clearMessages();
    setActionLoading(true);

    try {
      const res = await transferCaptainToSelectedMember(team, selectedNewCaptainId, user.uid);
      setLeaveModalOpen(false);
      setSuccess(`You left the team. Team Captain leadership was transferred to @${res.newCaptainGamertag}!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to transfer leadership and leave.");
    } finally {
      setActionLoading(false);
    }
  };

  // Remove member (Captain only)
  const handleRemoveMember = async (memberUid: string, memberGamertag: string) => {
    if (!team) return;
    if (!window.confirm(`Are you sure you want to remove @${memberGamertag} from the team?`)) return;

    clearMessages();
    try {
      const teamRef = doc(db, "teams", team.id);
      await updateDoc(teamRef, {
        members: arrayRemove(memberUid)
      });
      setSuccess(`Removed @${memberGamertag} from the team.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("Action failed: Only the team captain can remove members.");
      } else {
        setError("Failed to remove member.");
      }
    }
  };

  // Disband team (Captain only)
  const handleDisbandTeam = async () => {
    if (!team) return;
    if (!window.confirm("CRITICAL: Disbanding the team is permanent and removes all roster memberships. Proceed?")) return;

    clearMessages();
    setActionLoading(true);

    try {
      await deleteDoc(doc(db, "teams", team.id));
      setSuccess("Team disbanded successfully.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        setError("Action failed: Only the team captain can disband the team.");
      } else {
        setError("Failed to disband team.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || teamLoading) {
    return (
      <div style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
          <div className="glass-panel skeleton-pulse" style={{ padding: '2.5rem', height: '120px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2-col">
            <div className="glass-panel skeleton-pulse" style={{ padding: '2.5rem', height: '350px' }} />
            <div className="glass-panel skeleton-pulse" style={{ padding: '2.5rem', height: '350px' }} />
          </div>
        </div>
      </div>
    );
  }

  const isCaptain = team?.captainId === user?.uid;

  return (
    <main style={{ position: 'relative', minHeight: 'calc(100vh - 4.5rem)', padding: '7.5rem 1.5rem 4rem 1.5rem' }}>
      <div className="hero-glow hero-glow-1" />
      <div className="hero-glow hero-glow-2" />

      <div className="container" style={{ maxWidth: '900px', position: 'relative', zIndex: 1 }}>
        
        {/* Title & Multi-Team Tabs Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={32} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 900, lineHeight: 1.1 }}>Team Management</h1>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Create, join, and manage multiple competitive esports teams.
              </span>
            </div>
          </div>

          {/* Active Team Switcher Pills */}
          {teams.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {teams.map((t) => {
                const isCap = t.captainId === user?.uid;
                const isSelected = team?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTeamId(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '9999px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(112, 0, 255, 0.25))' 
                        : 'var(--bg-secondary, rgba(15, 23, 42, 0.6))',
                      border: isSelected ? '1.5px solid #00f0ff' : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                      color: isSelected ? '#00f0ff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 15px rgba(0, 240, 255, 0.2)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isCap ? <Crown size={14} style={{ color: '#f59e0b' }} /> : <Shield size={14} style={{ color: '#00f0ff' }} />}
                    <span>{t.name}</span>
                    <span style={{ fontSize: '0.675rem', opacity: 0.8, background: 'rgba(255,255,255,0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {isCap ? 'CAPTAIN' : 'MEMBER'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Notifications */}
        {(error || success) && (
          <div style={{
            background: error ? 'hsla(350, 85%, 55%, 0.12)' : 'hsla(145, 80%, 45%, 0.12)',
            border: `1px solid ${error ? 'var(--accent-red)' : 'var(--accent-green)'}`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: error ? 'var(--accent-red)' : 'var(--accent-green)',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error || success}</span>
          </div>
        )}

        {/* SECTION 1: SELECTED ACTIVE TEAM MANAGEMENT */}
        {team && (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2rem' }} className="grid-2-col">
              
              {/* Roster & Members list */}
              <GlassCard variant="panel" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <Badge variant="cyan">ACTIVE ROSTER</Badge>
                      {isCaptain && <Badge variant="gold">CAPTAIN VIEW</Badge>}
                    </div>
                    <h2 style={{ fontSize: '1.75rem' }}>{team.name}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button 
                      onClick={handleLeaveTeam}
                      variant="outline"
                      style={{ fontSize: '0.85rem', color: 'var(--neon-blue)', borderColor: 'rgba(0, 240, 255, 0.4)', padding: '0.4rem 0.8rem' }}
                      disabled={actionLoading}
                    >
                      <LogOut size={14} style={{ marginRight: '0.2rem' }} />
                      {isCaptain ? 'Leave & Transfer Leadership' : 'Leave Team'}
                    </Button>
                    {isCaptain && (
                      <Button 
                        onClick={handleDisbandTeam}
                        variant="outline"
                        style={{ fontSize: '0.85rem', color: 'var(--accent-red)', padding: '0.4rem 0.8rem' }}
                        disabled={actionLoading}
                      >
                        Disband Team
                      </Button>
                    )}
                  </div>
                </div>

                {/* Roster list */}
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Roster Members ({memberProfiles.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {memberProfiles.map((member) => {
                    const memberIsCaptain = member.uid === team.captainId;
                    return (
                      <GlassCard key={member.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: 'var(--bg-secondary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 700,
                            border: '1px solid var(--border-color)'
                          }}>
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Link href={`/players/${member.gamertag}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }} className="hover-cyan">
                                {member.displayName}
                              </Link>
                              {memberIsCaptain && (
                                <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.1rem' }} title="Captain">
                                  <Shield size={12} />
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{member.gamertag} &bull; {member.skillLevel}</div>
                          </div>
                        </div>

                        {/* Captain actions */}
                        {isCaptain && !memberIsCaptain && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button 
                              onClick={() => handleTransferCaptaincy(member.uid, member.gamertag)}
                              className="btn btn-outline"
                              style={{ 
                                padding: '0.35rem 0.65rem', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                color: '#f59e0b', 
                                borderColor: 'rgba(245, 158, 11, 0.35)', 
                                background: 'rgba(245, 158, 11, 0.08)',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.3rem' 
                              }}
                              title="Promote to Team Captain"
                            >
                              <Crown size={14} /> Make Captain
                            </button>
                            <button 
                              onClick={() => handleRemoveMember(member.uid, member.gamertag)}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              title="Remove Player"
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Captain Actions Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {isCaptain ? (
                  <>
                    {/* Invite Panel */}
                    <GlassCard variant="panel" style={{ padding: '2rem' }}>
                      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={18} style={{ color: 'var(--accent-cyan)' }} />
                        Recruit Teammate
                      </h2>
                      <form onSubmit={handleSendInvite}>
                        <div className="form-group">
                          <label htmlFor="invite-gamertag" className="form-label">Search Gamertag</label>
                          <div className="input-glow-wrapper">
                            <span style={{ position: 'absolute', left: '1rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>@</span>
                            <input
                              id="invite-gamertag"
                              type="text"
                              className="glass-input"
                              style={{ paddingLeft: '2.25rem' }}
                              placeholder="gamertag..."
                              value={inviteGamertag}
                              onChange={(e) => setInviteGamertag(e.target.value)}
                              disabled={actionLoading}
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          variant="primary" 
                          style={{ width: '100%', height: '2.6rem' }}
                          disabled={actionLoading}
                        >
                          Send Roster Invite
                        </Button>
                      </form>
                    </GlassCard>

                    {/* Pending Outbound Invites */}
                    <GlassCard variant="panel" style={{ padding: '2rem' }}>
                      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Pending Outbound Invites</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        {team.pendingInvites && team.pendingInvites.map((pGamertag) => (
                          <div key={pGamertag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>@{pGamertag}</span>
                            <button 
                              onClick={() => handleRevokeInvite(pGamertag)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                              title="Cancel Invite"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {(!team.pendingInvites || team.pendingInvites.length === 0) && (
                          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending outbound invites.</p>
                        )}
                      </div>
                    </GlassCard>
                  </>
                ) : (
                  <GlassCard variant="panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Role Info</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      You are a registered roster member of <strong style={{ color: 'var(--text-primary)' }}>{team.name}</strong>.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                      Only the captain can modify team rosters, invite new players, or sign up the team for bracket tournaments.
                    </p>
                  </GlassCard>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SECTION 2: CREATE NEW TEAM & ACTIVE INVITATIONS (ALWAYS ACCESSIBLE) */}
        <div style={{ marginTop: team ? '2rem' : '0' }}>
          {team && (
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <PlusCircle size={20} style={{ color: 'var(--accent-cyan)' }} />
              Create Another Team or Join Teams
            </h2>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="grid-2-col">
            {/* Create Team Card */}
            <GlassCard variant="panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} style={{ color: 'var(--accent-cyan)' }} />
                {teams.length > 0 ? 'Create Additional Team' : 'Create a Roster'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Establish a new competitive roster. As Captain, you will invite members, manage the team, and register for tournaments.
              </p>

              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label htmlFor="new-team-name" className="form-label">Team / Organization Name</label>
                  <input
                    id="new-team-name"
                    type="text"
                    className="glass-input"
                    placeholder="Enter team name..."
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Initialize Team'}
                </Button>
              </form>
            </GlassCard>

            {/* Received Invitations Card */}
            <GlassCard variant="panel" style={{ padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} style={{ color: 'var(--accent-violet)' }} />
                Pending Team Invites ({receivedInvites.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                {receivedInvites.map((invTeam) => {
                  const isActioning = actioningInviteId === invTeam.id;
                  return (
                    <div 
                      key={invTeam.id} 
                      className="glass-card" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: isActioning ? '0px' : '1rem',
                        opacity: isActioning ? 0 : 1,
                        maxHeight: isActioning ? '0px' : '120px',
                        overflow: 'hidden',
                        transition: 'opacity 200ms ease, max-height 200ms ease, padding 200ms ease, margin-bottom 200ms ease',
                        marginBottom: isActioning ? '0px' : '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{invTeam.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created by Captain</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                          onClick={() => handleAcceptInvite(invTeam)}
                          variant="primary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          title="Accept Invite"
                          disabled={actionLoading}
                        >
                          <Check size={14} />
                        </Button>
                        <Button 
                          onClick={() => handleRejectInvite(invTeam)}
                          variant="outline"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent-red)' }}
                          title="Decline Invite"
                          disabled={actionLoading}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {receivedInvites.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    <Users size={32} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No pending team invitations.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

      </div>

      {/* Leadership Transfer & Leave Modal */}
      {leaveModalOpen && team && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-secondary, #0f172a)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 25px rgba(245, 158, 11, 0.15)',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                <Crown size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Select New Team Captain</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  Appoint a successor from your roster before leaving <strong>{team.name}</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '1.5rem 0', maxHeight: '260px', overflowY: 'auto' }}>
              {(team.members || []).filter(uid => uid !== user?.uid).map((memberUid) => {
                const m = memberProfiles.find(p => p.uid === memberUid) || {
                  uid: memberUid,
                  displayName: 'Active Roster Member',
                  gamertag: 'player',
                  skillLevel: 'Intermediate'
                };
                const isSelected = selectedNewCaptainId === m.uid;
                return (
                  <div 
                    key={m.uid}
                    onClick={() => setSelectedNewCaptainId(m.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary, rgba(2,4,10,0.4))',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isSelected ? '#f59e0b' : 'var(--bg-secondary)', color: isSelected ? '#000' : 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                        {m.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.displayName}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>@{m.gamertag} &bull; {m.skillLevel}</div>
                      </div>
                    </div>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #f59e0b' : '2px solid var(--border-color)', background: 'transparent' }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="btn btn-outline"
                disabled={actionLoading}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmLeaveWithNewCaptain}
                disabled={actionLoading || !selectedNewCaptainId}
                className="btn btn-primary"
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: (actionLoading || !selectedNewCaptainId) ? 'not-allowed' : 'pointer'
                }}
              >
                <Crown size={16} />
                {actionLoading ? 'Transferring...' : 'Transfer & Leave Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
