export const TYPES_ACTIVITES = {
  bingo: 'Bingo',
  expedition: 'Expédition',
  epopee: 'Épopée',
  prophetie: 'Prophétie',
  defi_officiel: 'Épreuve mensuelle',
  defi_modo: 'Épreuve des Sentinelles',
  defi_cheffe: 'Épreuve des Cheffes',
  defi_menestrel: 'Épreuve des Ménestrelles',
  defi_groupe: 'Épreuve de groupe',
};

export const mentionActivite = (x) => `${TYPES_ACTIVITES[x.genre] || 'Activité'} : ${x.nom_activite}`;
