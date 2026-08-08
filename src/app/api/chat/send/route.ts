import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { isAdmin } from '@/lib/adminConfig';

const PROFANITY_WORDS = [
  // English
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'bastard', 'slut', 'whore', 'fag', 'nigger', 'bastard',
  // Hindi / Hinglish
  'saala', 'sala', 'chutiya', 'chutya', 'chut1ya', 'chu', 'bhenchod', 'behenchod', 'madarchod', 'harami', 'kamina', 'kaminey', 'randi', 
  'gaand', 'gand', 'loda', 'lauda', 'bhosadi', 'bhosdike', 'bhosada', 'lodu', 'muth', 'muthi', 'tatte', 'kutta', 'kamine', 'gandi', 
  'g@ndi', 'g@nd', 'bc', 'mc'
];

function checkProfanity(text: string): boolean {
  const lowercaseText = text.toLowerCase();
  
  // 1. Direct word check
  const words = lowercaseText.split(/[^a-zA-Z0-9]/);
  for (const w of words) {
    if (PROFANITY_WORDS.includes(w)) return true;
  }

  // 2. Normalize text by removing spaces/punctuation and replacing leetspeak
  const normalized = lowercaseText
    .replace(/[^a-z0-9]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/!/g, 'i');

  for (const badWord of PROFANITY_WORDS) {
    const normalizedBadWord = badWord.replace(/[^a-z0-9]/g, '');
    if (normalized.includes(normalizedBadWord)) {
      return true;
    }
  }

  return false;
}

function containsLinks(text: string): boolean {
  // Direct URL regex (http, https, ftp, file, mailto, etc., and www)
  const urlRegex = /(https?:\/\/|www\.)/i;
  if (urlRegex.test(text)) return true;

  // Domain regex that catches bare domains and obfuscations (e.g. google.com, google . com, google[.]com, google dot com, google (dot) com)
  const dotPattern = /(?:\.|\s*\[\.\]\s*|\s*dot\s*|\s*\(dot\)\s*|\s+dot\s+)/i;
  const tldPattern = /(?:com|net|org|in|edu|gov|io|co|xyz|info|biz|me|us|uk|app|dev|tech)\b/i;
  const domainPattern = new RegExp(`[a-zA-Z0-9-]{2,}` + dotPattern.source + tldPattern.source, 'i');
  
  if (domainPattern.test(text)) return true;

  return false;
}

function containsBase64Image(text: string): boolean {
  // Matches base64 data URI structure for images, e.g., data:image/png;base64,iVBORw...
  const base64ImageRegex = /data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i;
  return base64ImageRegex.test(text);
}

