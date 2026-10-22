// Code couleur d'une ligne d'un coloriage (utilisable dans le navigateur et dans les tests).
// Dans CE coloriage seulement, les autres lignes du même symbole (ex. tous les « 2 ») reçoivent le même code
// si elles sont vides ou avaient le même code qu'elle : pas besoin de le remettre à chaque fois.
// Une ligne du même symbole avec un autre code déjà choisi n'est pas touchée.
export function appliquerCode(groupes, rowId, num, hex) {
  const cible = groupes.flatMap((g) => g.rows || []).find((r) => r.id === rowId);
  const sym = cible?.sym || '';
  const ancien = cible?.num || '';
  return groupes.map((g) => ({
    ...g,
    rows: (g.rows || []).map((r) => (r.id === rowId || (sym && r.sym === sym && [ancien, ''].includes(r.num || '')) ? { ...r, num, hex } : r)),
  }));
}

// Code déjà choisi pour ce symbole ailleurs dans ce coloriage ({ num, hex }), ou null.
// Sert quand on ajoute une ligne ou qu'on change son symbole : elle reçoit tout de suite le code de ce symbole.
export function codeDuSymbole(groupes, sym, saufId) {
  if (!sym) return null;
  const r = groupes.flatMap((g) => g.rows || []).find((x) => x.id !== saufId && x.sym === sym && x.num);
  return r ? { num: r.num, hex: r.hex || '' } : null;
}
