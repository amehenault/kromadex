import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import AideClient from './aideClient';

export const dynamic = 'force-dynamic';

export default async function AidePage() {
  if (!(await getUser())) redirect('/login');
  return <AideClient />;
}
