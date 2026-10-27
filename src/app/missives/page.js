import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/auth';
import MissivesEpinglees from '@/app/communaute/missivesEpinglees';

export const dynamic = 'force-dynamic';

export default async function MissivesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Missives</h2>
      </div>
      <MissivesEpinglees monId={String(user.id)} vide="Aucune missive pour le moment." />
    </div>
  );
}
