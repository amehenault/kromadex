import { sql } from '@/lib/db';
import { FUSEAU } from '@/lib/series';

// Crayons les plus utilisés, tirés des codes couleurs des coloriages.
// Un crayon compte une fois par coloriage, même s'il sert à plusieurs symboles.
export async function crayonsLesPlusUtilises(userId, { depuis = null, jusqu = null, limite = 10 } = {}) {
  return sql`
    WITH lignes AS (
      SELECT DISTINCT p.id AS page_id, lower(regexp_replace(trim(r->>'num'), '\\s+', ' ', 'g')) AS cle, trim(r->>'num') AS num, r->>'hex' AS hex
      FROM pages p
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.codes) = 'array' THEN p.codes ELSE '[]'::jsonb END) g
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(g->'rows') = 'array' THEN g->'rows' ELSE '[]'::jsonb END) r
      WHERE p.user_id = ${userId} AND trim(COALESCE(r->>'num', '')) <> ''
        AND (${depuis}::date IS NULL OR (p.created_at AT TIME ZONE ${FUSEAU})::date >= ${depuis}::date)
        AND (${jusqu}::date IS NULL OR (p.created_at AT TIME ZONE ${FUSEAU})::date < ${jusqu}::date)
    )
    SELECT min(num) AS num, max(hex) FILTER (WHERE hex ~* '^#[0-9a-f]{6}$') AS hex, count(DISTINCT page_id)::int AS n
    FROM lignes GROUP BY cle ORDER BY n DESC, min(num) LIMIT ${limite}`;
}
