import { Metadata } from 'next';
import LeaderboardView from '@/views/LeaderboardView';

export const metadata: Metadata = {
  title: "Leaderboard & Hall of Fame — Shakti Gaming Esports",
  description: "Live real-time leaderboards for esports players and team rosters based on XP points, victories, and match performance.",
};

export default function Page() {
  return <LeaderboardView />;
}
