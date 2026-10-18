import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { listerMesTomes } from '@/lib/mesTomes';
import { typesVisibles, nomMesTomes } from '@/lib/typesColoriage';
import MesTomes from '../mesTomes';

export const dynamic = 'force-dynamic';

// Ma progression : tomes (coloriage mystère) et livres (Cozy colo) commencés séparés, puis les non commencés.
// Un tome perso ou d'un autre type va avec les tomes, sauf pour une personne qui ne voit que le Cozy colo.
export default async function ProgressionPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profile = await getUserProfile(user.id);
  const mesTomes = await listerMesTomes(user.id);

  const visibles = typesVisibles(profile?.types_pratiques, profile?.types_vus);
  const voitMystere = visibles.includes('mystere');
  const voitCozy = visibles.includes('cozy');
  const estLivre = (t) => t.type === 'cozy' || (t.type !== 'mystere' && voitCozy && !voitMystere);
  const nonCommences = voitMystere && !voitCozy ? 'Tomes non commencés'
    : voitCozy && !voitMystere ? 'Livres non commencés' : 'Tomes et livres non commencés';
  const groupes = [
    { cle: 'tomes', titre: 'Tomes commencés', tomes: mesTomes.filter((t) => t.faites > 0 && !estLivre(t)) },
    { cle: 'livres', titre: 'Livres commencés', tomes: mesTomes.filter((t) => t.faites > 0 && estLivre(t)) },
    { cle: 'non', titre: nonCommences, tomes: mesTomes.filter((t) => !t.faites) },
  ].filter((g) => g.tomes.length);

  return (
    <div className="contenu">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{nomMesTomes(visibles)}</h2>
      </div>
      {groupes.length ? groupes.map((g) => (
        <div key={g.cle} className="carte" style={{ marginBottom: 'var(--espace-3)' }}>
          <h3 style={{ margin: '0 0 var(--espace-3)', fontSize: '1rem' }}>{g.titre}</h3>
          <MesTomes tomes={g.tomes} />
        </div>
      )) : (
        <div className="carte" style={{ marginBottom: 'var(--espace-3)' }}>
          <MesTomes tomes={[]} />
        </div>
      )}
    </div>
  );
}
