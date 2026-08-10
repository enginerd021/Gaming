import { collection, query, where, getDocs, doc, getDoc, updateDoc, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament, Match, tournamentService } from '@/services/tournamentService';
import { useState, useEffect } from 'react';

/**
 * Safely parses any Firestore timestamp (number, Timestamp object, Date, string) to epoch milliseconds.
 */
export function parseTimestampToMs(val: any, fallback: number = Date.now()): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') {
    const parsed = new Date(val).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

export interface TournamentTimeWindow {
  startDate: number;
  estimatedEndTime: number;
  totalRounds: number;
  roundDurationMins: number;
  roundSchedules: Array<{
    round: number;
    startTime: number;
    endTime: number;
  }>;
}

/**
 * Calculates total rounds and start/end time windows for a tournament.
 * Enforces a MINIMUM duration of 45 minutes per round.
 */
export function calculateTournamentTimeWindow(tournament: Tournament): TournamentTimeWindow {
  const maxTeams = tournament.maxTeams || 4;
  const totalRounds = Math.max(1, Math.ceil(Math.log2(maxTeams)));
  
  // Enforce minimum 45 minutes per round requirement
  const roundDurationMins = Math.max(45, tournament.roundDurationMins || 45);
  
  const createdMs = parseTimestampToMs(tournament.createdAt, Date.now());
  const startDate = parseTimestampToMs(tournament.startDate || (tournament as any).startTime, createdMs + 3600000);

  const roundDurationMs = roundDurationMins * 60 * 1000;
  const totalDurationMs = totalRounds * roundDurationMs;
  const estimatedEndTime = parseTimestampToMs(tournament.estimatedEndTime, startDate + totalDurationMs);

  const roundSchedules = [];
  for (let r = 1; r <= totalRounds; r++) {
    const roundStart = startDate + (r - 1) * roundDurationMs;
    const roundEnd = roundStart + roundDurationMs;
    roundSchedules.push({
      round: r,
      startTime: roundStart,
      endTime: roundEnd
    });
  }

  return {
    startDate,
    estimatedEndTime,
    totalRounds,
    roundDurationMins,
    roundSchedules
  };
}

/**
 * Calculates real-time tournament status considering start date, end date, and match completion states.
 */
export function getEffectiveTournamentStatus(tournament: Tournament): 'Upcoming' | 'Active' | 'Completed' {
  if (!tournament) return 'Upcoming';

  // 1. Explicitly Completed status stored in document
  if (tournament.status === 'Completed') {
    return 'Completed';
  }

  const matches = tournament.bracket?.matches || [];
  const maxTeams = tournament.maxTeams || 4;
  const totalRounds = Math.max(1, Math.ceil(Math.log2(maxTeams)));
  const finalsMatchId = `m-${totalRounds}-1`;
  const finalsMatch = matches.find(m => m.id === finalsMatchId);

  // 2. If finals match has a winner or is completed -> Tournament is Completed!
  if (finalsMatch && (finalsMatch.winnerId || finalsMatch.score1 > 0 || finalsMatch.score2 > 0)) {
    return 'Completed';
  }

  // 3. If all non-bye matches in bracket have winnerId or completed status -> Completed
  if (matches.length > 0) {
    const playableMatches = matches.filter(m => m.team1Id && m.team2Id);
    if (playableMatches.length > 0 && playableMatches.every(m => m.winnerId || (m as any).status === 'completed')) {
      return 'Completed';
    }
  }

  // 4. Check time window: ONLY if matches were generated and played
  const window = calculateTournamentTimeWindow(tournament);
  const now = Date.now();

  if (matches.length > 0 && now >= window.estimatedEndTime) {
    return 'Completed';
  }

  // 5. Active status: if status is explicitly Active, or if startDate has passed, or if any match is live/played
  if (
    tournament.status === 'Active' ||
    (matches.length > 0 && now >= window.startDate) ||
    matches.some(m => (m as any).status === 'live' || m.winnerId || m.score1 > 0 || m.score2 > 0)
  ) {
    return 'Active';
  }

  return 'Upcoming';
}

/**
 * Custom hook to get reactively updated effective status for a tournament card/view.
 * Evaluates real-time state every second so badges & countdowns stay synchronized.
 */
