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

// Apparence d'une case : couleur de fond, couleur de texte et image de fond choisies à la création.
// Dès qu'il y a un fond (couleur ou image), le texte est posé sur un rectangle pour rester lisible :
// rectangle foncé pour un texte clair, rectangle clair pour un texte foncé.
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
export function apparenceCase({ fond = '', texte = '', image = '' } = {}) {
  const avecFond = Boolean(fond || image);
  const couleurTexte = texte || 'var(--texte-principal)';
  const texteClair = texte ? luminance(texte) > 0.6 : false;
  return {
    background: image ? `center / cover no-repeat url(${image})${fond ? `, ${fond}` : ''}` : fond || '',
    couleurTexte,
    rectangle: avecFond ? (texteClair ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.88)') : '',
  };
}

// Adresse de l'image de fond d'une case (v : version, change à chaque nouvelle image)
export const imageCaseBingo = (bingoId, n, v) => `/api/bingos/image?id=${bingoId}&case=${n}&v=${v}`;
