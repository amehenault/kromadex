import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { listerMesTomes } from '@/lib/mesTomes';
import { typesVisibles } from '@/lib/typesColoriage';
import OngletsCollections from '@/components/OngletsCollections';
import MesTomes from '../mesTomes';

export const dynamic = 'force-dynamic';

// Collections > Tomes et livres > Ma collection : tomes (coloriage mystère) et livres (Cozy colo) séparés, commencés puis non commencés.
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
  const groupes = [
    { cle: 'tomes', titre: 'Tomes commencés', tomes: mesTomes.filter((t) => t.faites > 0 && !estLivre(t)) },
    { cle: 'livres', titre: 'Livres commencés', tomes: mesTomes.filter((t) => t.faites > 0 && estLivre(t)) },
    { cle: 'tomes-non', titre: 'Tomes non commencés', tomes: mesTomes.filter((t) => !t.faites && !estLivre(t)) },
    { cle: 'livres-non', titre: 'Livres non commencés', tomes: mesTomes.filter((t) => !t.faites && estLivre(t)) },
  ].filter((g) => g.tomes.length);

  return (
    <div className="contenu">
      {/* Collections : onglet Tomes et livres, sous-onglet Ma collection */}
      <OngletsCollections actif="collection" visibles={visibles} />
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