export function useEffectiveTournamentStatus(tournament: Tournament | null | undefined): 'Upcoming' | 'Active' | 'Completed' {
  const [status, setStatus] = useState(() => tournament ? getEffectiveTournamentStatus(tournament) : 'Upcoming');

  useEffect(() => {
    if (!tournament) return;

    const updateStatus = () => {
      const current = getEffectiveTournamentStatus(tournament);
      setStatus(prev => prev !== current ? current : prev);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [tournament?.id, tournament?.startDate, tournament?.status, tournament?.estimatedEndTime]);

  return status;
}

/**
 * Checks if two time windows [start1, end1] and [start2, end2] overlap.
 */
export function areTimeWindowsOverlapping(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingPlayerId?: string;
  conflictingPlayerGamertag?: string;
  conflictingTournamentId?: string;
  conflictingTournamentName?: string;
  conflictTimeWindow?: string;
}

/**
 * Validates whether any player in the registering team is already in another tournament
 * that runs during the same time window.
 */
export async function checkPlayerTournamentOverlap(
  registeringMemberIds: string[],
  targetTournament: Tournament,
  allTournaments: Tournament[]
): Promise<ConflictCheckResult> {
  if (!registeringMemberIds || registeringMemberIds.length === 0) {
    return { hasConflict: false };
  }

  const targetWindow = calculateTournamentTimeWindow(targetTournament);

  // Find all active or upcoming tournaments (excluding target tournament itself)
  const candidateTournaments = allTournaments.filter((t) => {
    if (t.id === targetTournament.id) return false;
    if (getEffectiveTournamentStatus(t) === 'Completed') return false;
    if (!t.registeredTeamIds || t.registeredTeamIds.length === 0) return false;
    
    const candidateWindow = calculateTournamentTimeWindow(t);
    return areTimeWindowsOverlapping(
      targetWindow.startDate,
      targetWindow.estimatedEndTime,
      candidateWindow.startDate,
      candidateWindow.estimatedEndTime
    );
  });

  if (candidateTournaments.length === 0) {
    return { hasConflict: false };
  }

  // Check registered teams across all candidate overlapping tournaments
  for (const candidate of candidateTournaments) {
    const candidateWindow = calculateTournamentTimeWindow(candidate);
    const teamIds = candidate.registeredTeamIds || [];
    
    // Chunk queries for team docs (max 30 per 'in' query)
    const chunks = [];
    const idsCopy = [...teamIds];
    while (idsCopy.length > 0) {
      chunks.push(idsCopy.splice(0, 30));
    }

    for (const chunk of chunks) {
      const q = query(collection(db, 'teams'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        const teamData = docSnap.data();
        const teamMembers: string[] = teamData.members || [];
        
        // Find if any player in the registering roster is present in this registered team
        const conflictingUid = registeringMemberIds.find((mUid) => teamMembers.includes(mUid));
        
        if (conflictingUid) {
          // Fetch gamertag of conflicting player for clear messaging
          let gamertag = conflictingUid;
          try {
            const pDoc = await getDoc(doc(db, 'profiles', conflictingUid));
            if (pDoc.exists()) {
              gamertag = pDoc.data().gamertag || pDoc.data().displayName || conflictingUid;
            }
          } catch (e) {
            console.error('Failed to fetch player profile for conflict message:', e);
          }

          const windowStr = `${new Date(candidateWindow.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(candidateWindow.estimatedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          return {
            hasConflict: true,
            conflictingPlayerId: conflictingUid,
            conflictingPlayerGamertag: gamertag,
            conflictingTournamentId: candidate.id,
            conflictingTournamentName: candidate.name,
            conflictTimeWindow: windowStr
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Auto-checks if a tournament or any of its live matches have passed their scheduled time window / check-in deadline.
 * Automatically generates brackets when tournament start time is reached, resolves expired live matches,
 * and completes tournaments whose estimated end time or final matches have ended.
 */
export async function autoCheckTournamentStatus(tournament: Tournament, matches?: Match[]): Promise<boolean> {
  if (!tournament || (tournament.status as string) === 'Completed') return false;

  const timeWindow = calculateTournamentTimeWindow(tournament);
  const now = Date.now();
  let updated = false;

  const matchArray: Match[] = matches || (tournament as any).bracket?.matches || [];

  // 0. Auto-generate bracket when tournament start date is reached
  if (
    (tournament.status as string) === 'Upcoming' &&
    now >= timeWindow.startDate &&
    (!matchArray || matchArray.length === 0) &&
    tournament.registeredTeamIds &&
    tournament.registeredTeamIds.length >= 2
  ) {
    try {
      await tournamentService.generateBracket(tournament.id, tournament.registeredTeamIds);
      tournament.status = 'Active';
      return true;
    } catch (err) {
      console.error('Failed to auto-generate bracket at tournament start time:', err);
    }
  }

  if (matchArray.length > 0) {
    let matchesChanged = false;
    const updatedMatches = [...matchArray];

    for (let i = 0; i < updatedMatches.length; i++) {
      const m = updatedMatches[i];
      if (m.status !== 'live') continue;

      const roundEnd = timeWindow.startDate + m.round * timeWindow.roundDurationMins * 60 * 1000;
      const deadline = m.checkIn?.checkInDeadline || null;
      const checkInExpired = deadline ? now >= deadline : false;
      const roundExpired = now >= roundEnd;

      // Auto-resolve live match if round interval or check-in deadline has expired
      if (checkInExpired || roundExpired) {
        matchesChanged = true;
        const t1Checked = m.checkIn?.team1CheckedIn || false;
        const t2Checked = m.checkIn?.team2CheckedIn || false;

        let winnerId: string | null = null;
        let score1 = 0;
        let score2 = 0;

        if (t1Checked && !t2Checked) {
          winnerId = m.team1Id;
          score1 = 1;
          score2 = 0;
        } else if (t2Checked && !t1Checked) {
          winnerId = m.team2Id;
          score1 = 0;
          score2 = 1;
        } else {
          winnerId = m.team1Id || m.team2Id;
          if (winnerId === m.team1Id) {
            score1 = 1;
            score2 = 0;
          } else {
            score1 = 0;
            score2 = 1;
          }
        }

        if (winnerId) {
          updatedMatches[i] = {
            ...m,
            score1,
            score2,
            status: 'completed',
            winnerId,
            updatedAt: now,
            checkIn: m.checkIn ? { ...m.checkIn, checkInDeadline: null } : null
          };

          // Advance winner in bracket
          const maxTeams = tournament.maxTeams || 4;
          const totalRounds = Math.ceil(Math.log2(maxTeams));
          if (m.round < totalRounds) {
            const nextMatchNumber = Math.ceil(m.matchNumber / 2);
            const nextMatchId = `m-${m.round + 1}-${nextMatchNumber}`;
            const nextIdx = updatedMatches.findIndex(nm => nm.id === nextMatchId);
            if (nextIdx !== -1) {
              const nextM = { ...updatedMatches[nextIdx] };
              if (m.matchNumber % 2 === 1) {
                nextM.team1Id = winnerId;
              } else {
                nextM.team2Id = winnerId;
              }
              if (nextM.team1Id && nextM.team2Id) {
                nextM.status = 'live';
                nextM.checkIn = {
                  team1CheckedIn: false,
                  team2CheckedIn: false,
                  checkInDeadline: now + 10 * 60 * 1000,
                  disputed: false,
                  disputeReason: null,
                  disputedBy: null
                };
              }
              updatedMatches[nextIdx] = nextM;
            }
          }
        }
      }
    }

    if (matchesChanged) {
      updated = true;
      try {
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        await updateDoc(tournamentRef, {
          'bracket.matches': updatedMatches
        });
        (tournament as any).bracket = { matches: updatedMatches };
      } catch (err) {
        console.error('Failed to auto-resolve match timeouts in Firestore:', err);
      }
    }

    // Check if ALL matches are now completed
    const allMatchesCompleted = updatedMatches.length > 0 && updatedMatches.every(m => m.status === 'completed');
    if (allMatchesCompleted && (tournament.status as string) !== 'Completed') {
      updated = true;
      tournament.status = 'Completed';
      try {
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        await updateDoc(tournamentRef, { status: 'Completed' });
      } catch (err) {
        console.error('Failed to auto-complete tournament in Firestore:', err);
      }
      return true;
    }
  }

  // Auto-activate upcoming tournament if start date has arrived
  if (tournament.status === 'Upcoming' && now >= timeWindow.startDate) {
    updated = true;
    tournament.status = 'Active';
    try {
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, { status: 'Active' });
    } catch (err) {
      console.error('Failed to auto-activate starting tournament in Firestore:', err);
    }
  }

  // Also check overall tournament estimated end time
  if (tournament.status === 'Active' && now >= timeWindow.estimatedEndTime) {
    updated = true;
    tournament.status = 'Completed';
    try {
      const tournamentRef = doc(db, 'tournaments', tournament.id);
      await updateDoc(tournamentRef, { status: 'Completed' });
    } catch (err) {
      console.error('Failed to auto-complete expired tournament in Firestore:', err);
    }
    return true;
  }

  return updated;
}

