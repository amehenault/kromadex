// Cadres autour de la photo de profil. Chaque cadre se débloque (Pionnière, relique complétée) ;
// la personne choisit le sien dans Paramètres (null = le plus prestigieux débloqué, 'aucun' = sans cadre).
//  - anneau : double anneau de couleur dessiné autour de la photo ;
//  - image : cadre illustré (public/pionniers) posé par-dessus la photo ; photo = part de la largeur du cadre
//    occupée par la photo. Le centre est vide sur environ 47 % (pierres) et 54 % (vigne) ; la photo est un peu
//    plus grande pour passer sous les ornements, qui sont dessinés par-dessus.
import IMAGES from '@/lib/manifesteRecompenses.json';

export const CADRES = {
  relique: { nom: 'Cadre de la relique', anneau: ['#d4a017', '#d4a017'],
    condition: 'Compléter une relique : réunir 4 fragments de la même collection en gagnant des épreuves des Sentinelles.' },
  pionnier: { nom: 'Cadre de Pionnière et Pionnier : pierres', image: '/pionniers/kromadex-pionnier-cadre1.svg', photo: 0.56,
    condition: 'Avoir participé à la bêta de Kromadex comme Pionnière ou Pionnier.' },
  pionnier2: { nom: 'Cadre de Pionnière et Pionnier : vigne', image: '/pionniers/kromadex-pionnier-cadre2.svg', photo: 0.62,
    condition: 'Avoir participé à la bêta de Kromadex comme Pionnière ou Pionnier.' },
};

// Nouveaux cadres ajoutés automatiquement : tout fichier « …cadre… » déposé dans public/pionniers
// (la photo occupe 60 % de la largeur du cadre, à ajuster ici au besoin)
IMAGES.filter((i) => i.chemin.startsWith('/pionniers/') && i.fichier.toLowerCase().includes('cadre'))
  .filter((i) => !Object.values(CADRES).some((c) => c.image === i.chemin))
  .forEach((i) => {
    const base = i.fichier.replace(/\.[a-z0-9]+$/i, '');
    const numero = (base.match(/\d+/) || [])[0];
    CADRES[`pionnier_${base}`] = {
      nom: `Cadre de Pionnière et Pionnier${numero ? ` ${numero}` : ''}`, image: i.chemin, photo: 0.6,
      condition: 'Avoir participé à la bêta de Kromadex comme Pionnière ou Pionnier.',
    };
  });

// Cadres débloqués : relique complétée, Pionnière ou Pionnier (l'Invocatrice y a droit aussi) ;
// tous les cadres de Pionnière et Pionnier, y compris ceux ajoutés automatiquement
export function cadresDebloques({ relique, pionnier, role }) {
  const liste = [];
  if (relique) liste.push('relique');
  if (pionnier || role === 'admin') liste.push(...Object.keys(CADRES).filter((c) => c.startsWith('pionnier')));
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
  if (!c?.anneau) return {};
  const [a, b] = c.anneau;
  return { boxShadow: `0 0 0 3px ${a}, 0 0 0 6px var(--fond-carte), 0 0 0 9px ${b}` };
}

// « Pionnière », « Pionnier » ou « Pionnier.ère » selon le genre (même règle que les postes)
export { nomPionnier } from '@/lib/postes';
