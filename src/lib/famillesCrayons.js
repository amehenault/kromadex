// Familles de crayons interchangeables pour les équivalences.
// Acrylique, gel acrylique et gel se remplacent entre eux ; l'alcool, jamais avec l'acrylique.
export const NOMS_FAMILLES = {
  acrylique: 'acrylique, gel acrylique et gel',
  alcool: 'alcool',
  bois: 'crayons de couleur',
  eau: 'feutres à l’eau',
};

export function familleCrayon(sorte, marque = '') {
  const s = String(sorte || '').toLowerCase();
  if (/alcool/.test(s)) return 'alcool';
  if (/crayons? de couleur/.test(s)) return 'bois';
  if (/eau|super tips/.test(s)) return 'eau';
  if (/acryl|gel|high gloss/.test(s) || /tooli/i.test(marque)) return 'acrylique';
  return null;
}
