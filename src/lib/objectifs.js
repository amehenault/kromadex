import { sql } from '@/lib/db';
import { accorderXP, FUSEAU } from '@/lib/series';

export const XP_OBJECTIF = 2;
export const MAX_OBJECTIFS_ACTIFS = 30;
export const MAX_XP_OBJECTIFS_JOUR = 5;

async function recompenser(userId, id) {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM xp_journal
    WHERE user_id = ${userId} AND cle LIKE 'objectif:%'
      AND (cree_le AT TIME ZONE ${FUSEAU})::date = (now() AT TIME ZONE ${FUSEAU})::date`;
  if (n >= MAX_XP_OBJECTIFS_JOUR) return 0;
  return (await accorderXP(userId, `objectif:${id}`, XP_OBJECTIF)) ? XP_OBJECTIF : 0;
}

export async function terminerObjectif(userId, id) {
  const [o] = await sql`UPDATE objectifs_perso SET termine_le = now() WHERE id = ${Number(id) || 0} AND user_id = ${userId} AND termine_le IS NULL RETURNING id`;
  return o ? { xp: await recompenser(userId, o.id) } : null;
}

export async function listerObjectifs(userId) {
  const finis = await sql`
    UPDATE objectifs_perso o SET termine_le = now()
    WHERE o.user_id = ${userId} AND o.termine_le IS NULL AND o.tome <> '' AND o.page_no <> ''
      AND EXISTS (SELECT 1 FROM pages p WHERE p.user_id = ${userId} AND lower(trim(p.tome)) = lower(trim(o.tome))
                    AND trim(o.page_no) = ANY(string_to_array(trim(p.page_no), '-')) AND p.created_at >= o.cree_le)
    RETURNING o.id`;
  for (const f of finis) await recompenser(userId, f.id);
  return sql`
    SELECT id, texte, tome, page_no, cree_le, termine_le FROM objectifs_perso
    WHERE user_id = ${userId} AND (termine_le IS NULL OR termine_le > now() - interval '30 days')
    ORDER BY termine_le IS NOT NULL, termine_le DESC, cree_le DESC`;
}
