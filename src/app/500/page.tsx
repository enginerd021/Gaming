'use client';

import { useRouter } from 'next/navigation';
import ErrorState from '@/components/ui/ErrorState';

export default function Page500() {
  const router = useRouter();

  return (
    <main style={{
      position: 'relative',
      minHeight: 'calc(100vh - 4.5rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      overflow: 'hidden',
      backgroundColor: '#02040a',
    }}>
      {/* Background Decorative Glows */}
      <div className="hero-glow hero-glow-1" style={{ top: '-10%', left: '10%' }} />
      <div className="hero-glow hero-glow-2" style={{ bottom: '10%', right: '10%' }} />

      <ErrorState 
        title="500 - Arena Collapse"
        message="A critical server-side error occurred. The arena server is temporarily unresponsive. Our tech squads have been dispatched."
        onRetry={() => router.refresh()}
      />
    </main>
  );
}
