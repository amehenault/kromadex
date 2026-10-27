import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const uid = String(user.id);
  const [catalogue, unite] = await Promise.all([
    sql`
      SELECT DISTINCT ON (mc.id) mc.color_code AS code, mc.color_name AS nom, upper(mc.hex_value) AS hex,
             mb.brand_name AS marque, mb.sub_type AS sorte
      FROM marker_colors mc JOIN marker_brands mb ON mb.id = mc.brand_id
      WHERE mc.brand_id IN (SELECT brand_id FROM user_sets WHERE user_id = ${uid})
         OR mc.id IN (SELECT color_id FROM user_markers WHERE user_id = ${uid})`,
    sql`SELECT code, '' AS nom, upper(hex) AS hex, marque, '' AS sorte FROM crayons_unite WHERE user_id = ${user.id}`,
  ]);
  return NextResponse.json({ crayons: [...catalogue, ...unite] });
}
