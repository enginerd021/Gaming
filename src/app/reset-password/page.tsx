import { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Set New Password — SHAKTRIX',
  description: 'Choose a new password for your SHAKTRIX account.',
  robots: { index: false, follow: false },
};

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex', minHeight: 'calc(100vh - 4.5rem)',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem'
    }}>
      <div style={{ width: 40, height: 40, border: '3px solid hsla(186,100%,50%,0.2)', borderTop: '3px solid var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Validating reset link…</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
