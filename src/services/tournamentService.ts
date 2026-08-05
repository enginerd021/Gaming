import { collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
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
  async getRecentTournaments(max: number = 3): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, "tournaments"),
        orderBy("createdAt", "desc"),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
    } catch (err) {
      console.error("Error fetching recent tournaments:", err);
      return [];
    }
  },

  async getAllTournaments(): Promise<Tournament[]> {
    try {
      const snap = await getDocs(collection(db, "tournaments"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tournament));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return list;
    } catch (err) {
      console.error("Error fetching all tournaments:", err);
      return [];
    }
  }
};
