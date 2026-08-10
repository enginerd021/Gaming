# SHAKTRIX — Next-Gen Esports & Tournament Management Platform 🎮⚡

**SHAKTRIX** is a high-performance, real-time esports platform built for competitive gaming communities, tournament hosts, and gaming rosters. Designed with a sleek neon cyber aesthetic, SHAKTRIX delivers automated single-elimination tournament brackets, real-time match check-ins, automated forfeit timers, dispute resolution workflows, Discord lobby integration, team management, live chat shoutboxes, and player achievement badges.

---

## 🌟 Key Features

### 🏆 1. Tournament Arenas & Single-Elimination Brackets
* **Automated Bracket Generation**: Skill-based seeding places top-rated teams into structured brackets automatically upon tournament launch.
* **Auto-Calculated Timetables**: Enforces a strict 45-minute minimum allocation per tournament round.
* **Real-time Status Tracking**: Auto-evaluates tournament states (`Upcoming`, `Active`, `Completed`) based on start date, time window, and match completions.
* **Custom Match Lobby Credentials**: Host room IDs & passwords surfaced securely to match participants.

### ⏱️ 2. Match Check-In, Forfeit & Dispute System
* **10-Minute Check-In Timer**: Automatic countdown for team captains to confirm readiness before match start.
* **Forfeit Victory Claims**: One-click forfeit win processing if opposing rosters fail to check in within the deadline.
* **Dispute Flagging & Admin Overrides**: Players can flag match disputes with custom notes; organizers can resolve via timer resets, clearing disputes, or manual win declarations.

### 💬 3. Discord Bot & Lobby Integration
* **Match Lobby Channels**: Automatic creation of match-specific Discord channels for seamless voice/text communication.
* **Live Bracket Announcements**: Discord Webhook broadcasts for tournament announcements, match completions, dispute alerts, and champion crowning.

### 🛡️ 4. Team Roster Management
* **Captain Control**: Dedicated controls for team creation, captain delegation, player recruitment, and tournament registrations.
* **Invite System**: Instant team join links and invite management.
* **Overlap Protection**: Pre-registration validation prevents players from enrolling in concurrent overlapping tournaments.

### 💬 5. Live Tournament Shoutbox
* **Real-Time Participant Chat**: High-performance shoutbox drawer rendered for registered players and tournament hosts.
* **Host Moderation**: Host badges (`HOST`) and moderation delete controls for safe community interactions.

### 🏅 6. Leaderboard & Achievement Engine
* **Global Leaderboards**: Tracks player win rates, tournament points, MVP badges, and KDA ratios.
* **Dynamic Badges**: Automatic unlock system for achievements like *First Blood*, *Undefeated Season*, and *Comeback King*.
* **Riot ID Stats Integration**: Live score query integration via Riot ID (`Name#Tag`).

### 🎨 7. Dual-Theme Design System
* **Neon Dark & Minimal Light Modes**: Full dynamic color palette switching built on CSS variables, glassmorphism overlays, glowing cyan/violet accents, and micro-interactions.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
* **Library**: [React 19](https://react.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & Auth**: [Cloud Firestore](https://firebase.google.com/docs/firestore) & [Firebase Authentication](https://firebase.google.com/docs/auth)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
* **Animations**: [GSAP (GreenSock)](https://gsap.com/) & [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Styling**: Vanilla CSS Design System with theme tokens & Glassmorphism UI

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js 18+ installed on your system.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/koonjz/shakti-gaming-esports.git
cd shakti-gaming-esports
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Running the Development Server
Launch the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build & Verification
To test compilation and type correctness:

```bash
npm run build
```

---

## 📁 Project Architecture

```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── tournaments/          # Tournaments hub & detail bracket views
│   ├── teams/                # Team profile pages & management
│   ├── leaderboard/          # Global player rankings & stats
│   ├── profile/              # User profile & achievement showcase
│   └── api/                  # Backend endpoints (Discord, Game Stats)
├── components/               # UI components & Bracket controls
│   ├── ui/                   # Design system primitives (BracketView, Button, GlassCard)
│   └── TournamentCountdown.tsx
├── services/                 # Firebase integration & domain services
│   ├── tournamentService.ts  # Tournament & Bracket state manager
│   ├── teamService.ts        # Team roster management
│   └── achievementService.ts # Badge & XP reward engine
├── store/                    # Zustand global application state
├── lib/                      # Core utilities & calculation helpers
└── views/                    # Main view page layouts
```

---

## 📄 License

This project is proprietary and maintained by the SHAKTRIX Esports team.
