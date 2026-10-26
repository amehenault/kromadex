import { sql } from '@/lib/db';
import { accorderXP, retirerXP } from '@/lib/series';
import { XP_PAGE } from '@/lib/niveaux';
import { estDoublePage } from '@/lib/doublePage';

// XP d'un coloriage : seulement quand une vraie image y est ajoutée (une fiche sans image reste un brouillon),
// une seule fois par fiche (clé page:<id>), et au plus XP_COLORIAGES_PAR_JOUR pages récompensées par 24 heures.
// Une double page (« 28-29 ») compte pour deux pages : sa seconde page a sa propre clé page:<id>:2.
export const XP_COLORIAGES_PAR_JOUR = 10;

const cleSecondePage = (pageId) => `page:${pageId}:2`;

async function limiteAtteinte(userId) {
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM xp_journal
    WHERE user_id = ${userId} AND cle LIKE 'page:%' AND cree_le > now() - interval '24 hours'`;
  return n >= XP_COLORIAGES_PAR_JOUR;
}

export async function accorderXPColoriage(userId, pageId) {
  const ok = !(await limiteAtteinte(userId)) && await accorderXP(userId, `page:${pageId}`, XP_PAGE);
  await ajusterXPDoublePage(userId, pageId);
  return ok;
}

// Seconde page d'une double page : XP donnés si le coloriage a déjà rapporté les siens (image ajoutée),
// repris si la case « Double page » est décochée. À appeler après chaque modification de la fiche.
export async function ajusterXPDoublePage(userId, pageId) {
  const [p] = await sql`SELECT page_no FROM pages WHERE id = ${pageId} AND user_id = ${userId}`;
  if (!p || !estDoublePage(p.page_no)) return retirerXP(userId, cleSecondePage(pageId));
  const [recompensee] = await sql`SELECT 1 FROM xp_journal WHERE user_id = ${userId} AND cle = ${`page:${pageId}`}`;
  if (!recompensee || await limiteAtteinte(userId)) return 0;
  return accorderXP(userId, cleSecondePage(pageId), XP_PAGE);
}

// Coloriage supprimé : ses XP (et ceux de sa seconde page) sont repris
export async function retirerXPColoriage(userId, pageId) {
  await retirerXP(userId, `page:${pageId}`);
  await retirerXP(userId, cleSecondePage(pageId));
}
