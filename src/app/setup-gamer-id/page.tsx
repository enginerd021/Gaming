import { Metadata } from 'next';
import SetupGamerIdClient from './SetupGamerIdClient';

export const metadata: Metadata = {
  title: "Choose Your Gamer ID — SHAKTRIX",
  description: "Set your unique player alias and Gamer ID on SHAKTRIX Esports.",
  robots: {
    index: false,
    follow: true
  }
};

export default function SetupGamerIdPage() {
  return <SetupGamerIdClient />;
}
