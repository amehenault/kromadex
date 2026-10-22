import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { cadresDebloques } from '@/lib/cadres';
import { calculerNiveau } from '@/lib/niveaux';
import { titreNiveau, titresNiveauAtteints } from '@/lib/titres';
import { PageParametres, TitreEtCadre } from '../parametres';

export const dynamic = 'force-dynamic';

// Paramètres > Titre et cadre affichés : un titre de niveau déjà atteint (du premier à l'actuel) ou un titre spécial
export default async function TitreEtCadrePage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [u] = await sql`SELECT role, pionnier, cadre, genre, title, unlocked_titles, xp FROM users WHERE id = ${user.id}`;
  const niveau = calculerNiveau(u.xp || 0);
  const speciaux = (u.unlocked_titles || []).filter((t) => t !== 'Coloriste débutant');
  return (
    <PageParametres titre="Titre et cadre affichés">
      <TitreEtCadre cadres={cadresDebloques(u)} cadre={u.cadre} genre={u.genre} titre={u.title || ''}
        titreActuel={titreNiveau(niveau, u.genre)}
        titresNiveau={titresNiveauAtteints(niveau, u.genre).filter((t) => !speciaux.includes(t))}
        titres={speciaux} />
    </PageParametres>
  );
}
