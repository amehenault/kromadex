// Cadres autour de la photo de profil. Chaque cadre se débloque (Pionnière, relique complétée) ;
// la personne choisit le sien dans Paramètres (null = le plus prestigieux débloqué, 'aucun' = sans cadre).
export const CADRES = {
  relique: { nom: 'Cadre de la relique', anneau: ['#d4a017', '#d4a017'] },
  pionnier: { nom: 'Cadre de Pionnière et Pionnier', anneau: ['var(--couleur-principale)', 'var(--couleur-secondaire)'] },
};

// Cadres débloqués : relique complétée, Pionnière ou Pionnier (l'Invocatrice y a droit aussi)
export function cadresDebloques({ relique, pionnier, role }) {
  const liste = [];
  if (relique) liste.push('relique');
  if (pionnier || role === 'admin') liste.push('pionnier');
  return liste;
}

// Cadre affiché : celui choisi s'il est débloqué, sinon le premier débloqué
export function cadreAffiche(choix, debloques) {
  if (choix === 'aucun') return null;
  if (choix && debloques.includes(choix)) return choix;
  return debloques[0] || null;
}

// Double anneau autour de la photo (le fond de la carte fait l'espace entre les deux)
export function styleCadre(cle) {
  const c = CADRES[cle];
  if (!c) return {};
  const [a, b] = c.anneau;
  return { boxShadow: `0 0 0 3px ${a}, 0 0 0 6px var(--fond-carte), 0 0 0 9px ${b}` };
}

// « Pionnière », « Pionnier » ou « Pionnier.ère » selon le genre (même règle que les postes)
export { nomPionnier } from '@/lib/postes';
