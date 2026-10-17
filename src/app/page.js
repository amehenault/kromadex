import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Annonces from '@/components/Annonces';
import AccueilOnglets from '@/components/AccueilOnglets';
import MissivesEpinglees from '@/app/communaute/missivesEpinglees';
import Tutoriel from '@/components/Tutoriel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Accueil : présentation (première visite ou ?tutoriel=1), annonces, missives épinglées (jusqu'à leur échéance),
// puis deux onglets, Défis et Communauté
export default async function Accueil({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');
  const q = await searchParams;
  const [u] = await sql`SELECT tutoriel_vu FROM users WHERE id = ${user.id}`;

  return (
    <>
      <Tutoriel ouvertAuDepart={!u?.tutoriel_vu || q?.tutoriel === '1'} />
      <Annonces />
      <MissivesEpinglees monId={String(user.id)} seulementEpinglees />
      <AccueilOnglets monId={String(user.id)} />
    </>
  );
}
