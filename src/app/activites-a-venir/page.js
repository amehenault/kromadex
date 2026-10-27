import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import ActivitesAVenir from './activites';

export const dynamic = 'force-dynamic';

export default async function ActivitesAVenirPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profil = await getUserProfile(user.id);
  if (profil?.role !== 'admin') redirect('/profil');
  return <ActivitesAVenir clePublique={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''} />;
}
