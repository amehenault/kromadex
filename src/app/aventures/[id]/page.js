import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Aventure from './aventure';

export const dynamic = 'force-dynamic';

export default async function AventurePage({ params, searchParams }) {
  if (!(await getUser())) redirect('/login');
  const { id } = await params;
  const test = (await searchParams)?.test === '1';
  return <Aventure id={id} test={test} />;
}
