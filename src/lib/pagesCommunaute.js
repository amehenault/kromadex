import { sql } from '@/lib/db';

// Un coloriage peut être vu, aimé et commenté dans la communauté s'il est publié,
// ou s'il apparaît dans les participations aux activités (mêmes règles que lib/participations.js).
export async function accesCommunaute(pageId) {
  const [p] = await sql`
    SELECT p.publiee,
      (EXISTS (SELECT 1 FROM bingo_cases c WHERE c.page_id = p.id AND c.valide IS NOT FALSE)
        OR EXISTS (SELECT 1 FROM aventure_soumissions s WHERE s.page_id = p.id AND s.reussie)
        OR EXISTS (SELECT 1 FROM defi_participations dp JOIN defis d ON d.id = dp.defi_id WHERE dp.page_id = p.id AND (d.genre = 'groupe' OR d.cloture))
        OR EXISTS (SELECT 1 FROM defi_envois e JOIN defis d ON d.id = e.defi_id WHERE e.page_id = p.id AND (d.genre = 'groupe' OR d.cloture))) AS activite
    FROM pages p WHERE p.id = ${pageId} AND p.image_b64 IS NOT NULL`;
  if (!p || !(p.publiee || p.activite)) return null;
  return p;
}
