export const TYPES_COLORIAGE = [
  { valeur: 'mystere', label: 'Coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'autre', label: 'Autre coloriage' },
];

export const VALEURS_TYPES = TYPES_COLORIAGE.map((t) => t.valeur);

export function typeVisible(type, typesVus) {
  return !typesVus?.length || typesVus.includes(type);
}

export function typesVisibles(typesPratiques, typesVus) {
  const liste = typesVus?.length ? typesVus : typesPratiques?.length ? typesPratiques : VALEURS_TYPES;
  return liste.includes('autre') && !liste.includes('cozy') ? [...liste, 'cozy'] : liste;
}

export const faitCozy = (typesPratiques) => (typesPratiques || []).some((t) => t === 'cozy' || t === 'autre');

export function nomBibliotheque(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  if (mystere && !cozy) return 'Mes tomes';
  if (cozy && !mystere) return 'Mes livres';
  return 'Mes tomes et livres';
}

export function nomMesTomes(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  return mystere && cozy ? 'Tomes et livres' : cozy ? 'Livres' : 'Tomes';
}
export function nomCollectionTomes(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  return mystere && cozy ? 'Collection de tomes et de livres' : cozy ? 'Collection de livres' : 'Collection de tomes';
}

export function nomCollections(visibles) {
  const mystere = visibles.includes('mystere');
  const cozy = visibles.includes('cozy');
  return mystere && cozy ? 'Collections de tomes, de livres et de crayons'
    : cozy ? 'Collections de livres et de crayons' : 'Collections de tomes et de crayons';
}
