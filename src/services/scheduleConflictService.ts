import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayRemove, 
  writeBatch, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

export interface ScheduledTournament {
  id: string;
  name: string;
  game: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  scheduledDate?: string; // YYYY-MM-DD
  timeSlot?: string;      // e.g. "18:00 - 21:00 EST"
  maxTeams: number;
  registeredTeamIds: string[];
}

export interface ConflictGroup {
  scheduledKey: string; // e.g. "2026-08-10_18:00"
  dateLabel: string;
  timeSlotLabel: string;
  tournaments: ScheduledTournament[];
}

/**
 * Detects whether a team is registered for multiple tournaments happening at the same date & time slot.
 */
export async function detectTeamScheduleConflicts(teamId: string): Promise<ConflictGroup[]> {
  if (!teamId) return [];

  try {
    const q = query(
      collection(db, "tournaments"),
      where("status", "==", "Upcoming"),
      where("registeredTeamIds", "array-contains", teamId)
    );

    const snap = await getDocs(q);
    if (snap.empty || snap.docs.length < 2) return [];

    const tournaments: ScheduledTournament[] = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || 'Tournament',
        game: data.game || 'Esports',
        status: data.status || 'Upcoming',
        scheduledDate: data.scheduledDate || new Date(data.createdAt || Date.now()).toISOString().split('T')[0],
        timeSlot: data.timeSlot || '18:00 - 21:00 EST',
        maxTeams: data.maxTeams || 8,
        registeredTeamIds: data.registeredTeamIds || []
      };
    });

    // Group by scheduled date & time slot
    const groupsMap: Record<string, ScheduledTournament[]> = {};

    tournaments.forEach((t) => {
      const dateStr = t.scheduledDate || 'TBD-Date';
      const slotStr = t.timeSlot || 'TBD-Slot';
      const key = `${dateStr}_${slotStr}`;

      if (!groupsMap[key]) {
        groupsMap[key] = [];
      }
      groupsMap[key].push(t);
    });

    const conflictGroups: ConflictGroup[] = [];

    for (const [key, groupTournaments] of Object.entries(groupsMap)) {
      if (groupTournaments.length > 1) {
        const [dateStr, slotStr] = key.split('_');
        conflictGroups.push({
          scheduledKey: key,
          dateLabel: dateStr,
          timeSlotLabel: slotStr,
          tournaments: groupTournaments
        });
      }
    }

    return conflictGroups;
  } catch (err) {
    console.error("Error detecting schedule conflicts:", err);
    return [];
  }
}

/**
 * Resolves a schedule conflict by keeping the chosen tournament registration
 * and automatically withdrawing the team from all other conflicting tournaments.
 */
export async function resolveScheduleConflict(
  teamId: string,
  chosenTournamentId: string,
  conflictingTournamentIds: string[]
): Promise<void> {
  if (!teamId || !chosenTournamentId) return;

  const toRemoveIds = conflictingTournamentIds.filter((id) => id !== chosenTournamentId);
  if (toRemoveIds.length === 0) return;

  const batch = writeBatch(db);

  // 1. Remove teamId from all unchosen conflicting tournaments
  for (const tId of toRemoveIds) {
    const tRef = doc(db, "tournaments", tId);
    batch.update(tRef, {
      registeredTeamIds: arrayRemove(teamId)
    });
  }

  // 2. Fetch team members to notify them of the schedule choice
  const teamSnap = await getDoc(doc(db, "teams", teamId));
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const members: string[] = teamData.members || [];
    const teamName = teamData.name || 'Team';

    // Fetch chosen tournament name
    const chosenSnap = await getDoc(doc(db, "tournaments", chosenTournamentId));
    const chosenName = chosenSnap.exists() ? chosenSnap.data().name : 'Selected Tournament';

    members.forEach((mId) => {
      const notifRef = doc(collection(db, "profiles", mId, "notifications"));
      batch.set(notifRef, {
        type: 'schedule_conflict_resolved',
        message: `🗓️ Schedule conflict resolved for ${teamName}: Confirmed registration for ${chosenName}.`,
        relatedId: chosenTournamentId,
        read: false,
        createdAt: serverTimestamp(),
        teamId
      });
    });
  }

  await batch.commit();
}
