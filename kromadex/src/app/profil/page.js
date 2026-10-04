import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import ListeTomes from './listeTomes';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  // Récupération directe des tomes uniques depuis la base de données
  const resultats = await sql`
    select distinct tome 
    from pages 
    where user_id = ${user.id} and tome is not null and tome != ''
    order by tome asc
  `;

  const tomes = resultats.map((r) => r.tome);

  return (
    <div className="contenu">
      <div className="barre" style={{ marginBottom: 'var(--espace-4)' }}>
        <Link href="/" className="btn alt">
          Retour
        </Link>
        <h2 style={{ margin: 0 }}>Profil et Gestion des tomes</h2>
      </div>

      <div className="carte">
        <h3 style={{ marginTop: 0 }}>Liste de mes tomes</h3>
        <ListeTomes tomesInitiaux={tomes} />
      </div>
    </div>
  );
}