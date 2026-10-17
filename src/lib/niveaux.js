// Barème des niveaux : 62 niveaux.
// Rythme de référence sur un an : 1 coloriage par jour et 1 épreuve par mois, soit
//   365 coloriages x 100 XP                    = 36 500 XP
//   52 séries de coloriage de 7 jours x 300 XP = 15 600 XP
//   52 séries de connexion de 7 jours x 75 XP  =  3 900 XP
//   12 épreuves x 200 XP                       =  2 400 XP
//                                        total = 58 400 XP pour le niveau 62
// Les quêtes, les combats et les épreuves en plus font monter plus vite.
// L'écart entre deux niveaux passe progressivement de 100 à 1 800 XP et ne diminue jamais.
// Index 0 = niveau 1.
export const SEUILS = [
  0, 100, 300, 500, 700, 900, 1200, 1500, 1800, 2200,
  2600, 3000, 3400, 3900, 4400, 4900, 5400, 6000, 6600, 7200,
  7900, 8600, 9300, 10000, 10800, 11600, 12400, 13200, 14100, 15000,
  15900, 16900, 17900, 18900, 19900, 21000, 22100, 23200, 24300, 25500,
  26700, 27900, 29200, 30500, 31800, 33100, 34500, 35900, 37300, 38800,
  40300, 41800, 43300, 44900, 46500, 48100, 49700, 51400, 53100, 54800,
  56600, 58400,
];
export const NIVEAU_MAX = SEUILS.length; // 62

// XP rapportés par une page de coloriage ajoutée, et par une épreuve relevée (coloriage envoyé)
export const XP_PAGE = 100;
export const XP_EPREUVE = 200;

// XP cumulés nécessaires pour atteindre un niveau (plafonné au niveau maximum)
export function seuilNiveau(niveau) {
  const n = Math.min(Math.max(1, Math.floor(niveau) || 1), NIVEAU_MAX);
  return SEUILS[n - 1];
}

// Niveau correspondant à un total d'XP. Les XP continuent de s'accumuler après le niveau 62.
export function calculerNiveau(xp) {
  const total = Math.max(0, Number(xp) || 0);
  let niveau = 1;
  while (niveau < NIVEAU_MAX && SEUILS[niveau] <= total) niveau++;
  return niveau;
}

// Progression vers le niveau suivant, pour la barre du profil.
// Au niveau maximum : barre pleine, pas de niveau suivant.
export function progressionNiveau(xp) {
  const total = Math.max(0, Number(xp) || 0);
  const niveau = calculerNiveau(total);
  if (niveau >= NIVEAU_MAX) {
    return { niveau, debut: SEUILS[NIVEAU_MAX - 1], suivant: null, pct: 100, max: true, reste: 0 };
  }
  const debut = SEUILS[niveau - 1];
  const suivant = SEUILS[niveau];
  return { niveau, debut, suivant, pct: Math.round(((total - debut) / (suivant - debut)) * 100), max: false, reste: suivant - total };
}
