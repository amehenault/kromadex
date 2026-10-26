// Texte écrit après le numéro d'un crayon dans un code couleur (ex. « 617 Guangna », « BG-278 Languo gel acrylique »),
// pour que tout le monde sache quel crayon utiliser (utilisable dans le navigateur et dans les tests).
// Brush ou alcool : la marque seule. Gel acrylique et High Gloss : « gel acrylique ». Autre sorte : la sorte, sans le modèle entre parenthèses.
export function sorteCourte(sorte) {
  const s = String(sorte || '').trim();
  if (!s || /brush|alcool/i.test(s)) return '';
  if (/high gloss|gel acrylique/i.test(s)) return 'gel acrylique';
  const sans = s.replace(/\s*\([^)]*\)/g, '').trim();
  return sans.charAt(0).toLowerCase() + sans.slice(1);
}

export const libelleMarque = (marque, sorte) => [marque, sorteCourte(sorte)].filter(Boolean).join(' ');
