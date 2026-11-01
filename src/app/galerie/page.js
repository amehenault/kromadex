import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Galerie from './galerie';

export const dynamic = 'force-dynamic';

export default async function GaleriePage({ searchParams }) {
  if (!(await getUser())) redirect('/login');
  const q = await searchParams;
  const nom = String(q?.tome || '').trim().slice(0, 120);
  if (!nom) redirect('/');
  const [cat] = await sql`SELECT nom, couverture, type, nb_pages FROM tome_catalog WHERE lower(nom) = lower(${nom}) LIMIT 1`;
  return <Galerie tome={cat?.nom || nom} couverture={cat?.couverture || null} type={cat?.type || null} total={cat?.nb_pages || null} pageInitiale={String(q?.page || '')} />;
}
