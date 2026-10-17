import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Annonces from '@/components/Annonces';
import AccueilOnglets from '@/components/AccueilOnglets';
import MissivesEpinglees from '@/app/communaute/missivesEpinglees';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Accueil : annonces, missives épinglées (jusqu'à leur échéance), puis deux onglets, Défis et Communauté
export default async function Accueil() {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <>
      <Annonces />
      <MissivesEpinglees monId={String(user.id)} seulementEpinglees />
      <AccueilOnglets monId={String(user.id)} />
    </>
  );
}
