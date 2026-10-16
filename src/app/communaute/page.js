import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Communaute from './communaute';

export const dynamic = 'force-dynamic';

export default async function CommunautePage() {
  const user = await getUser();
  if (!user) redirect('/login');
  return <Communaute monId={String(user.id)} />;
}
