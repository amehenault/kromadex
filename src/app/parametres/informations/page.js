import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { PageParametres, MesInformations } from '../parametres';

export const dynamic = 'force-dynamic';

// Paramètres > Mes informations : photo, pseudo et présentation, préférences de coloriage, courriel et mot de passe
export default async function MesInformationsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const [u] = await sql`SELECT role FROM users WHERE id = ${user.id}`;
  return (
    <PageParametres titre="Mes informations">
      <MesInformations role={u.role} />
    </PageParametres>
  );
}
