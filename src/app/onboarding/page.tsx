import OnboardingClient from './OnboardingClient';

export const metadata = {
  title: 'Welcome to SHAKTRIX | Player Onboarding',
  description: 'Set up your Gamertag, select game preferences, and discover your first esports tournament.'
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
