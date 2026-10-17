import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Combats from './combats';

export const dynamic = 'force-dynamic';

export default async function CombatsPage({ searchParams }) {
  if (!(await getUser())) redirect('/login');
  const q = await searchParams;
  return <Combats inviter={typeof q?.inviter === 'string' ? q.inviter : null} />;
}
