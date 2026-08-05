import { Metadata } from 'next';
import HomeView from '@/views/HomeView';

export const metadata: Metadata = {
  title: "Shakti Gaming — Esports Tournament & Bracket Platform",
  description: "Shakti Gaming brings the esports community together. Find teammates, organize brackets, host tournaments, and track player stats.",
};

export default function Page() {
  return <HomeView />;
}