async function logFlaggedMessage(userId: string, gamertag: string, text: string, reason: string) {
  try {
    await adminDb.collection('flaggedMessages').add({
      userId,
      userGamertag: gamertag,
      text,
      reason,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to log flagged message:', err);
  }
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
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    const emailVerified = decodedToken.email_verified;

    // Reject unverified email addresses
    if (!emailVerified) {
      return NextResponse.json({ error: 'Email verification is required to chat.' }, { status: 403 });
    }

    // 2. Check mute status in mutedUsers collection
    const muteSnap = await adminDb.doc(`mutedUsers/${userId}`).get();
    if (muteSnap.exists) {
      const muteData = muteSnap.data() || {};
      const mutedUntil = muteData.mutedUntil || 0;
      const now = Date.now();
      if (mutedUntil > now) {
        const minutesLeft = Math.ceil((mutedUntil - now) / 60000);
        return NextResponse.json({ 
          error: `You are muted from chat. Cooldown remaining: ${minutesLeft} minute(s).`,
          muted: true,
          mutedUntil
        }, { status: 403 });
      } else {
        // Mute expired, clean up database record
        await adminDb.doc(`mutedUsers/${userId}`).delete();
      }
    }

    // 3. Fetch user profile
    const profileSnap = await adminDb.doc(`profiles/${userId}`).get();
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'Player profile not found. Please complete registration.' }, { status: 404 });
    }
    const profileData = profileSnap.data() || {};
    const gamertag = profileData.gamertag || 'Player';
    const displayName = profileData.displayName || gamertag;
    const avatarUrl = profileData.avatar || '';

    // 4. Impersonation Guard
    // Block usernames starting with Admin, Mod, or SHAKTRIX unless they are verified in the ADMIN_EMAILS configuration
    const lowerGamertag = gamertag.toLowerCase();
    const lowerDisplayName = displayName.toLowerCase();
    const userIsAdmin = isAdmin(userEmail);

    const isImpersonating = 
      lowerGamertag.startsWith('admin') || 
      lowerGamertag.startsWith('mod') || 
      lowerGamertag.startsWith('shaktrix') ||
      lowerDisplayName.startsWith('admin') || 
      lowerDisplayName.startsWith('mod') || 
      lowerDisplayName.startsWith('shaktrix');

    if (isImpersonating && !userIsAdmin) {
      await logFlaggedMessage(userId, gamertag, gamertag, 'Impersonation attempt (reserved word)');
      return NextResponse.json({ 
        error: "Impersonation detected: display names or gamertags starting with 'Admin', 'Mod', or 'SHAKTRIX' are restricted to staff."
      }, { status: 403 });
    }

    // 5. Parse request body
    const body = await request.json();
    const { text, type, inviteData } = body;

    if (!type || !['text', 'emoji', 'invite'].includes(type)) {
      return NextResponse.json({ error: 'Invalid message type.' }, { status: 400 });
    }

    if (type !== 'invite' && (!text || !text.trim())) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const cleanText = (text || '').trim();

    if (type !== 'invite' && cleanText.length > 300) {
      return NextResponse.json({ error: 'Message exceeds maximum length of 300 characters.' }, { status: 400 });
    }

    // New base64 Image Check
    if (type !== 'invite' && containsBase64Image(cleanText)) {
      await logFlaggedMessage(userId, gamertag, '[Base64 Image Payload]', 'Blocked base64 image data upload');
      return NextResponse.json({ error: 'Base64 image uploads are not permitted in chat.' }, { status: 400 });
    }

    // 6. Rate Limit check
    const now = Date.now();
    
    // Separate rate limiting for invites (30s cooldown)
    if (type === 'invite') {
      const lastInviteAt = profileData.lastInviteAt || 0;
      if (now - lastInviteAt < 30000) {
        const inviteCooldownLeft = Math.ceil((30000 - (now - lastInviteAt)) / 1000);
        return NextResponse.json({ error: `Please wait ${inviteCooldownLeft} seconds before posting another recruitment card.` }, { status: 429 });
      }
    } else {
      // 1 message per 2 seconds for standard text/emojis
      const lastMessageAt = profileData.lastMessageAt || 0;
      if (now - lastMessageAt < 2000) {
        return NextResponse.json({ error: 'Please wait 2 seconds between messages.' }, { status: 429 });
      }
    }

    // 7. Spam Duplicate check (back-to-back 3x repeat)
    const lastMessageText = profileData.lastMessageText || '';
    const lastMessageTextCount = profileData.lastMessageTextCount || 0;
    const isDuplicate = cleanText === lastMessageText;

    if (isDuplicate && lastMessageTextCount >= 2) {
      await logFlaggedMessage(userId, gamertag, cleanText, 'Spam duplicate message (3x back-to-back)');
      return NextResponse.json({ error: 'Spam block: identical messages cannot be sent back-to-back.' }, { status: 400 });
    }

    // 8. Link detection validation
    if (type !== 'invite' && containsLinks(cleanText)) {
      await logFlaggedMessage(userId, gamertag, cleanText, 'Links/URLs detected');
      return NextResponse.json({ error: 'Links, web URLs, and IP addresses are not permitted in chat.' }, { status: 400 });
    }

    // 9. Hindi & English Profanity filtering
    if (type !== 'invite' && checkProfanity(cleanText)) {
      const currentStrikes = profileData.chatStrikes || 0;
      const newStrikes = currentStrikes + 1;
      
      const reportId = `auto-profanity-${now}`;
      const batch = adminDb.batch();

      // Log to chatReports for moderation review
      batch.set(adminDb.doc(`chatReports/${reportId}`), {
        messageId: reportId,
        messageText: cleanText,
        reporterId: 'system',
        reportedUserId: userId,
        reportedUserGamertag: gamertag,
        reason: `System auto-flagged profanity (Strike ${newStrikes}/3)`,
        createdAt: FieldValue.serverTimestamp()
      });

      // Also log to flaggedMessages
      await logFlaggedMessage(userId, gamertag, cleanText, `System flagged profanity (Strike ${newStrikes}/3)`);

      if (newStrikes >= 3) {
        // Auto-mute user for 15 minutes
        const mutedUntil = now + 15 * 60 * 1000;
        batch.set(adminDb.doc(`mutedUsers/${userId}`), {
          uid: userId,
          gamertag: gamertag,
          mutedUntil: mutedUntil,
          reason: 'Auto-mute: 3 strikes for abusive language in global chat',
          mutedBy: 'system',
          createdAt: now
        });

        // Reset strikes
        batch.update(adminDb.doc(`profiles/${userId}`), {
          chatStrikes: 0,
          lastMessageAt: now
        });

        await batch.commit();

        return NextResponse.json({ 
          error: 'Message blocked: Profanity detected. You have been muted for 15 minutes due to repeated violations.',
          muted: true,
          mutedUntil
        }, { status: 403 });
      } else {
        // Update user strikes
        batch.update(adminDb.doc(`profiles/${userId}`), {
          chatStrikes: newStrikes,
          lastMessageAt: now
        });

        await batch.commit();

        return NextResponse.json({ 
          error: `Abusive language is not permitted. Warning: Strike ${newStrikes} of 3. Repeated offences will mute your chat.`,
          strike: newStrikes,
          maxStrikes: 3
        }, { status: 403 });
      }
    }

    // 10. Write Message and update player chat rate limit meta
    const messageData: any = {
      senderId: userId,
      senderGamertag: gamertag,
      senderAvatarUrl: avatarUrl,
      createdAt: FieldValue.serverTimestamp(),
      type
    };

    if (type === 'invite') {
      messageData.inviteData = {
        tournamentId: inviteData.tournamentId,
        tournamentName: inviteData.tournamentName,
        game: inviteData.game,
        teamId: inviteData.teamId,
        teamName: inviteData.teamName,
        slotsLeft: Number(inviteData.slotsLeft),
        slotsTotal: Number(inviteData.slotsTotal),
        status: 'active'
      };
      messageData.text = `Team Recruitment for ${inviteData.tournamentName}`;
    } else {
      messageData.text = cleanText;
    }

    const messageRef = adminDb.collection('globalChatMessages').doc();
    const profileRef = adminDb.doc(`profiles/${userId}`);
    const batch = adminDb.batch();

    batch.set(messageRef, messageData);
    
    const profileUpdate: any = {
      lastMessageAt: now,
      lastMessageText: cleanText,
      lastMessageTextCount: isDuplicate ? lastMessageTextCount + 1 : 1
    };
    if (type === 'invite') {
      profileUpdate.lastInviteAt = now;
    }
    batch.update(profileRef, profileUpdate);

    await batch.commit();

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
      message: messageData
    });

  } catch (err: any) {
    console.error('Error sending chat message:', err);
    return NextResponse.json({ error: err.message || 'Server error sending message.' }, { status: 500 });
  }
}
