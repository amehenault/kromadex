import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Defis from './defis';

export const dynamic = 'force-dynamic';

export default async function DefisPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  return <Defis monId={String(user.id)} />;
}
