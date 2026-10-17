import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Aventure from './aventure';

export const dynamic = 'force-dynamic';

export default async function AventurePage({ params }) {
  if (!(await getUser())) redirect('/login');
  const { id } = await params;
  return <Aventure id={id} />;
}
