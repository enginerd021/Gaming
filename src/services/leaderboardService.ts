import { collection, query, orderBy, limit, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Profile, Team } from '@/store/useAppStore';
import { onSnapshot } from '@/lib/firebaseCall';

export const leaderboardService = {
  subscribeProfiles(maxLimit: number, onUpdate: (profiles: Profile[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const q = query(
      collection(db, "profiles"),
      orderBy("stats.points", "desc"),
      limit(maxLimit)
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc: any) => doc.data() as Profile);
      onUpdate(list);
    }, (err) => {
      console.error("Leaderboard profiles listener error:", err);
      if (onError) onError(err);
    });
  },

  subscribeTeams(maxLimit: number, onUpdate: (teams: Team[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const q = query(
      collection(db, "teams"),
      limit(maxLimit)
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Team));
      onUpdate(list);
    }, (err) => {
      console.error("Leaderboard teams listener error:", err);
      if (onError) onError(err);
    });
  }
};
