# SHAKTRIX — Next-Gen Esports & Tournament Management Platform 🎮⚡

**SHAKTRIX** is a high-performance, real-time esports and tournament management platform built for competitive gaming communities, tournament organizers, and gaming rosters. Engineered with Next.js 16, React 19, Cloud Firestore, and a sleek neon cyber aesthetic, SHAKTRIX delivers automated single-elimination brackets, real-time match check-ins, forfeit timers, dispute resolution workflows, Razorpay payment gateway integration, team roster controls, real-time global chat, comprehensive admin management, and deep player telemetry.

---

## 🌟 Key Features

### 🛡️ 1. Dedicated Admin Control Panel & Governance (`/admin`)
* **Direct Admin Portal**: Secured redirect and interface for authorized platform administrators (`/admin`).
* **Platform Analytics**: Real-time overview of total registered players, active tournaments, and team rosters.
* **Player Management**: Live search players by Gamer Tag or Email, with instant Ban / Unban status toggles.
* **Tournament Control Center**: Create, edit, and force-update tournament states (`Upcoming`, `Active`, `Completed`).
* **Automated Cancellation**: Auto-ends and cancels tournaments if zero teams register before the start time.
* **Dispute Resolution**: Override match results, reset match countdown timers, and resolve player disputes.

### 🏆 2. Tournament Arenas & Single-Elimination Brackets
* **Automated Bracket Generation**: Skill-based seeding automatically arranges teams into visual single-elimination brackets.
* **Auto-Calculated Timetables**: Enforces 45-minute round allocations with automated match start and end timestamps.
* **Match Lobby Credentials**: Securely provides server room IDs and passcodes to checked-in participants.
* **Schedule Conflict Detection**: Prevents players from registering for overlapping concurrent tournament rosters.

### ⏱️ 3. Match Check-In, Forfeit & Dispute Engine
* **10-Minute Check-In Timer**: Automatic countdown requiring team captains to confirm readiness prior to match start.
* **Forfeit Victory Claims**: One-click forfeit win processing if opposing rosters fail to check in within the deadline.
* **Dispute Flagging**: Players can flag match discrepancies with custom proof and notes for host/admin intervention.

### 💳 4. Razorpay Payments & Entry Fee Integration
* **Sandbox & Live Payments**: Fully integrated Razorpay payment gateway (`/api/razorpay`) supporting tournament entry fees.
* **Automated Verification & Refunds**: Validates payment signatures server-side with support for automated registration rollbacks upon cancellation.

### 👥 5. Team Roster Management
* **Captain Controls**: Dedicated tools for team creation, captain delegation, player recruitment, roster removal, and leave actions.
* **Invite System**: Shareable team join links and unique invite codes.
* **Overlap Protection**: Pre-registration validation ensuring roster members are available during scheduled match slots.

### 💬 6. Real-Time Global Chat & Direct Messaging (`/chat`)
* **Global Esports Shoutbox**: Floating and full-page chat drawer for live community discussion.
* **Private Team Channels**: Dedicated communication channels for team rosters and match lobbies.
* **Moderation Controls**: Admin/host message deletion and safety filtering capabilities.

### 🏅 7. Leaderboards & Player Telemetry (`/leaderboard`, `/profile`)
* **Global Rankings**: Sortable player standings by Win Rate, XP, Tournament Titles, and KDA ratios.
* **Player Comparison Tool**: Side-by-side player stat comparator (`PlayerCompareModal`).
* **Public Gamer Profiles**: Showcase achievement badges (*First Blood*, *Undefeated Season*, *Comeback King*), tournament history, and Riot ID stats.
* **Enhanced Session Security**: Extended session token rotation with 2-hour sliding window expiration handling.

### ⚖️ 8. Legal, Compliance & Governance Hub (`/legal`)
* **Comprehensive Legal Suite**: Pre-built compliance pages covering Terms of Service, Privacy Policy, Cookie Policy, Refund Policy, Shipping Policy, Disclaimer, Accessibility Statement, DPA, Security Policy, and Customer Lifecycle.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Database & Auth** | [Cloud Firestore](https://firebase.google.com/docs/firestore) & [Firebase Auth](https://firebase.google.com/docs/auth) |
| **Backend & Admin SDK** | [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) |
| **Payment Gateway** | [Razorpay SDK](https://razorpay.com/docs/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Animations & 3D** | [GSAP](https://gsap.com/), [Framer Motion](https://www.framer.com/motion/), [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/) |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Styling** | Vanilla CSS Design System with Theme Tokens, CSS Variables & Glassmorphism |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** and `npm` installed.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/enginerd021/Gaming.git
cd Shakti-Gaming-Esports
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Service Account (JSON string or path)
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json

# Razorpay Payment Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Development Server
Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build & Type Checking
To verify production compilation and TypeScript safety:

```bash
npm run build
```

---

## 📁 Project Architecture

```
src/
├── app/                        # Next.js App Router (Pages & API routes)
│   ├── admin/                  # Admin management dashboard & governance
│   ├── tournaments/            # Tournament hub, bracket views & creation
│   ├── teams/                  # Team roster management & profile pages
│   ├── leaderboard/            # Global rankings, player comparator
│   ├── profile/                # User profile, history & deletion controls
│   ├── chat/                   # Global shoutbox & direct messaging
│   ├── legal/                  # Legal & compliance hub with policy pages
│   └── api/                    # Serverless endpoints (Razorpay, Admin, Chat, Discord)
├── components/                 # Reusable UI components
│   ├── ui/                     # Primitives (BracketView, BentoGrid, GlassCard, Podium)
│   ├── chat/                   # Chat widgets & moderation drawer
│   └── Navbar.tsx / Footer.tsx # Core navigation and global layout elements
├── services/                   # Firebase domain services
│   ├── tournamentService.ts    # Bracket lifecycle & match state manager
│   ├── teamService.ts          # Team roster & invitation handling
│   ├── leaderboardService.ts   # Player rankings & stat calculations
│   └── achievementService.ts   # Badge unlock engine
├── store/                      # Zustand global state (auth, theme, chat)
├── lib/                        # Helpers, Riot scoring, XP calculator, Firebase setup
├── providers/                  # Context providers (SmoothScrollProvider)
└── views/                      # Feature view page wrappers
```

---

## 📄 License

This project is proprietary and maintained by the SHAKTRIX Esports team.
