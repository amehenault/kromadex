import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Nouveautes from './nouveautes';

export const dynamic = 'force-dynamic';

export default async function NouveautesPage() {
  if (!(await getUser())) redirect('/login');
  return <Nouveautes />;
}
