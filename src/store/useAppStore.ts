import { create } from "zustand";
import { User } from "firebase/auth";
import { 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  Unsubscribe
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { isAdmin } from "@/lib/adminConfig";

export interface Profile {
  uid: string;
  gamertag: string;
  displayName: string;
  registeredGames: string[];
  preferredRoles: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  riotId?: string;
  /**
   * Display-only role field. Set at registration based on admin email list.
   * ⚠️ NOT used for security enforcement — the real gate is isAdminEmail()
   * in firestore.rules, which reads request.auth.token.email from the verified
   * Firebase Auth ID token.
   */
  role?: 'admin' | 'player';
  stats: {
    wins: number;
    losses: number;
    points: number;
    mvps?: number;
    kda?: string;
    totalTournaments?: number;
  };
  achievements?: string[];
  createdAt: number;
  chatStrikes?: number;
  mutedUntil?: number;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  members: string[];
  pendingInvites: string[];
  createdAt: number;
}

interface AppState {
  user: User | null;
  profile: Profile | null;
  teams: Team[];
  activeTeamId: string | null;
  team: Team | null;
  teamLoading: boolean;
  loading: boolean;
  initialized: boolean;
  isOffline: boolean;
  connectionStatus: 'online' | 'reconnecting' | 'offline';
  sessionExpired: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setTeams: (teams: Team[]) => void;
  setActiveTeamId: (activeTeamId: string | null) => void;
  setTeam: (team: Team | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setIsOffline: (isOffline: boolean) => void;
  setConnectionStatus: (status: 'online' | 'reconnecting' | 'offline') => void;
  setSessionExpired: (sessionExpired: boolean) => void;
  logout: () => Promise<void>;
}

// Active listeners references so we can unsubscribe on logout
let profileListener: Unsubscribe | null = null;
let teamListener: Unsubscribe | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  teams: [],
  activeTeamId: null,
  team: null,
  teamLoading: false,
  loading: true,
  initialized: false,
  isOffline: false,
  connectionStatus: 'online',
  sessionExpired: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setTeams: (teams) => {
    const currentActiveId = get().activeTeamId;
    const activeTeam = teams.find(t => t.id === currentActiveId) || teams[0] || null;
    set({ teams, team: activeTeam, activeTeamId: activeTeam ? activeTeam.id : null });
  },
  setActiveTeamId: (activeTeamId) => {
    const teams = get().teams;
    const activeTeam = teams.find(t => t.id === activeTeamId) || null;
    set({ activeTeamId, team: activeTeam });
  },
  setTeam: (team) => set({ team }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setIsOffline: (isOffline) => set({ isOffline }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  
  logout: async () => {
    stopUserListeners();
    await auth.signOut();
    set({ user: null, profile: null, teams: [], activeTeamId: null, team: null, loading: false, sessionExpired: false });
  }
}));

// Helper to start real-time listeners for the authenticated user
export const startUserListeners = (uid: string) => {
  // Unsubscribe from existing listeners first
  if (profileListener) profileListener();
  if (teamListener) teamListener();

  const store = useAppStore.getState();
  store.setLoading(true);

  // 1. Real-time Profile Listener
  profileListener = onSnapshot(doc(db, "profiles", uid), (docSnap) => {
    if (docSnap.exists()) {
      const profileData = { uid, ...docSnap.data() } as Profile;
      useAppStore.setState({ profile: profileData, loading: false });

      // Role self-heal: if the stored role disagrees with the current admin list
      // (e.g. account registered before being added as admin, or admin removed),
      // silently patch the Firestore doc so it stays accurate for display purposes.
      // This does NOT affect security — enforcement is in firestore.rules.
      const currentUser = auth.currentUser;
      if (currentUser) {
        const correctRole: 'admin' | 'player' = isAdmin(currentUser.email) ? 'admin' : 'player';
        if (profileData.role !== correctRole) {
          // Fire-and-forget: don't await, don't block the UI on this write.
          updateDoc(doc(db, "profiles", uid), { role: correctRole }).catch(() => {
            // Non-critical — silently ignore if the write fails.
          });
        }
      }

      // 2. Real-time Team Listener (querying all teams where user is a member)
      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("members", "array-contains", uid));
      
      // Cleanup previous team listener if it exists to prevent memory leaks!
      if (teamListener) {
        teamListener();
      }

      useAppStore.setState({ teamLoading: true });
      teamListener = onSnapshot(q, (querySnap) => {
        const userTeams = querySnap.docs.map((tDoc) => ({ id: tDoc.id, ...tDoc.data() }) as Team);
        const currentActiveId = useAppStore.getState().activeTeamId;
        const activeTeam = userTeams.find(t => t.id === currentActiveId) || userTeams[0] || null;

        useAppStore.setState({ 
          teams: userTeams,
          activeTeamId: activeTeam ? activeTeam.id : null,
          team: activeTeam,
          teamLoading: false 
        });
      }, (error) => {
        console.error("Team listener error:", error);
        useAppStore.setState({ teamLoading: false });
      });

    } else {
      // Profile doc doesn't exist yet (needs setup)
      useAppStore.setState({ profile: null, teams: [], activeTeamId: null, team: null, loading: false });
    }
  }, (error) => {
    console.error("Profile listener error:", error);
    useAppStore.setState({ loading: false });
  });
};

export const stopUserListeners = () => {
  if (profileListener) {
    profileListener();
    profileListener = null;
  }
  if (teamListener) {
    teamListener();
    teamListener = null;
  }
};
