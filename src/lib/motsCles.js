import { sql } from '@/lib/db';
import { cleMot } from '@/lib/cleMot';
import { debutDoublePage } from '@/lib/doublePage';

// Mot-clef nettoyé (espaces, 40 caractères au maximum)
export const propreMot = (m) => String(m || '').trim().replace(/\s+/g, ' ').slice(0, 40);

// Mots-clefs ajoutés pendant la création d'un coloriage, enregistrés avec lui :
// partagés sur la page du tome si le tome est au catalogue (et la page est un nombre), sinon gardés sur le coloriage.
// Les mêmes limites que l'ajout un par un : 30 par coloriage, 50 mots-clefs partagés par jour.
export async function enregistrerMotsEnAttente(userId, page, liste) {
  // Sans doublon (Lapin = lapin = Lapins) : la première écriture est gardée
  const vus = new Set();
  const mots = (Array.isArray(liste) ? liste : []).map(propreMot)
    .filter((m) => m.length >= 2 && !vus.has(cleMot(m)) && vus.add(cleMot(m))).slice(0, 30);
  if (!mots.length) return;
  // Double page « 28-29 » : les mots-clefs vont sur sa première page
  const pageNo = String(debutDoublePage(page.page_no) ?? page.page_no ?? '').trim().slice(0, 10);
  const [tome] = page.tome && /^\d*$/.test(pageNo) ? await sql`SELECT id FROM tome_catalog WHERE lower(nom) = lower(${page.tome}) LIMIT 1` : [];
  if (!tome) {
    await sql`UPDATE pages SET mots_cles = ${mots} WHERE id = ${page.id} AND user_id = ${userId}`;
    return;
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM mots_cles WHERE user_id = ${userId} AND cree_le > now() - interval '1 day'`;
  for (const mot of mots.slice(0, Math.max(0, 50 - n))) {
    // Déjà sur cette page (ajouté par quelqu'un d'autre) : l'index unique sur la clé l'ignore
    await sql`INSERT INTO mots_cles (tome_id, page_no, mot, cle, user_id) VALUES (${tome.id}, ${pageNo}, ${mot}, ${cleMot(mot)}, ${userId}) ON CONFLICT DO NOTHING`;
  }
}
