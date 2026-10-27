import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import EspaceAdmin from './espaceAdmin';
import { accord } from '@/lib/genre';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profil = await getUserProfile(user.id);
  if (!['admin', 'modo', 'cheffe', 'menestrel'].includes(profil?.role)) redirect('/profil');

  const titre = profil.role === 'admin' ? 'Espace de l’Invocatrice' : profil.role === 'modo' ? 'Espace sentinelle' : profil.role === 'menestrel' ? `Espace ${accord(profil.genre, 'ménestrelle', 'ménestrel')}` : `Créer l’épreuve de ${accord(profil.genre, 'cheffe', 'chef')}`;
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
