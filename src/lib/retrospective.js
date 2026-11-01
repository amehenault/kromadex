import { sql } from '@/lib/db';
import { FUSEAU } from '@/lib/series';
import { crayonsLesPlusUtilises } from '@/lib/statsCrayons';

// La rétrospective est mise en avant en décembre, et encore en janvier pour l'année qui vient de finir.
export function anneeRetrospective(aujourdhui) {
  const annee = Number(aujourdhui.slice(0, 4));
  const mois = Number(aujourdhui.slice(5, 7));
  if (mois === 12) return annee;
  if (mois === 1) return annee - 1;
  return null;
}

export async function retrospective(userId, annee) {
  const debut = `${annee}-01-01`, fin = `${annee + 1}-01-01`;
  const [[totaux], [tome], [mois], [crayon]] = await Promise.all([
    sql`SELECT count(*)::int AS coloriages,
               count(DISTINCT (created_at AT TIME ZONE ${FUSEAU})::date)::int AS jours,
               count(*) FILTER (WHERE publiee)::int AS publies
        FROM pages WHERE user_id = ${userId}
          AND (created_at AT TIME ZONE ${FUSEAU})::date >= ${debut}::date AND (created_at AT TIME ZONE ${FUSEAU})::date < ${fin}::date`,
    sql`SELECT min(tome) AS tome, count(*)::int AS n FROM pages
        WHERE user_id = ${userId} AND tome <> ''
          AND (created_at AT TIME ZONE ${FUSEAU})::date >= ${debut}::date AND (created_at AT TIME ZONE ${FUSEAU})::date < ${fin}::date
        GROUP BY lower(tome) ORDER BY n DESC, min(tome) LIMIT 1`,
    sql`SELECT to_char(date_trunc('month', created_at AT TIME ZONE ${FUSEAU}), 'YYYY-MM-01') AS mois, count(*)::int AS n FROM pages
        WHERE user_id = ${userId}
          AND (created_at AT TIME ZONE ${FUSEAU})::date >= ${debut}::date AND (created_at AT TIME ZONE ${FUSEAU})::date < ${fin}::date
        GROUP BY 1 ORDER BY n DESC, 1 LIMIT 1`,
    crayonsLesPlusUtilises(userId, { depuis: debut, jusqu: fin, limite: 1 }),
  ]);
  return { annee, ...totaux, tome: tome || null, mois: mois || null, crayon: crayon || null };
}
