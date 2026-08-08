import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Force refresh user ID Token to ensure Firestore rules recognize auth immediately
  await user.getIdToken(true);

  // Check if profile document already exists
  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    // Generate a unique base gamertag from email prefix or displayName
    let baseGamertag = 'player';
    if (user.email) {
      baseGamertag = user.email.split('@')[0];
    } else if (user.displayName) {
      baseGamertag = user.displayName;
    }
    
    let cleanGamertag = baseGamertag.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanGamertag.length < 3) {
      cleanGamertag = 'player';
    }

    // Loop to resolve conflicts
    let finalGamertag = cleanGamertag;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 20) {
      const claimRef = doc(db, "gamertags", finalGamertag);
      const claimSnap = await getDoc(claimRef);
      
      if (!claimSnap.exists()) {
        isUnique = true;
        // Claim the gamertag
        await setDoc(claimRef, { uid: user.uid });
      } else {
        // Check if we already own it (edge case)
        if (claimSnap.data()?.uid === user.uid) {
          isUnique = true;
        } else {
          // Conflict: append random digits
          attempts++;
          const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digit number
          finalGamertag = `${cleanGamertag}_${randomSuffix}`;
        }
      }
    }

    // If still not unique after 20 attempts, use timestamp suffix
    if (!isUnique) {
      finalGamertag = `${cleanGamertag}_${Date.now().toString().slice(-4)}`;
      const claimRef = doc(db, "gamertags", finalGamertag);
      await setDoc(claimRef, { uid: user.uid });
    }

    // Create the profile document
    await setDoc(profileRef, {
      uid: user.uid,
      gamertag: finalGamertag,
      displayName: user.displayName || user.email?.split('@')[0] || 'Player',
      registeredGames: [],
      preferredRoles: [],
      skillLevel: 'Intermediate',
      stats: {
        wins: 0,
        losses: 0,
        points: 1000
      },
      createdAt: Date.now()
    });

    return { isNewUser: true, user };
  }

  return { isNewUser: false, user };
}
