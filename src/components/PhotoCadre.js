import { CADRES, styleCadre } from '@/lib/cadres';

// Photo de profil ronde entourée de son cadre (utilisable côté serveur et côté navigateur).
//  taille : diamètre de la photo sans cadre ; children(t) dessine la photo ronde au diamètre t.
// Cadre illustré : l'ensemble prend 1,6 fois la taille de la photo et la photo se place dans le centre vide du cadre.
// Cadre en anneau : la photo garde sa taille, entourée de son double anneau.
export default function PhotoCadre({ cadre, taille, children }) {
  const c = CADRES[cadre];
  if (c?.image) {
    const total = Math.round(taille * 1.6);
    return (
      <span title={c.nom} style={{ position: 'relative', width: total, height: total, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {children(Math.round(total * c.photo))}
        <img src={c.image} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      </span>
    );
  }
  return (
    <span title={c?.nom} style={{ borderRadius: '50%', display: 'inline-flex', flex: '0 0 auto', margin: c ? '9px' : 0, ...styleCadre(cadre) }}>
      {children(taille)}
    </span>
  );
}
