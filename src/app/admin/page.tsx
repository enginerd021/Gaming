import AdminClient from './AdminClient';

export const metadata = {
  title: 'Admin Panel — Shaktrix',
  description: 'Shaktrix platform administration dashboard.',
  robots: 'noindex, nofollow',
};

export default function AdminPage() {
  return <AdminClient />;
}
