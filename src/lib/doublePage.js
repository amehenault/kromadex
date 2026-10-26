// Double page de coloriage mystère : enregistrée avec le numéro « 28-29 » (deux pages qui se suivent),
// pour que les codes couleurs ne soient écrits qu'une fois (utilisable dans le navigateur et sur le serveur)

const DOUBLE = /^(\d+)-(\d+)$/;

// « 28-29 » → 28 ; sinon null
export function debutDoublePage(pageNo) {
  const m = DOUBLE.exec(String(pageNo ?? '').trim());
  return m && Number(m[2]) === Number(m[1]) + 1 && Number(m[1]) > 0 ? Number(m[1]) : null;
}

export const estDoublePage = (pageNo) => debutDoublePage(pageNo) !== null;

export const numeroDoublePage = (n) => `${n}-${Number(n) + 1}`;

// Numéros de pages couverts par un coloriage : « 28-29 » → [28, 29], « 12 » → [12], sinon []
export function pagesDuNumero(pageNo) {
  const debut = debutDoublePage(pageNo);
  if (debut) return [debut, debut + 1];
  const n = parseInt(pageNo, 10);
  return n > 0 ? [n] : [];
}
