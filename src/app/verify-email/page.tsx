import { Metadata } from 'next';
import VerifyEmailClient from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify Your Email — SHAKTRIX',
  description: 'Please verify your email address to access your SHAKTRIX account.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerifyEmailClient />;
}
