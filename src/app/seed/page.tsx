'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function SeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSeeder = async () => {
    setSeeding(true);
    setLogs([]);
    addLog("Starting database seeding process...");

    const mockUsers = [
      { email: "alpha@shaktrix.com", password: "Password123!", gamertag: "alpha", displayName: "AlphaCaptain", skillLevel: "Advanced", registeredGames: ["Valorant", "League of Legends"], preferredRoles: ["IGL (In-Game Leader)", "Duelist"], points: 2800, wins: 12, losses: 4 },
      { email: "beta@shaktrix.com", password: "Password123!", gamertag: "beta", displayName: "BetaSlayer", skillLevel: "Intermediate", registeredGames: ["Valorant", "CS:GO"], preferredRoles: ["Entry Fragger"], points: 1900, wins: 8, losses: 6 },
      { email: "gamma@shaktrix.com", password: "Password123!", gamertag: "gamma", displayName: "GammaSage", skillLevel: "Intermediate", registeredGames: ["League of Legends", "Valorant"], preferredRoles: ["Support", "Sentinel"], points: 2200, wins: 15, losses: 9 },
      { email: "delta@shaktrix.com", password: "Password123!", gamertag: "delta", displayName: "DeltaSniper", skillLevel: "Advanced", registeredGames: ["CS:GO", "Apex Legends"], preferredRoles: ["Sniper"], points: 3500, wins: 20, losses: 10 },
      { email: "epsilon@shaktrix.com", password: "Password123!", gamertag: "epsilon", displayName: "EpsilonCarry", skillLevel: "Advanced", registeredGames: ["League of Legends", "Valorant"], preferredRoles: ["Mid Laner", "Duelist"], points: 4100, wins: 25, losses: 8 },
      { email: "zeta@shaktrix.com", password: "Password123!", gamertag: "zeta", displayName: "ZetaFlex", skillLevel: "Beginner", registeredGames: ["Rocket League", "Overwatch 2"], preferredRoles: ["Flex"], points: 1100, wins: 3, losses: 8 }
    ];

    const uids: Record<string, string> = {};

    try {
      // Step 1. Register / Sign in users and create profiles + gamertags
      for (const u of mockUsers) {
        addLog(`Registering/Signing in ${u.email}...`);
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
          addLog(`Created new account for ${u.email}`);
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            userCredential = await signInWithEmailAndPassword(auth, u.email, u.password);
            addLog(`Signed into existing account for ${u.email}`);
          } else {
            throw err;
          }
        }

        const uid = userCredential.user.uid;
        uids[u.gamertag] = uid;

        addLog(`Claiming gamertag "${u.gamertag}"...`);
        await setDoc(doc(db, "gamertags", u.gamertag), { uid });

        addLog(`Creating profile for "${u.displayName}"...`);
        await setDoc(doc(db, "profiles", uid), {
          uid,
          gamertag: u.gamertag,
          displayName: u.displayName,
          riotId: `${u.displayName}#NA1`,
          skillLevel: u.skillLevel,
          registeredGames: u.registeredGames,
          preferredRoles: u.preferredRoles,
          stats: { wins: u.wins, losses: u.losses, points: u.points, mvps: Math.floor(u.wins / 3), kda: "2.5", totalTournaments: u.wins + u.losses },
          achievements: u.points > 3000 ? ["team_player", "first_blood", "comeback_king", "undefeated"] : ["team_player"],
          createdAt: Date.now()
        });

        await signOut(auth);
      }

      // Step 2. Sign in as Gamma to create Team Gamma
      addLog("Signing into gamma@shaktrix.com to create Team Gamma...");
      await signInWithEmailAndPassword(auth, "gamma@shaktrix.com", "Password123!");
      await setDoc(doc(db, "teams", "team-gamma"), {
        id: "team-gamma",
        name: "Gamma Gladiators",
        captainId: uids["gamma"],
        members: [uids["gamma"], uids["delta"]],
        pendingInvites: [],
        createdAt: Date.now()
      });
      await signOut(auth);

      // Step 3. Sign in as Epsilon to create Team Epsilon
      addLog("Signing into epsilon@shaktrix.com to create Team Epsilon...");
      await signInWithEmailAndPassword(auth, "epsilon@shaktrix.com", "Password123!");
      await setDoc(doc(db, "teams", "team-epsilon"), {
        id: "team-epsilon",
        name: "Epsilon Legion",
        captainId: uids["epsilon"],
        members: [uids["epsilon"], uids["zeta"]],
        pendingInvites: [],
        createdAt: Date.now()
      });
      await signOut(auth);

      // Step 4. Sign in as Alpha to create Team Alpha and all Tournaments with pre-registered teams
      addLog("Signing into alpha@shaktrix.com to create Team Alpha and tournaments...");
      await signInWithEmailAndPassword(auth, "alpha@shaktrix.com", "Password123!");
      
      await setDoc(doc(db, "teams", "team-alpha"), {
        id: "team-alpha",
        name: "Alpha Esports",
        captainId: uids["alpha"],
        members: [uids["alpha"], uids["beta"]],
        pendingInvites: [],
        createdAt: Date.now()
      });

      addLog("Creating upcoming tournament...");
      await setDoc(doc(db, "tournaments", "tourney-val-clash"), {
        id: "tourney-val-clash",
        name: "Valorant Shaktrix Clash",
        game: "Valorant",
        status: "Upcoming",
        entryType: "Free",
        maxTeams: 4,
        registeredTeamIds: ["team-alpha", "team-gamma"],
        organizerId: uids["alpha"],
        createdAt: Date.now()
      });

      addLog("Creating active tournament...");
      await setDoc(doc(db, "tournaments", "tourney-lol-masters"), {
        id: "tourney-lol-masters",
        name: "League of Legends Masters",
        game: "League of Legends",
        status: "Active",
        entryType: "Paid",
        maxTeams: 4,
        registeredTeamIds: ["team-alpha", "team-gamma", "team-epsilon"],
        organizerId: uids["alpha"],
        createdAt: Date.now() - 3600000
      });

      addLog("Creating completed tournament...");
      await setDoc(doc(db, "tournaments", "tourney-cs-elite"), {
        id: "tourney-cs-elite",
        name: "CS:GO Elite Series",
        game: "CS:GO",
        status: "Completed",
        entryType: "Free",
        maxTeams: 4,
        registeredTeamIds: ["team-alpha", "team-gamma"],
        organizerId: uids["alpha"],
        createdAt: Date.now() - 7200000
      });

      await signOut(auth);
      
      addLog("All tasks completed successfully!");
      setDone(true);
    } catch (err: any) {
      console.error(err);
      addLog(`ERROR: ${err.message || err.toString()}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main style={{ padding: '7.5rem 1.5rem 4rem 1.5rem', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
      <div className="hero-glow hero-glow-1" />
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>SHAKTRIX DB Seeder</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This page will seed the Firestore database with 6 mock profiles, 3 teams, and 3 tournaments while complying with all Firestore security rules.
        </p>

        <button 
          onClick={runSeeder}
          className="btn btn-primary"
          style={{ width: '100%', height: '3.5rem', fontSize: '1.1rem', marginBottom: '2rem' }}
          disabled={seeding}
        >
          {seeding ? "Seeding Database..." : "Run DB Seeder"}
        </button>

        <div style={{ background: '#070b13', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', height: '250px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '0.4rem', color: log.includes('ERROR') ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
              {log}
            </div>
          ))}
          {logs.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Logs will appear here when seeder starts...</span>}
        </div>

        {done && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-green)', fontWeight: 700, marginBottom: '1rem' }}>🎉 Seeding Complete!</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/tournaments" className="btn btn-primary" style={{ flex: 1 }}>View Tournaments</Link>
              <Link href="/leaderboard" className="btn btn-outline" style={{ flex: 1 }}>View Leaderboards</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
