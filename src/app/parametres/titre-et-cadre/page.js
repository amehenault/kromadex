import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { cadresDebloques } from '@/lib/cadres';
import { PageParametres, TitreEtCadre } from '../parametres';

export const dynamic = 'force-dynamic';

// Paramètres > Titre et cadre affichés
export default async function TitreEtCadrePage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [u] = await sql`SELECT role, pionnier, cadre, genre, title, unlocked_titles FROM users WHERE id = ${user.id}`;
  return (
    <PageParametres titre="Titre et cadre affichés">
      <TitreEtCadre cadres={cadresDebloques(u)} cadre={u.cadre} genre={u.genre} titre={u.title || ''}
        titres={(u.unlocked_titles || []).filter((t) => t !== 'Coloriste débutant')} />
    </PageParametres>
  );
}
