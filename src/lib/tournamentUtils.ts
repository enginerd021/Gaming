import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tournament } from '@/services/tournamentService';

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
  
  const startDate = tournament.startDate 
    ? tournament.startDate 
    : (tournament.createdAt ? tournament.createdAt + 3600000 : Date.now());

  const roundDurationMs = roundDurationMins * 60 * 1000;
  const totalDurationMs = totalRounds * roundDurationMs;
  const estimatedEndTime = tournament.estimatedEndTime 
    ? tournament.estimatedEndTime 
    : startDate + totalDurationMs;

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

  // 4. Check time window
  const window = calculateTournamentTimeWindow(tournament);
  const now = Date.now();

  // If time window has expired and any match scores are entered -> Completed
  if (now >= window.estimatedEndTime && matches.some(m => m.winnerId || m.score1 > 0 || m.score2 > 0)) {
    return 'Completed';
  }

  // 5. Active status: if status is explicitly Active, or if startDate has passed, or if any match is live/played
  if (
    tournament.status === 'Active' ||
    now >= window.startDate ||
    matches.some(m => (m as any).status === 'live' || m.winnerId || m.score1 > 0 || m.score2 > 0)
  ) {
    return 'Active';
  }

  return 'Upcoming';
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
      const q = query(collection(db, 'teams'), where('__name__', 'in', chunk));
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
