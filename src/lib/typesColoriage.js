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
export function typesVisibles(typesPratiques, typesVus) {
  if (typesVus?.length) return typesVus;
  if (typesPratiques?.length) return typesPratiques;
  return VALEURS_TYPES;
}

// « Tome » pour les coloriages mystères, « livre » pour le Cozy colo
export function nomBibliotheque(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  if (mystere && !cozy) return 'Mes tomes';
  if (cozy && !mystere) return 'Mes livres';
  return 'Mes tomes et livres';
}
