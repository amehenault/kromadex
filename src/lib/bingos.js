export const NB_CASES = 9;

export const CATEGORIES_BINGO = [
  { valeur: 'les_deux', label: 'Cozy colo et coloriage mystère' },
  { valeur: 'cozy', label: 'Cozy colo' },
  { valeur: 'mystere', label: 'Coloriage mystère' },
];
export const VALEURS_CATEGORIES_BINGO = CATEGORIES_BINGO.map((c) => c.valeur);
export const nomCategorieBingo = (v) => CATEGORIES_BINGO.find((c) => c.valeur === v)?.label || CATEGORIES_BINGO[0].label;

export const LIGNES_BINGO = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

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

export const imageCaseBingo = (bingoId, n, v) => `/api/bingos/image?id=${bingoId}&case=${n}&v=${v}`;
