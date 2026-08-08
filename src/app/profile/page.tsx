import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: "Player Profile Settings — SHAKTRIX",
  description: "Update your gamertag display name, registered games, and playstyle roles.",
  robots: {
    index: false,
    follow: false
  }
};

export default function Page() {
  return <ProfileClient />;
}
