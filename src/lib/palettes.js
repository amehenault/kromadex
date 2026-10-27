
export const MIN_COULEURS = 2;
export const MAX_COULEURS = 8;
export const estHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

export function hslVersHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const hexVersRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function rgbVersLab([r, g, b]) {
  const lin = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
export function distanceCouleurs(a, b) {
  const [l1, a1, b1] = rgbVersLab(hexVersRgb(a));
  const [l2, a2, b2] = rgbVersLab(hexVersRgb(b));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

export function crayonLePlusProche(hex, crayons) {
  let meilleur = null;
  for (const c of crayons) {
    const d = distanceCouleurs(hex, c.hex);
    if (!meilleur || d < meilleur.distance) meilleur = { ...c, distance: d };
  }
  return meilleur;
}

const HARMONIES = [
  { nom: 'Douceur analogue', teintes: (h, n) => Array.from({ length: n }, (_, i) => h + (i - (n - 1) / 2) * 22) },
  { nom: 'Complémentaires', teintes: (h, n) => Array.from({ length: n }, (_, i) => (i % 2 ? h + 180 : h) + Math.floor(i / 2) * 14) },
  { nom: 'Triade', teintes: (h, n) => Array.from({ length: n }, (_, i) => h + (i % 3) * 120 + Math.floor(i / 3) * 12) },
  { nom: 'Monochrome', teintes: (h, n) => Array.from({ length: n }, () => h) },
  { nom: 'Tétrade', teintes: (h, n) => Array.from({ length: n }, (_, i) => h + (i % 4) * 90 + Math.floor(i / 4) * 10) },
];
const AMBIANCES = [
  { nom: 'pastel', s: [45, 70], l: [76, 88] },
  { nom: 'cocooning', s: [30, 50], l: [55, 75] },
  { nom: 'automne', s: [45, 70], l: [40, 62] },
  { nom: 'vif', s: [65, 85], l: [48, 62] },
];
const hasard = (min, max) => min + Math.random() * (max - min);

export function genererPalettes(nombre, combien = 6) {
  return Array.from({ length: combien }, () => {
    const harmonie = HARMONIES[Math.floor(Math.random() * HARMONIES.length)];
    const ambiance = AMBIANCES[Math.floor(Math.random() * AMBIANCES.length)];
    const base = hasard(0, 360);
    const teintes = harmonie.teintes(base, nombre);
    const couleurs = teintes.map((h, i) => {
      const t = nombre > 1 ? i / (nombre - 1) : 0;
      const l = harmonie.nom === 'Monochrome' ? ambiance.l[0] - 25 + t * 40 : hasard(...ambiance.l);
      return hslVersHex(((h % 360) + 360) % 360, hasard(...ambiance.s), Math.max(15, Math.min(92, l)));
    });
    return { nom: `${harmonie.nom} ${ambiance.nom}`, couleurs };
  });
}

export function crayonsPourCouleurs(couleurs, dispo) {
  if (!dispo.length) return [];
  const pris = new Set();
  const cle = (c) => `${c.pack}:${c.code || c.nom || c.hex}`;
  return couleurs.map((hex) => {
    const libres = dispo.filter((c) => !pris.has(cle(c)));
    const c = crayonLePlusProche(hex, libres.length ? libres : dispo);
    pris.add(cle(c));
    return { hex: c.hex, code: c.code || '', nom: c.nom || '' };
  });
}
