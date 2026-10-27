import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const demande = new URL(req.url).searchParams.get('id');
  const cible = demande && isId(demande) ? demande : user.id;
  const [tomes, coffrets] = await Promise.all([
    sql`
      SELECT t.id, t.nom, t.type, t.collection, t.couverture, t.nb_pages, t.url
      FROM souhaits s JOIN tome_catalog t ON t.id = s.tome_id
      WHERE s.user_id = ${cible}
      ORDER BY s.cree_le DESC`,
    sql`
      SELECT mb.id, mb.brand_name AS marque, mb.sub_type AS sorte, mb.range_name AS gamme,
             (SELECT count(*)::int FROM marker_colors mc WHERE mc.brand_id = mb.id) AS nb_couleurs
      FROM souhaits s JOIN marker_brands mb ON mb.id = s.brand_id
      WHERE s.user_id = ${cible}
      ORDER BY s.cree_le DESC`,
  ]);
  return NextResponse.json({ tomes, coffrets });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { tomeId, brandId, action } = await req.json().catch(() => ({}));
  const tome = parseInt(tomeId, 10) || null;
  const coffret = parseInt(brandId, 10) || null;
  if (!tome === !coffret) return NextResponse.json({ error: 'Choix introuvable.' }, { status: 400 });
  if (action === 'REMOVE') {
    if (tome) await sql`DELETE FROM souhaits WHERE user_id = ${user.id} AND tome_id = ${tome}`;
    else await sql`DELETE FROM souhaits WHERE user_id = ${user.id} AND brand_id = ${coffret}`;
  } else if (tome) {
    await sql`INSERT INTO souhaits (user_id, tome_id) SELECT ${user.id}, id FROM tome_catalog WHERE id = ${tome} ON CONFLICT DO NOTHING`;
  } else {
    await sql`INSERT INTO souhaits (user_id, brand_id) SELECT ${user.id}, id FROM marker_brands WHERE id = ${coffret} ON CONFLICT DO NOTHING`;
  }
  return NextResponse.json({ success: true });
}
