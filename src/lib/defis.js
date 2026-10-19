// Catégories et genres de défis
export const CATEGORIES_DEFI = [
  { valeur: 'tous', label: 'Tous types de coloriages' },
  { valeur: 'mystere', label: 'Coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'autre', label: 'Autre coloriage' },
];
export const VALEURS_CATEGORIES = CATEGORIES_DEFI.map((c) => c.valeur);
export const nomCategorie = (v) => CATEGORIES_DEFI.find((c) => c.valeur === v)?.label || 'Tous types de coloriages';

// Genres d'épreuves (le mot « défi » reste dans le code, l'interface dit « épreuve ») :
// officiel : l'épreuve du mois, créée et programmée par l'admin
// modo : une épreuve supplémentaire par modo et par mois
// cheffe : une épreuve par cheffe et par mois
// groupe : créée par n'importe quel membre, une par mois
// menestrel : une par ménestrelle et par mois
export const GENRES_DEFI = ['officiel', 'modo', 'cheffe', 'menestrel', 'groupe'];

// Un coloriage convient au défi si la catégorie est « tous » ou correspond à son type
export const pageConvient = (categorie, type) => categorie === 'tous' || categorie === type;
