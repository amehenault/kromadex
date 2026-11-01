import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { aujourdhuiLocal } from '@/lib/series';
import { retrospective, anneeRetrospective } from '@/lib/retrospective';
import CarteRetrospective from './carte';

export const dynamic = 'force-dynamic';

export default async function RetrospectivePage({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');
  const aujourdhui = await aujourdhuiLocal();
  const anneeCourante = Number(aujourdhui.slice(0, 4));
  const demandee = parseInt((await searchParams)?.annee, 10);
  const annee = demandee >= 2020 && demandee <= anneeCourante ? demandee : anneeRetrospective(aujourdhui) || anneeCourante;
  const [donnees, [moi]] = await Promise.all([
    retrospective(user.id, annee),
    sql`SELECT pseudo, name FROM users WHERE id = ${user.id}`,
  ]);

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/statistiques" className="btn alt" aria-label="Retour aux statistiques" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Ma rétrospective {annee}</h2>
      </div>
      <CarteRetrospective donnees={donnees} nom={moi?.pseudo ? `@${moi.pseudo}` : moi?.name || ''} />
      {annee > 2026 && (
        <Link href={`/retrospective?annee=${annee - 1}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', fontWeight: 700, color: 'inherit', fontSize: '0.9rem' }}>
          Voir ma rétrospective {annee - 1}
        </Link>
      )}
    </div>
  );
}
