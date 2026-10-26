import { sql } from '@/lib/db';
import { pagesDuNumero } from '@/lib/doublePage';

// Pages coloriées = numéros de page distincts enregistrés pour ce tome (progression automatique ;
// une double page « 28-29 » compte pour deux)
export const pagesFaites = (pages) => new Set(pages.flatMap((p) => pagesDuNumero(p.page_no)));

// Tomes affichés dans le profil : tomes possédés du catalogue + tomes utilisés dans des fiches,
// moins ceux masqués par la personne
export async function listerMesTomes(userId) {
  const uid = String(userId);
  const [possedes, utilises, masques, couvertures, perso] = await Promise.all([
    sql`SELECT c.id, c.nom, c.couverture, c.nb_pages, c.type FROM user_tomes u JOIN tome_catalog c ON c.id = u.tome_id WHERE u.user_id = ${uid}`,
    sql`SELECT p.tome, p.page_no, c.id AS cat_id, c.nom AS cat_nom, c.couverture, c.nb_pages, c.type
        FROM pages p LEFT JOIN tome_catalog c ON lower(c.nom) = lower(p.tome)
        WHERE p.user_id = ${userId} AND p.tome <> ''`,
    sql`SELECT nom FROM user_tomes_masques WHERE user_id = ${uid}`,
    sql`SELECT tome_name, updated_at FROM tome_covers WHERE user_id = ${uid}`,
    sql`SELECT nom, nb_pages FROM tomes_perso WHERE user_id = ${uid}`,
  ]);
  const cache = new Set(masques.map((m) => m.nom.toLowerCase()));
  const couv = Object.fromEntries(couvertures.map((c) => [c.tome_name.toLowerCase(), c.updated_at]));
  const totPerso = Object.fromEntries(perso.map((p) => [p.nom.toLowerCase(), p.nb_pages]));
  const tomes = new Map();

  const ajouter = (nom, cat) => {
    const cle = nom.toLowerCase();
    if (cache.has(cle)) return null;
    if (!tomes.has(cle)) {
      const maj = couv[cle];
      tomes.set(cle, {
        nom: cat?.nom || nom,
        catalogueId: cat?.id ?? null,
        perso: !cat,
        type: cat?.type || null,
        total: cat ? cat.nb_pages : totPerso[cle] ?? null,
        // couverture perso en priorité, sinon celle du catalogue
        couverture: maj ? `/api/tomes/cover?name=${encodeURIComponent(nom)}&format=img&v=${new Date(maj).getTime()}` : cat?.couverture || null,
        pages: [],
      });
    }
    return tomes.get(cle);
  };

  for (const c of possedes) ajouter(c.nom, c);
  for (const p of utilises) {
    const t = ajouter(p.tome, p.cat_id ? { id: p.cat_id, nom: p.cat_nom, couverture: p.couverture, nb_pages: p.nb_pages, type: p.type } : null);
    if (t) t.pages.push(p);
  }

  return [...tomes.values()]
    .map(({ pages, ...t }) => ({ ...t, faites: pagesFaites(pages).size }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
}
