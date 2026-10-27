import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const crayons = await sql`
    SELECT mc.id, mc.color_code AS code, mc.color_name AS nom, mc.hex_value AS hex, mb.id AS pack,
           trim(concat_ws(' ', mb.brand_name, mb.sub_type, mb.range_name)) AS nom_pack
    FROM crayons_a_racheter r
    JOIN marker_colors mc ON mc.id = r.color_id
    JOIN marker_brands mb ON mb.id = mc.brand_id
    WHERE r.user_id = ${user.id}
    ORDER BY mb.brand_name, mb.range_name, mc.id`;
  return NextResponse.json({ crayons });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { colorId, action } = await req.json().catch(() => ({}));
  const id = parseInt(colorId, 10);
  if (!id) return NextResponse.json({ error: 'Crayon introuvable.' }, { status: 400 });
  if (action === 'REMOVE') {
    await sql`DELETE FROM crayons_a_racheter WHERE user_id = ${user.id} AND color_id = ${id}`;
  } else {
    const [c] = await sql`SELECT id FROM marker_colors WHERE id = ${id}`;
    if (!c) return NextResponse.json({ error: 'Crayon introuvable.' }, { status: 404 });
    await sql`INSERT INTO crayons_a_racheter (user_id, color_id) VALUES (${user.id}, ${id}) ON CONFLICT DO NOTHING`;
  }
  return NextResponse.json({ success: true });
}
