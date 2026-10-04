// Lettres, chiffres et symboles disponibles dans les listes déroulantes.
// Les symboles sont des formes simples dessinées sur une grille de 24 x 24.
const rond = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;

export const LETTRES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const CHIFFRES = '1234567890'.split('');
export const SYMBOLES = [
  { id: 'cercle', nom: 'Cercle', d: rond(12, 12, 9) },
  { id: 'anneau', nom: 'Anneau', d: rond(12, 12, 9) + rond(12, 12, 5) },
  { id: 'carre', nom: 'Carré', d: 'M4 4h16v16H4z' },
  { id: 'triangle', nom: 'Triangle', d: 'M12 3l9 17H3z' },
  { id: 'triangle-inverse', nom: 'Triangle inversé', d: 'M12 21L3 4h18z' },
  { id: 'losange', nom: 'Losange', d: 'M12 2l8 10-8 10-8-10z' },
  { id: 'pentagone', nom: 'Pentagone', d: 'M12 2l9.5 6.9-3.6 11.2H6.1L2.5 8.9z' },
  { id: 'hexagone', nom: 'Hexagone', d: 'M12 2l8.7 5v10L12 22l-8.7-5V7z' },
  { id: 'demi-cercle', nom: 'Demi-cercle', d: 'M3 15a9 9 0 0 1 18 0z' },
  { id: 'etoile', nom: 'Étoile', d: 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.2L12 17.6 5.7 21.4l1.7-7.2L2 9.5l7.1-.6z' },
  { id: 'etincelle', nom: 'Étincelle', d: 'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z' },
  { id: 'coeur', nom: 'Coeur', d: 'M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z' },
  { id: 'lune', nom: 'Lune', d: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z' },
  { id: 'fleur', nom: 'Fleur', d: rond(12, 6, 4) + rond(18, 12, 4) + rond(12, 18, 4) + rond(6, 12, 4) + rond(12, 12, 3) },
  { id: 'croix', nom: 'Croix', d: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z' },
  { id: 'goutte', nom: 'Goutte', d: 'M12 2.5s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12z' },
  { id: 'feuille', nom: 'Feuille', d: 'M4 20C4 10 10 4 20 4c0 10-6 16-16 16z' },
  { id: 'eclair', nom: 'Éclair', d: 'M13 2L4 14h6l-1 8 9-12h-6z' },
];
