import { collection, onSnapshot, doc, query, orderBy, limit, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Tournament {
  id: string;
  name: string;
  game: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  entryType?: 'Free' | 'Paid';
  maxTeams: number;
  registeredTeamIds: string[];
  organizerId?: string;
  createdAt: number;
}

export const tournamentService = {
  /**
   * Real-time subscription for recent tournaments (e.g. Home Page)
   */
  subscribeRecentTournaments(max: number = 3, onUpdate: (tournaments: Tournament[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const q = query(
      collection(db, "tournaments"),
      orderBy("createdAt", "desc"),
      limit(max)
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
      onUpdate(list);
    }, (err) => {
      console.error("Error in subscribeRecentTournaments:", err);
      if (onError) onError(err);
    });
  },

  /**
   * Real-time subscription for all tournaments (e.g. Tournaments Arena Hub)
   */
  subscribeAllTournaments(onUpdate: (tournaments: Tournament[]) => void, onError?: (err: unknown) => void): Unsubscribe {
    const q = query(
      collection(db, "tournaments"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
      onUpdate(list);
    }, (err) => {
      console.error("Error in subscribeAllTournaments:", err);
      if (onError) onError(err);
    });
  },

  /**
   * Real-time subscription for single tournament document
   */
  subscribeTournamentById(id: string, onUpdate: (tournament: Tournament | null) => void, onError?: (err: unknown) => void): Unsubscribe {
    const ref = doc(db, "tournaments", id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as Tournament);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.error(`Error in subscribeTournamentById (${id}):`, err);
      if (onError) onError(err);
    });
  }
};
