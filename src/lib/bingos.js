// Bingos : grille de 3 x 3, une tâche courte par case et sa condition détaillée
export const NB_CASES = 9;

export const CATEGORIES_BINGO = [
  { valeur: 'les_deux', label: 'Cozy colo et coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'mystere', label: 'Coloriage mystère' },
];
export const VALEURS_CATEGORIES_BINGO = CATEGORIES_BINGO.map((c) => c.valeur);
export const nomCategorieBingo = (v) => CATEGORIES_BINGO.find((c) => c.valeur === v)?.label || CATEGORIES_BINGO[0].label;

// Lignes gagnantes : 3 rangées, 3 colonnes, 2 diagonales
export const LIGNES_BINGO = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
