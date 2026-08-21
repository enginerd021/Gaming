import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const hasCredentials = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY) && 
                           (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL);
    
    if (isDev && !hasCredentials) {
      console.warn("[DEV ONLY] Firebase credentials are not configured in local environment variables. Simulating successful account deletion for UI testing.");
      return NextResponse.json({
        success: true,
        message: 'Account deletion simulated successfully (local development fallback)'
      }, { status: 200 });
    }

    if (!hasCredentials) {
      console.error("Firebase Admin credentials are not configured in local environment variables.");
      return NextResponse.json({
        error: "Server Configuration Error: Firebase credentials are missing. Please add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to your local .env.local file or Vercel dashboard."
      }, { status: 500 });
    }

    // 1. Authenticate the request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authErr: any) {
      console.error('Auth verification failed during account deletion:', authErr);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // 2. Fetch the profile document to get gamertag
    const profileRef = adminDb.doc(`profiles/${userId}`);
    const profileSnap = await profileRef.get();
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profileData = profileSnap.data() || {};
    const gamertag = profileData.gamertag;

    // 3. Process all teams where the user is a member
    const teamsQuery = await adminDb.collection('teams')
      .where('members', 'array-contains', userId)
      .get();

    const batch = adminDb.batch();

    for (const teamDoc of teamsQuery.docs) {
      const teamId = teamDoc.id;
      const teamData = teamDoc.data();
      const members = teamData.members || [];
      const remainingMembers = members.filter((uid: string) => uid !== userId);

      if (teamData.captainId === userId) {
        // User is the captain of this team
        if (remainingMembers.length > 0) {
          // Appoint the next member in sequence as captain
          const nextCaptainId = remainingMembers[0];

          // Update team doc with new captain and updated member roster
          batch.update(teamDoc.ref, {
            captainId: nextCaptainId,
            members: remainingMembers
          });

          // Fetch new captain's profile to personalize notification
          const newCapProfileRef = adminDb.doc(`profiles/${nextCaptainId}`);
          const newCapSnap = await newCapProfileRef.get();
          const newCapGamertag = newCapSnap.exists() ? (newCapSnap.data()?.gamertag || 'Player') : 'Player';

          // Notification for the new Captain
          const newCapNotifRef = adminDb.collection(`profiles/${nextCaptainId}/notifications`).doc();
          batch.set(newCapNotifRef, {
            type: 'captain_transferred',
            message: `👑 The previous leader left. You have been appointed as the new Team Captain of ${teamData.name}!`,
            relatedId: teamId,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            teamId: teamId
          });

          // Notification for other remaining members
          remainingMembers.slice(1).forEach((memberUid: string) => {
            const notifRef = adminDb.collection(`profiles/${memberUid}/notifications`).doc();
            batch.set(notifRef, {
              type: 'captain_updated',
              message: `🛡️ The team captain has left. @${newCapGamertag} is now the Captain of ${teamData.name}.`,
              relatedId: teamId,
              read: false,
              createdAt: FieldValue.serverTimestamp(),
              teamId: teamId
            });
          });
        } else {
          // Sole member is the captain; disband the team
          batch.delete(teamDoc.ref);
        }
      } else {
        // User is a regular member; remove from members array
        batch.update(teamDoc.ref, {
          members: remainingMembers
        });
      }
    }

    // 4. Delete all tournament registrations associated with the user
    const regsQuery = await adminDb.collection('tournamentRegistrations')
      .where('userId', '==', userId)
      .get();
    for (const regDoc of regsQuery.docs) {
      batch.delete(regDoc.ref);
    }

    // 5. Delete all user notifications
    const notifsQuery = await adminDb.collection(`profiles/${userId}/notifications`).get();
    for (const notifDoc of notifsQuery.docs) {
      batch.delete(notifDoc.ref);
    }

    // 6. Delete the profile document itself
    batch.delete(profileRef);

    // 7. Delete the gamertag doc from the global collection if it exists
    if (gamertag) {
      const gamertagRef = adminDb.doc(`gamertags/${gamertag.toLowerCase()}`);
      batch.delete(gamertagRef);
    }

    // Commit all Firestore operations in a single transaction batch
    await batch.commit();

    // 8. Delete user account from Firebase Auth
    await adminAuth.deleteUser(userId);

    return NextResponse.json({ success: true, message: 'Account and associated records deleted successfully.' });
  } catch (err: any) {
    console.error('Failed to delete user account:', err);
    return NextResponse.json({ error: err.message || 'Server error during account deletion.' }, { status: 500 });
  }
}
