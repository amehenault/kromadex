export function sorteCourte(sorte) {
  const s = String(sorte || '').trim();
  if (!s || /brush|alcool/i.test(s)) return '';
  if (/high gloss|gel acrylique/i.test(s)) return 'gel acrylique';
  const sans = s.replace(/\s*\([^)]*\)/g, '').trim();
  return sans.charAt(0).toLowerCase() + sans.slice(1);
}

export const libelleMarque = (marque, sorte) => [marque, sorteCourte(sorte)].filter(Boolean).join(' ');
