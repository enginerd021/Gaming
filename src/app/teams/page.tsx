import { Metadata } from 'next';
import TeamsView from '@/views/TeamsView';

export const metadata: Metadata = {
  title: "Team Management — Shakti Gaming Esports",
  description: "Create and manage your competitive esports team roster, send player invitations, and view team rank stats.",
};

export default function Page() {
  return <TeamsView />;
}
