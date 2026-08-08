import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: "Create Player Account — SHAKTRIX",
  description: "Sign up for a new SHAKTRIX esports player profile.",
  robots: {
    index: false,
    follow: true
  }
};

export default function Page() {
  return <RegisterClient />;
}
