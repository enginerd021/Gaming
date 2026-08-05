import { Metadata } from 'next';
import HomeView from '@/views/HomeView';

export const metadata: Metadata = {
  title: "SHAKTRIX — Esports Tournament & Bracket Platform",
  description: "SHAKTRIX brings the esports community together. Find teammates, organize brackets, host tournaments, and track player stats.",
};

export default function Page() {
  return <HomeView />;
}
