// Ambiances et fêtes des palettes de couleurs (utilisable dans le navigateur et sur le serveur).
// Chaque thème a sa recette : des plages de teintes (degrés sur le cercle des couleurs), une saturation et une luminosité,
// et parfois des couleurs fixes typiques (ex. le noir d'Halloween, le blanc neige de Noël).
//  arcEnCiel : les teintes font le tour du cercle (couleurs toutes différentes)
import { hslVersHex } from './palettes.js';

export const CATEGORIES_THEMES = [
  { cle: 'ambiance', nom: 'Ambiance' },
  { cle: 'fete', nom: 'Fête' },
];

export const AMBIANCES = [
  { cle: 'sombre', nom: 'Sombre', teintes: [[0, 360]], s: [30, 60], l: [12, 34] },
  { cle: 'joyeux', nom: 'Joyeux', teintes: [[45, 58], [22, 34], [330, 348], [168, 186], [95, 115]], s: [72, 90], l: [55, 68] },
  { cle: 'colore', nom: 'Coloré', arcEnCiel: true, s: [75, 95], l: [45, 60] },
  { cle: 'pastel', nom: 'Pastel', teintes: [[0, 360]], s: [45, 70], l: [78, 90] },
  { cle: 'cocooning', nom: 'Cocooning', teintes: [[15, 45], [330, 360], [80, 140]], s: [25, 45], l: [58, 78] },
  { cle: 'vintage', nom: 'Vintage', teintes: [[20, 50], [160, 200], [340, 360]], s: [25, 45], l: [45, 68] },
  { cle: 'nature', nom: 'Nature', teintes: [[80, 140], [25, 40], [45, 55], [190, 205]], s: [30, 60], l: [30, 62] },
  { cle: 'ocean', nom: 'Océan', teintes: [[175, 200], [195, 230]], s: [45, 80], l: [32, 80] },
  { cle: 'romantique', nom: 'Romantique', teintes: [[335, 360], [0, 12], [300, 325]], s: [40, 70], l: [45, 85] },
  { cle: 'feerique', nom: 'Féerique', teintes: [[260, 300], [310, 335], [170, 190], [45, 55]], s: [50, 75], l: [58, 80] },
  { cle: 'printemps', nom: 'Printemps', teintes: [[85, 130], [330, 350], [50, 60], [190, 210]], s: [45, 70], l: [65, 82] },
  { cle: 'ete', nom: 'Été', teintes: [[45, 55], [15, 30], [175, 195], [340, 355]], s: [70, 90], l: [52, 66] },
  { cle: 'automne', nom: 'Automne', teintes: [[10, 40], [40, 50], [80, 100], [0, 8]], s: [45, 70], l: [32, 58] },
  { cle: 'hiver', nom: 'Hiver', teintes: [[195, 225], [225, 250], [0, 360]], s: [10, 40], l: [55, 90], fixes: ['#F4F6F8'] },
];

export const FETES = [
  { cle: 'jour-de-lan', nom: 'Jour de l’An', teintes: [[42, 50], [220, 235], [270, 285]], s: [30, 70], l: [18, 72], fixes: ['#1C1C24', '#D4AF37', '#F2F2F2'] },
  { cle: 'saint-valentin', nom: 'Saint-Valentin', teintes: [[345, 360], [0, 8], [325, 340]], s: [55, 85], l: [40, 88], fixes: ['#FFF5F7'] },
  { cle: 'saint-patrick', nom: 'Saint-Patrick', teintes: [[100, 150], [45, 52]], s: [50, 80], l: [30, 65], fixes: ['#D4AF37', '#F5F3EC'] },
  { cle: 'paques', nom: 'Pâques', teintes: [[50, 60], [95, 130], [185, 205], [265, 285], [330, 345]], s: [45, 70], l: [78, 88] },
  { cle: 'fete-des-meres', nom: 'Fête des mères', teintes: [[330, 350], [280, 300], [90, 120], [20, 35]], s: [40, 65], l: [65, 85] },
  { cle: 'fete-nationale', nom: 'Fête nationale du Québec', teintes: [[205, 222]], s: [65, 90], l: [30, 60], fixes: ['#FFFFFF', '#F2F6FB'] },
  { cle: 'fete-du-canada', nom: 'Fête du Canada', teintes: [[355, 360], [0, 6]], s: [70, 90], l: [38, 55], fixes: ['#FFFFFF', '#F7F7F7'] },
  { cle: 'action-de-grace', nom: 'Action de grâce', teintes: [[20, 35], [35, 48], [5, 15], [60, 80]], s: [45, 70], l: [32, 60] },
  { cle: 'halloween', nom: 'Halloween', teintes: [[20, 32], [270, 290], [18, 30], [90, 110], [275, 295]], s: [60, 85], l: [30, 55], fixes: ['#1B1820'] },
  { cle: 'noel', nom: 'Noël', teintes: [[355, 360], [0, 5], [130, 155], [42, 50]], s: [55, 80], l: [28, 52], fixes: ['#F5F2EA'] },
];

const LISTES = { ambiance: AMBIANCES, fete: FETES };
export const themesDe = (categorie) => LISTES[categorie] || [];
export const themeDe = (categorie, cle) => themesDe(categorie).find((t) => t.cle === cle) || null;
export const nomTheme = (categorie, cle) => themeDe(categorie, cle)?.nom || '';
// Valeur reçue par l'API : une clé connue, sinon vide
export const cleValide = (categorie, cle) => (themeDe(categorie, cle) ? cle : '');

const hasard = (min, max) => min + Math.random() * (max - min);
const melanger = (l) => l.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

// Une palette de n couleurs dans un thème : teintes tirées dans ses plages (tour à tour pour bien les mélanger),
// luminosités étalées pour garder du contraste, et au plus une couleur fixe du thème (deux à partir de 6 couleurs)
export function couleursDuTheme(theme, n) {
  const fixes = melanger(theme.fixes || []).slice(0, theme.fixes?.length ? (n >= 6 ? 2 : 1) : 0).filter(() => Math.random() < 0.8);
  const reste = n - fixes.length;
  const plages = melanger(theme.teintes || [[0, 360]]);
  const depart = hasard(0, 360);
  const luminosites = melanger(Array.from({ length: reste }, (_, i) => theme.l[0] + (theme.l[1] - theme.l[0]) * (reste > 1 ? i / (reste - 1) : 0.5)));
  const couleurs = Array.from({ length: reste }, (_, i) => {
    const h = theme.arcEnCiel ? depart + (360 / reste) * i + hasard(-10, 10) : hasard(...plages[i % plages.length]);
    const l = Math.max(8, Math.min(94, luminosites[i] + hasard(-4, 4)));
    return hslVersHex(((h % 360) + 360) % 360, hasard(...theme.s), l);
  });
  return melanger([...couleurs, ...fixes]);
}
