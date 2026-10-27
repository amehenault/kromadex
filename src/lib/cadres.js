import IMAGES from '@/lib/manifesteRecompenses.json';
import { nomPionnier } from '@/lib/postes';

export const CADRES = {
  pionnier: { nom: 'Cadre de Pionnière : pierres', image: '/pionniers/kromadex-pionnier-cadre1.svg', photo: 0.56,
    condition: 'Avoir participé à la bêta de Kromadex comme Pionnière.' },
  pionnier2: { nom: 'Cadre de Pionnière : vigne', image: '/pionniers/kromadex-pionnier-cadre2.svg', photo: 0.62,
    condition: 'Avoir participé à la bêta de Kromadex comme Pionnière.' },
};

IMAGES.filter((i) => i.chemin.startsWith('/pionniers/') && i.fichier.toLowerCase().includes('cadre'))
  .filter((i) => !Object.values(CADRES).some((c) => c.image === i.chemin))
  .forEach((i) => {
    const base = i.fichier.replace(/\.[a-z0-9]+$/i, '');
    const numero = (base.match(/\d+/) || [])[0];
    CADRES[`pionnier_${base}`] = {
      nom: `Cadre de Pionnière${numero ? ` ${numero}` : ''}`, image: i.chemin, photo: 0.6,
      condition: 'Avoir participé à la bêta de Kromadex comme Pionnière.',
    };
  });

export function cadresDebloques({ pionnier, role }) {
  const liste = [];
  if (pionnier || role === 'admin') liste.push(...Object.keys(CADRES).filter((c) => c.startsWith('pionnier')));
  return liste;
}

export function cadreAffiche(choix, debloques) {
  if (choix === 'aucun') return null;
  if (choix && debloques.includes(choix)) return choix;
  return debloques[0] || null;
}

export function styleCadre(cle) {
  const c = CADRES[cle];
  if (!c?.anneau) return {};
  const [a, b] = c.anneau;
  return { boxShadow: `0 0 0 3px ${a}, 0 0 0 6px var(--fond-carte), 0 0 0 9px ${b}` };
}

export { nomPionnier } from '@/lib/postes';

export const nomCadre = (cle, genre) => (CADRES[cle]?.nom || '').replace('Pionnière', nomPionnier(genre));
export const conditionCadre = (cle, genre) => (CADRES[cle]?.condition || '').replace('Pionnière', nomPionnier(genre));
