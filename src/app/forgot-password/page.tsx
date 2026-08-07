import { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata: Metadata = {
  title: "Forgot Password — Shakti Gaming",
  description: "Reset your Shakti Gaming account password with OTP verification.",
  robots: {
    index: false,
    follow: true
  }
};

export default function Page() {
  return <ForgotPasswordClient />;
}
