import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to determine maximum team members based on the game
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

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authErr: any) {
      console.error('Auth verification failed:', authErr);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const emailVerified = decodedToken.email_verified;

    // Reject unverified email addresses
    if (!emailVerified) {
      return NextResponse.json({ error: 'Email verification is required to join teams.' }, { status: 403 });
    }

    // 2. Parse request payload
    const body = await request.json();
    const { teamId, tournamentId, senderId } = body;

    if (!teamId || !tournamentId || !senderId) {
      return NextResponse.json({ error: 'Missing required parameters: teamId, tournamentId, senderId' }, { status: 400 });
    }

    // 3. Fetch player profile to get gamertag
    const profileSnap = await adminDb.doc(`profiles/${userId}`).get();
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'Player profile not found. Please complete registration.' }, { status: 404 });
    }
    const profileData = profileSnap.data() || {};
    const playerGamertag = (profileData.gamertag || '').trim().toLowerCase();

    // 4. Fetch tournament details
    const tournamentSnap = await adminDb.doc(`tournaments/${tournamentId}`).get();
    if (!tournamentSnap.exists) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }
    const tournamentData = tournamentSnap.data() || {};
    const registeredTeamIds: string[] = tournamentData.registeredTeamIds || [];
    const maxTeams = tournamentData.maxTeams || 4;
    const game = tournamentData.game || '';
    const status = tournamentData.status || 'Upcoming';

    // Verify tournament state
    if (status !== 'Upcoming') {
      return NextResponse.json({ error: 'Registration is closed. This tournament has already started or finished.' }, { status: 400 });
    }

    // 5. Fetch target team details
    const teamSnap = await adminDb.doc(`teams/${teamId}`).get();
    if (!teamSnap.exists) {
      return NextResponse.json({ error: 'Target team not found.' }, { status: 404 });
    }
    const teamData = teamSnap.data() || {};
    const members: string[] = teamData.members || [];
    
    // Check if player is already in this team
    if (members.includes(userId)) {
      return NextResponse.json({ success: true, message: 'You are already a member of this team.' });
    }

    // Check if team is full
    const sizeLimit = getGameTeamSizeLimit(game);
    if (members.length >= sizeLimit) {
      return NextResponse.json({ error: `This team is already full (maximum ${sizeLimit} players).` }, { status: 400 });
    }

    // Verify sender is captain or member of the team
    const teamCaptainId = teamData.captainId || '';
    const isSenderMember = members.includes(senderId) || teamCaptainId === senderId;
    if (!isSenderMember) {
      return NextResponse.json({ error: "Sender isn't a member/captain of the team they're inviting to." }, { status: 400 });
    }

    // 6. ANTI-MULTI-TEAM CHECK: Ensure player is not already on any team in this tournament
    // Direct tournamentRegistrations collection check
    const regDocSnap = await adminDb.collection('tournamentRegistrations')
      .where('userId', '==', userId)
      .where('tournamentId', '==', tournamentId)
      .get();
    
    if (!regDocSnap.empty) {
      return NextResponse.json({ error: "You're already on a team in this tournament." }, { status: 400 });
    }

    // Backup check: Query all teams where this user is currently a member
    const userTeamsSnap = await adminDb.collection('teams')
      .where('members', 'array-contains', userId)
      .get();
    
    const userTeamIds = userTeamsSnap.docs.map((doc: any) => doc.id);
    
    // Check if any of the user's teams are registered in this tournament
    const alreadyRegistered = userTeamIds.some((uTeamId: string) => registeredTeamIds.includes(uTeamId));
    if (alreadyRegistered) {
      return NextResponse.json({ error: "You're already on a team in this tournament." }, { status: 400 });
    }

    // 7. Transaction/Batch to update team membership and clear pending invites
    const teamRef = adminDb.doc(`teams/${teamId}`);
    const batch = adminDb.batch();

    batch.update(teamRef, {
      members: FieldValue.arrayUnion(userId),
      // Remove both their gamertag and any lowercase variants from pendingInvites
      pendingInvites: FieldValue.arrayRemove(playerGamertag, playerGamertag.toLowerCase())
    });

    // Write to tournamentRegistrations
    const regRef = adminDb.collection('tournamentRegistrations').doc(`${userId}_${tournamentId}`);
    batch.set(regRef, {
      userId,
      tournamentId,
      teamId,
      joinedAt: FieldValue.serverTimestamp()
    });

    // Write a notification for team joining
    const notificationRef = adminDb.collection(`profiles/${userId}/notifications`).doc();
    batch.set(notificationRef, {
      type: 'registration_confirmed',
      message: `You have successfully joined team ${teamData.name} for tournament ${tournamentData.name}.`,
      relatedId: tournamentId,
      teamId: teamId,
      read: false,
      createdAt: FieldValue.serverTimestamp()
    });

    // Also write a notification to the team captain informing them a player joined
    if (teamData.captainId && teamData.captainId !== userId) {
      const captainNotificationRef = adminDb.collection(`profiles/${teamData.captainId}/notifications`).doc();
      batch.set(captainNotificationRef, {
        type: 'team_invite',
        message: `@${profileData.gamertag} joined your team ${teamData.name} via chat recruitment card.`,
        relatedId: teamId,
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully joined team ${teamData.name}!`,
      team: { id: teamId, name: teamData.name }
    });

  } catch (err: any) {
    console.error('Error joining team via invite:', err);
    return NextResponse.json({ error: err.message || 'Server error joining team.' }, { status: 500 });
  }
}
