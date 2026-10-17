import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Annonces from '@/components/Annonces';
import AccueilOnglets from '@/components/AccueilOnglets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Accueil : annonces, puis deux onglets, Défis et Communauté
export default async function Accueil() {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <>
      <Annonces />
      <AccueilOnglets monId={String(user.id)} />
    </>
  );
}
