export const CATEGORIES_DEFI = [
  { valeur: 'tous', label: 'Tous types de coloriages' },
  { valeur: 'mystere', label: 'Coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'autre', label: 'Autre coloriage' },
];
export const VALEURS_CATEGORIES = CATEGORIES_DEFI.map((c) => c.valeur);
export const nomCategorie = (v) => CATEGORIES_DEFI.find((c) => c.valeur === v)?.label || 'Tous types de coloriages';

export const GENRES_DEFI = ['officiel', 'modo', 'cheffe', 'menestrel', 'groupe'];

export const pageConvient = (categorie, type) => categorie === 'tous' || categorie === type;
