import Link from 'next/link';
import { Info, X } from 'lucide-react';

// Livres Cozy colo : le nombre de pages connu ne correspond pas toujours au nombre de coloriages à l'intérieur.
// tome : le livre concerné (le lien vers Aide arrive déjà rempli), sinon un message général.
// onFermer : affiche un X pour fermer le message.
export default function AvisPagesCozy({ tome, onFermer }) {
  const lien = `/aide?type=erreur_tome${tome ? `&tome=${encodeURIComponent(tome)}` : ''}`;
  return (
    <div style={{
      display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '0 0 var(--espace-3)', padding: '10px 12px',
      fontSize: '0.88rem', background: 'var(--accent-doux)', borderRadius: 'var(--rayon-m)', color: 'var(--texte-principal)',
    }}>
      <Info size={18} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: '1px' }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        Le nombre de pages indiqué {tome ? <>pour <b>{tome}</b> </> : 'pour les livres Cozy colo '}ne correspond peut-être pas au nombre de coloriages à l’intérieur.
        Si c’est le cas, <Link href={lien} style={{ fontWeight: 700, color: 'inherit', textDecoration: 'underline' }}>écris-moi via Aide</Link> et
        je le changerai pour le bon nombre.
      </span>
      {onFermer && (
        <button type="button" onClick={onFermer} aria-label="Fermer"
          style={{ flex: '0 0 auto', width: 44, height: 44, margin: '-10px -8px -10px 0', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'grid', placeItems: 'center' }}>
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
