export function appliquerCode(groupes, rowId, num, hex) {
  const cible = groupes.flatMap((g) => g.rows || []).find((r) => r.id === rowId);
  const sym = cible?.sym || '';
  const ancien = cible?.num || '';
  return groupes.map((g) => ({
    ...g,
    rows: (g.rows || []).map((r) => (r.id === rowId || (sym && r.sym === sym && [ancien, ''].includes(r.num || '')) ? { ...r, num, hex } : r)),
  }));
}

export function codeDuSymbole(groupes, sym, saufId) {
  if (!sym) return null;
  const r = groupes.flatMap((g) => g.rows || []).find((x) => x.id !== saufId && x.sym === sym && x.num);
  return r ? { num: r.num, hex: r.hex || '' } : null;
}
