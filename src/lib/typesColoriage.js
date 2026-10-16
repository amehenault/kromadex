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
