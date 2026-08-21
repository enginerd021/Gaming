import { db } from "@/lib/firebase";
import { 
  doc, 
  collection, 
  updateDoc, 
  serverTimestamp
} from "firebase/firestore";
import { getDoc, deleteDoc, writeBatch } from "@/lib/firebaseCall";
import { Team } from "@/store/useAppStore";

export interface TransferResult {
  disbanded: boolean;
  newCaptainId?: string;
}

/**
 * Automatically transfers team captaincy to the next member in sequence (the member who joined next)
 * when the current leader leaves the team, game, or tournament roster.
 * If no members remain, the team is cleanly disbanded.
 */
export async function transferLeaderOrDisband(
  team: Team,
  leavingUid: string
): Promise<TransferResult> {
  const teamRef = doc(db, "teams", team.id);
  const remainingMembers = (team.members || []).filter((uid) => uid !== leavingUid);

  if (remainingMembers.length > 0) {
    // The next leader is the next member in sequence (first remaining member in array)
    const nextCaptainId = remainingMembers[0];

    const batch = writeBatch(db);

    // 1. Update team document with new captain and updated member roster
    batch.update(teamRef, {
      captainId: nextCaptainId,
      members: remainingMembers
    });

    // 2. Fetch new captain's profile to personalize notification
    const newCapProfileRef = doc(db, "profiles", nextCaptainId);
    const newCapSnap = await getDoc(newCapProfileRef);
    const newCapGamertag = newCapSnap.exists() ? (newCapSnap.data().gamertag || 'Player') : 'Player';

    // 3. Create notification for the new Captain
    const newCapNotifRef = doc(collection(db, "profiles", nextCaptainId, "notifications"));
    batch.set(newCapNotifRef, {
      type: 'captain_transferred',
      message: `👑 The previous leader has left. You have been appointed as the new Team Captain of ${team.name}!`,
      relatedId: team.id,
      read: false,
      createdAt: serverTimestamp(),
      teamId: team.id
    });

    // 4. Create notifications for all other remaining members
    remainingMembers.slice(1).forEach((memberUid) => {
      const notifRef = doc(collection(db, "profiles", memberUid, "notifications"));
      batch.set(notifRef, {
        type: 'captain_updated',
        message: `🛡️ The team captain has left. @${newCapGamertag} is now the Captain of ${team.name}.`,
        relatedId: team.id,
        read: false,
        createdAt: serverTimestamp(),
        teamId: team.id
      });
    });

    await batch.commit();
    return { disbanded: false, newCaptainId: nextCaptainId };
  } else {
    // No remaining members - cleanly disband the team
    await deleteDoc(teamRef);
    return { disbanded: true };
  }
}

/**
 * Explicitly transfers team captaincy to a specific chosen member.
 * If leavingCaptainUid is specified, the leaving captain is also removed from team.members.
 */
export async function transferCaptainToSelectedMember(
  team: Team,
  newCaptainUid: string,
  leavingCaptainUid?: string
): Promise<{ success: boolean; newCaptainGamertag: string }> {
  const teamRef = doc(db, "teams", team.id);
  const updatedMembers = leavingCaptainUid
    ? (team.members || []).filter((uid) => uid !== leavingCaptainUid)
    : team.members;

  const batch = writeBatch(db);

  // 1. Update team document
  batch.update(teamRef, {
    captainId: newCaptainUid,
    members: updatedMembers
  });

  // 2. Fetch new captain's profile for notification text
  const newCapProfileRef = doc(db, "profiles", newCaptainUid);
  const newCapSnap = await getDoc(newCapProfileRef);
  const newCapGamertag = newCapSnap.exists()
    ? (newCapSnap.data().gamertag || newCapSnap.data().displayName || 'Player')
    : 'Player';

  // 3. Create notification for the new Captain
  const newCapNotifRef = doc(collection(db, "profiles", newCaptainUid, "notifications"));
  batch.set(newCapNotifRef, {
    type: 'captain_transferred',
    message: leavingCaptainUid 
      ? `👑 The previous captain left and appointed you as the new Team Captain of ${team.name}!`
      : `👑 You have been promoted to Team Captain of ${team.name}!`,
    relatedId: team.id,
    read: false,
    createdAt: serverTimestamp(),
    teamId: team.id
  });

  // 4. Create notifications for all other remaining team members
  updatedMembers.filter(m => m !== newCaptainUid).forEach((memberUid) => {
    const notifRef = doc(collection(db, "profiles", memberUid, "notifications"));
    batch.set(notifRef, {
      type: 'captain_updated',
      message: `🛡️ @${newCapGamertag} is now the Team Captain of ${team.name}.`,
      relatedId: team.id,
      read: false,
      createdAt: serverTimestamp(),
      teamId: team.id
    });
  });

  await batch.commit();
  return { success: true, newCaptainGamertag: newCapGamertag };
}
