import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import EspaceAdmin from './espaceAdmin';

export const dynamic = 'force-dynamic';

// Espace de gestion : admin (tout), modo (membres), cheffe (défi du mois prochain)
export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profil = await getUserProfile(user.id);
  if (!['admin', 'modo', 'cheffe'].includes(profil?.role)) redirect('/profil');

  const titre = profil.role === 'admin' ? 'Espace de l’Invocatrice' : profil.role === 'modo' ? 'Espace sentinelle' : 'Espace chef·fe';
  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{titre}</h2>
      </div>
      <EspaceAdmin role={profil.role} monId={String(profil.id)} />
    </div>
  );
}
