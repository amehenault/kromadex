// Types de coloriage utilisés pour les préférences, les tomes et les défis
export const TYPES_COLORIAGE = [
  { valeur: 'mystere', label: 'Coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'autre', label: 'Autre coloriage' },
];

export const VALEURS_TYPES = TYPES_COLORIAGE.map((t) => t.valeur);

// Liste vide = aucune restriction (on montre tout)
export function typeVisible(type, typesVus) {
  return !typesVus?.length || typesVus.includes(type);
}

// Types visibles pour une personne : « Je veux voir les… » s'il est rempli, sinon « Je fais du… »,
// sinon tout. Une personne qui ne fait que du coloriage mystère ne voit donc rien du Cozy colo, et inversement.
// « Autre coloriage » voit les mêmes choses que le Cozy colo (livres, bingos, palettes…).
export function typesVisibles(typesPratiques, typesVus) {
  const liste = typesVus?.length ? typesVus : typesPratiques?.length ? typesPratiques : VALEURS_TYPES;
  return liste.includes('autre') && !liste.includes('cozy') ? [...liste, 'cozy'] : liste;
}

// Fait du Cozy colo, ou un autre coloriage (traité comme le Cozy colo)
export const faitCozy = (typesPratiques) => (typesPratiques || []).some((t) => t === 'cozy' || t === 'autre');

// « Tome » pour les coloriages mystères, « livre » pour le Cozy colo
export function nomBibliotheque(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  if (mystere && !cozy) return 'Mes tomes';
  if (cozy && !mystere) return 'Mes livres';
  return 'Mes tomes et livres';
}

// Noms des boutons du profil et des pages qu'ils ouvrent (toujours identiques) :
//  « Mes tomes et mes livres » : la progression ; « Collection de tomes et de livres » : le catalogue où on ajoute ses tomes
export function nomMesTomes(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  return mystere && cozy ? 'Mes tomes et mes livres' : cozy ? 'Mes livres' : 'Mes tomes';
}
export function nomCollectionTomes(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  return mystere && cozy ? 'Collection de tomes et de livres' : cozy ? 'Collection de livres' : 'Collection de tomes';
}
