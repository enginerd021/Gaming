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
    return { isNewUser: true, user };
  }

  return { isNewUser: false, user };
}
