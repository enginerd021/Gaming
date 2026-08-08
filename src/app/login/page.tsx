import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: "Sign In — SHAKTRIX",
  description: "Log in to your SHAKTRIX player account.",
  robots: {
    index: false,
    follow: true
  }
};

export default function Page() {
  return <LoginClient />;
}
