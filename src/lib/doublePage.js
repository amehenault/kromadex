
const DOUBLE = /^(\d+)-(\d+)$/;

export function debutDoublePage(pageNo) {
  const m = DOUBLE.exec(String(pageNo ?? '').trim());
  return m && Number(m[2]) === Number(m[1]) + 1 && Number(m[1]) > 0 ? Number(m[1]) : null;
}

export const estDoublePage = (pageNo) => debutDoublePage(pageNo) !== null;

export const numeroDoublePage = (n) => `${n}-${Number(n) + 1}`;

export function pagesDuNumero(pageNo) {
  const debut = debutDoublePage(pageNo);
  if (debut) return [debut, debut + 1];
  const n = parseInt(pageNo, 10);
  return n > 0 ? [n] : [];
}
