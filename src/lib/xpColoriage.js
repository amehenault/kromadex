import { sql } from '@/lib/db';
import { accorderXP, retirerXP } from '@/lib/series';
import { XP_PAGE } from '@/lib/niveaux';
import { estDoublePage } from '@/lib/doublePage';

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

export async function ajusterXPDoublePage(userId, pageId) {
  const [p] = await sql`SELECT page_no FROM pages WHERE id = ${pageId} AND user_id = ${userId}`;
  if (!p || !estDoublePage(p.page_no)) return retirerXP(userId, cleSecondePage(pageId));
  const [recompensee] = await sql`SELECT 1 FROM xp_journal WHERE user_id = ${userId} AND cle = ${`page:${pageId}`}`;
  if (!recompensee || await limiteAtteinte(userId)) return 0;
  return accorderXP(userId, cleSecondePage(pageId), XP_PAGE);
}

export async function retirerXPColoriage(userId, pageId) {
  await retirerXP(userId, `page:${pageId}`);
  await retirerXP(userId, cleSecondePage(pageId));
}
