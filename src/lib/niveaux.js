// XP total nécessaire pour atteindre chaque niveau (index 0 = niveau 1).
// Le niveau 7 demande 3500 XP. Ensuite, chaque palier coûte 600 XP de plus que le précédent.
const SEUILS = [0, 100, 300, 700, 1300, 2200, 3500];

export function seuilNiveau(niveau) {
  if (niveau <= 1) return 0;
  if (niveau <= SEUILS.length) return SEUILS[niveau - 1];
  let seuil = SEUILS[SEUILS.length - 1];
  let ecart = SEUILS[SEUILS.length - 1] - SEUILS[SEUILS.length - 2];
  for (let n = SEUILS.length + 1; n <= niveau; n++) {
    ecart += 600;
    seuil += ecart;
  }
  return seuil;
}

export function calculerNiveau(xp) {
  let niveau = 1;
  while (seuilNiveau(niveau + 1) <= (xp || 0)) niveau++;
  return niveau;
}

// Progression vers le niveau suivant, pour la barre du profil
export function progressionNiveau(xp) {
  const niveau = calculerNiveau(xp);
  const debut = seuilNiveau(niveau);
  const suivant = seuilNiveau(niveau + 1);
  return { niveau, debut, suivant, pct: Math.round((((xp || 0) - debut) / (suivant - debut)) * 100) };
}
