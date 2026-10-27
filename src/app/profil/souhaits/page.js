import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/auth';
import ListeSouhaits from '@/components/ListeSouhaits';

export const dynamic = 'force-dynamic';

export default async function SouhaitsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil/collection" className="btn alt" aria-label="Retour aux collections" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Ma liste de souhaits</h2>
      </div>
      <ListeSouhaits id={String(user.id)} moi />
    </div>
  );
}
