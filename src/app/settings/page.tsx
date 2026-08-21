import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Account Settings | SHAKTRIX Esports',
  description: 'Manage your profile, connected Game IDs, notification preferences, and account security.'
};

export default function SettingsPage() {
  return <SettingsClient />;
}
