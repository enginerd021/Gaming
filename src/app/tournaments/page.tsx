import { Metadata } from 'next';
import TournamentsView from '@/views/TournamentsView';

export const metadata: Metadata = {
  title: "Tournaments — SHAKTRIX",
  description: "Browse live and upcoming esports bracket tournaments. Register your team roster and compete for prize pools.",
};

export default function Page() {
  return <TournamentsView />;
}
