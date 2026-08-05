# Shakti Gaming — Application Architecture (`architecture.md`)

> Build for scalability, maintainability, and performance from day one.

---

# Tech Stack

Framework

Next.js 16 App Router

Language

TypeScript

Styling

Tailwind CSS

Animations

GSAP

GSAP ScrollTrigger

Smooth Scroll

Lenis

Icons

Lucide React

State

Zustand

Authentication

Firebase Auth

Database

Cloud Firestore

Storage

Firebase Storage

Hosting

Vercel

Analytics

Google Analytics + Firebase Analytics

---

# Folder Structure

src/

app/

components/

features/

hooks/

lib/

providers/

services/

store/

types/

utils/

views/

animations/

assets/

styles/

---

# Components

## UI

Pure reusable components.

Button

Badge

GlassCard

Modal

Input

Avatar

Tabs

Accordion

Toast

Tooltip

Spinner

Skeleton

VideoPlayer

---

# Features

Organize by business domain.

auth/

teams/

tournaments/

leaderboard/

profile/

notifications/

community/

Each feature owns:

components/

hooks/

services/

types/

---

# Views

Each page assembles feature modules.

HomeView

TournamentView

LeaderboardView

TeamView

ProfileView

CommunityView

---

# Providers

ThemeProvider

AuthProvider

AnimationProvider

ToastProvider

AnalyticsProvider

---

# State Management

Global

Authentication

Theme

Notifications

User Preferences

Current Tournament

Local

Forms

Dialogs

Dropdowns

Tabs

---

# Firestore Collections

users/

teams/

tournaments/

matches/

leaderboard/

notifications/

games/

banners/

settings/

media/

---

# User Document

uid

username

email

avatar

country

xp

rank

coins

favoriteGame

createdAt

updatedAt

---

# Team Document

teamName

captain

members

logo

description

rank

wins

losses

createdAt

---

# Tournament Document

title

game

entryFee

prizePool

slots

status

rules

banner

startDate

endDate

createdBy

---

# Match Document

teamA

teamB

winner

score

streamUrl

status

scheduledAt

---

# Services Layer

authService

tournamentService

teamService

leaderboardService

notificationService

mediaService

Never call Firebase directly from UI components.

---

# Animation Layer

animations/

hero.ts

navbar.ts

cards.ts

leaderboard.ts

pageTransition.ts

cursor.ts

scroll.ts

All GSAP logic lives here.

Components only initialize animations.

---

# Hooks

useAuth()

useLeaderboard()

useNotifications()

useScrollProgress()

useMediaQuery()

useTournament()

useTeam()

---

# Asset Strategy

images/

videos/

icons/

logos/

particles/

lottie/

Fonts

Google Fonts

Optimize with next/font.

---

# Performance

Lazy-load below-the-fold sections.

Dynamic import heavy components.

Compress videos.

Serve WebP/AVIF images.

Use route-level code splitting.

---

# Security

Firebase Security Rules

Protected API routes

Server-side validation

Role-based permissions

Admin

Moderator

Captain

Player

Guest

---

# SEO

Metadata API

Dynamic Open Graph images

Structured data

XML sitemap

Robots.txt

Canonical URLs

---

# Accessibility

Keyboard navigation

Visible focus states

44px minimum touch targets

ARIA labels

Reduced motion support

WCAG AA contrast

---

# Testing

Unit Tests

Vitest

Component Tests

React Testing Library

End-to-End

Playwright

Performance

Lighthouse CI

---

# Deployment

Preview

Vercel Preview Deployments

Production

Main branch

Firebase

Production database

---

# Coding Standards

Strict TypeScript

ESLint

Prettier

Husky pre-commit hooks

Conventional Commits

Reusable components before duplication

Business logic outside UI

Animation logic outside components

One responsibility per file

Keep components small and composable.
