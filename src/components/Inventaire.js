import { Backpack } from 'lucide-react';
import { LigneRecompense } from './Recompense';
import { regrouperRecompenses } from '@/lib/recompenses';

// Objets qu'on garde dans son inventaire pour s'en servir (ce ne sont pas des badges)
export const OBJETS = ['parchemin'];

// Inventaire du profil : objets pas encore utilisés (ex. Parchemins du Destin), regroupés
export default function Inventaire({ objets }) {
  const groupes = regrouperRecompenses(objets || []);
  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Backpack size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Inventaire
      </h3>
      {groupes.length
        ? groupes.map((g) => <LigneRecompense key={`${g.genre}|${g.detail}`} r={g} nombre={g.nombre} />)
        : <small style={{ color: 'var(--texte-secondaire)' }}>Ton inventaire est vide. Les objets gagnés, comme le Parchemin du Destin, apparaîtront ici.</small>}
    </section>
  );
}
