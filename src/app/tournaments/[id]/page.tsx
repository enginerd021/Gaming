import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TournamentDetailClient from './TournamentDetailClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return {
      title: 'Tournament Match Brackets — SHAKTRIX',
      description: 'Browse details, view brackets, and register for community tournaments.',
    };
  }

  try {
    const docRef = doc(db, 'tournaments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const title = `${data.name} — ${data.game} Tournament | SHAKTRIX`;
      const description = `Compete in ${data.name}, a bracket-style ${data.game} tournament on SHAKTRIX. Status: ${data.status}. Register your team roster now!`;
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          url: `https://shakti-gaming-esports.vercel.app/tournaments/${id}`,
        },
      };
    }
  } catch (e) {
    console.error("Error generating tournament metadata:", e);
  }
  return {
    title: 'Tournament Match Brackets — SHAKTRIX',
    description: 'Browse details, view brackets, and register for community tournaments.',
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    notFound();
  }

  let exists = true;
  // Server-side check for existence to trigger 404
  try {
    const docRef = doc(db, 'tournaments', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      exists = false;
    }
  } catch (err) {
    console.error("Error checking tournament document on server:", err);
  }

  if (!exists) {
    notFound();
  }

  return <TournamentDetailClient id={id} />;
}
