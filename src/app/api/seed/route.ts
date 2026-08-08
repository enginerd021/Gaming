import { NextResponse } from 'next/server';
import { collection, doc, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  const batch = writeBatch(db);

  // 1. Create mock profiles and matching gamertags
  const mockProfiles = [
    {
      uid: "uid-alpha",
      gamertag: "alpha",
      displayName: "AlphaCaptain",
      riotId: "Alpha#NA1",
      skillLevel: "Advanced",
      registeredGames: ["Valorant", "League of Legends"],
      preferredRoles: ["IGL (In-Game Leader)", "Duelist"],
      stats: { wins: 12, losses: 4, points: 2800, mvps: 5, kda: "3.5", totalTournaments: 4 },
      achievements: ["sheriff", "team_player", "first_blood"],
      createdAt: Date.now()
    },
    {
      uid: "uid-beta",
      gamertag: "beta",
      displayName: "BetaSlayer",
      riotId: "Beta#NA1",
      skillLevel: "Intermediate",
      registeredGames: ["Valorant", "CS:GO"],
      preferredRoles: ["Entry Fragger"],
      stats: { wins: 8, losses: 6, points: 1900, mvps: 2, kda: "2.1", totalTournaments: 3 },
      achievements: ["team_player"],
      createdAt: Date.now()
    },
    {
      uid: "uid-gamma",
      gamertag: "gamma",
      displayName: "GammaSage",
      riotId: "Gamma#NA1",
      skillLevel: "Intermediate",
      registeredGames: ["League of Legends", "Valorant"],
      preferredRoles: ["Support", "Sentinel"],
      stats: { wins: 15, losses: 9, points: 2200, mvps: 3, kda: "4.2", totalTournaments: 5 },
      achievements: ["team_player", "first_blood"],
      createdAt: Date.now()
    },
    {
      uid: "uid-delta",
      gamertag: "delta",
      displayName: "DeltaSniper",
      riotId: "Delta#NA1",
      skillLevel: "Advanced",
      registeredGames: ["CS:GO", "Apex Legends"],
      preferredRoles: ["Sniper"],
      stats: { wins: 20, losses: 10, points: 3500, mvps: 8, kda: "2.8", totalTournaments: 6 },
      achievements: ["team_player", "first_blood", "comeback_king"],
      createdAt: Date.now()
    },
    {
      uid: "uid-epsilon",
      gamertag: "epsilon",
      displayName: "EpsilonCarry",
      riotId: "Epsilon#NA1",
      skillLevel: "Advanced",
      registeredGames: ["League of Legends", "Valorant"],
      preferredRoles: ["Mid Laner", "Duelist"],
      stats: { wins: 25, losses: 8, points: 4100, mvps: 12, kda: "3.9", totalTournaments: 8 },
      achievements: ["team_player", "first_blood", "comeback_king", "undefeated"],
      createdAt: Date.now()
    },
    {
      uid: "uid-zeta",
      gamertag: "zeta",
      displayName: "ZetaFlex",
      riotId: "Zeta#NA1",
      skillLevel: "Beginner",
      registeredGames: ["Rocket League", "Overwatch 2"],
      preferredRoles: ["Flex"],
      stats: { wins: 3, losses: 8, points: 1100, mvps: 0, kda: "1.0", totalTournaments: 2 },
      achievements: ["team_player"],
      createdAt: Date.now()
    }
  ];

  for (const prof of mockProfiles) {
    const profRef = doc(db, "profiles", prof.uid);
    batch.set(profRef, prof);

    const tagRef = doc(db, "gamertags", prof.gamertag);
    batch.set(tagRef, { uid: prof.uid });
  }

  // 2. Create mock teams
  const mockTeams = [
    {
      id: "team-alpha",
      name: "Alpha Esports",
      captainId: "uid-alpha",
      members: ["uid-alpha", "uid-beta"],
      pendingInvites: [],
      createdAt: Date.now()
    },
    {
      id: "team-gamma",
      name: "Gamma Gladiators",
      captainId: "uid-gamma",
      members: ["uid-gamma", "uid-delta"],
      pendingInvites: [],
      createdAt: Date.now()
    },
    {
      id: "team-epsilon",
      name: "Epsilon Legion",
      captainId: "uid-epsilon",
      members: ["uid-epsilon", "uid-zeta"],
      pendingInvites: [],
      createdAt: Date.now()
    }
  ];

  for (const team of mockTeams) {
    const teamRef = doc(db, "teams", team.id);
    batch.set(teamRef, team);
  }

  // 3. Create mock tournaments
  const mockTournaments = [
    {
      id: "tourney-val-clash",
      name: "Valorant Shaktrix Clash",
      game: "Valorant",
      status: "Upcoming",
      entryType: "Free",
      maxTeams: 4,
      registeredTeamIds: ["team-alpha", "team-gamma"],
      organizerId: "uid-alpha",
      createdAt: Date.now()
    },
    {
      id: "tourney-lol-masters",
      name: "League of Legends Masters",
      game: "League of Legends",
      status: "Active",
      entryType: "Paid",
      maxTeams: 4,
      registeredTeamIds: ["team-alpha", "team-gamma", "team-epsilon"],
      organizerId: "uid-alpha",
      createdAt: Date.now() - 3600000
    },
    {
      id: "tourney-cs-elite",
      name: "CS:GO Elite Series",
      game: "CS:GO",
      status: "Completed",
      entryType: "Free",
      maxTeams: 4,
      registeredTeamIds: ["team-alpha", "team-gamma"],
      organizerId: "uid-alpha",
      createdAt: Date.now() - 7200000
    }
  ];

  for (const t of mockTournaments) {
    const tRef = doc(db, "tournaments", t.id);
    batch.set(tRef, t);
  }

  try {
    await batch.commit();
    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (err: any) {
    console.error("Seeding failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
