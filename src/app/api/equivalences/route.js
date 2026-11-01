import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { distanceCouleurs } from '@/lib/palettes';
import { familleCrayon, NOMS_FAMILLES } from '@/lib/famillesCrayons';

export const dynamic = 'force-dynamic';

const DISTANCE_MAX = 20;
const nomPack = (b) => [b.brand_name, b.sub_type, b.range_name].filter(Boolean).join(' ');

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const marques = await sql`SELECT id, brand_name, sub_type, range_name FROM marker_brands WHERE created_by IS NULL`;
  const famille = Object.fromEntries(marques.map((b) => [b.id, familleCrayon(b.sub_type, b.brand_name)]));

  const recherche = String(q.get('q') || '').trim().slice(0, 40);
  if (recherche) {
    const motif = `%${recherche.replace(/[%_\\]/g, '')}%`;
    const crayons = await sql`
      SELECT mc.id, mc.color_code AS code, mc.color_name AS nom, upper(mc.hex_value) AS hex, mc.brand_id
      FROM marker_colors mc
      WHERE mc.brand_id = ANY(${marques.filter((b) => famille[b.id]).map((b) => b.id)}) AND mc.hex_value ~* '^#[0-9a-f]{6}$'
        AND (mc.color_code ILIKE ${motif} OR mc.color_name ILIKE ${motif}
             OR EXISTS (SELECT 1 FROM marker_brands b WHERE b.id = mc.brand_id AND concat_ws(' ', b.brand_name, b.sub_type, b.range_name, mc.color_code) ILIKE ${motif}))
      ORDER BY mc.color_code LIMIT 40`;
    const parId = Object.fromEntries(marques.map((b) => [b.id, b]));
    return NextResponse.json({ crayons: crayons.map((c) => ({ ...c, pack: nomPack(parId[c.brand_id]) })) });
  }

  const id = Number(q.get('color')) || 0;
  const [source] = await sql`SELECT id, color_code AS code, color_name AS nom, upper(hex_value) AS hex, brand_id FROM marker_colors WHERE id = ${id}`;
  if (!source || !/^#[0-9A-F]{6}$/.test(source.hex || '') || !famille[source.brand_id]) {
    return NextResponse.json({ error: 'Crayon introuvable ou sans couleur connue' }, { status: 404 });
  }
  const fam = famille[source.brand_id];
  const marqueSource = marques.find((b) => b.id === source.brand_id);
  const cibles = marques.filter((b) => famille[b.id] === fam && b.brand_name !== marqueSource.brand_name);
  const miens = q.get('miens') === '1'
    ? new Set((await sql`SELECT brand_id FROM user_sets WHERE user_id = ${String(user.id)}`).map((r) => r.brand_id))
    : null;
  const candidats = await sql`
    SELECT id, color_code AS code, color_name AS nom, upper(hex_value) AS hex, brand_id FROM marker_colors
    WHERE brand_id = ANY(${cibles.filter((b) => !miens || miens.has(b.id)).map((b) => b.id)}) AND hex_value ~* '^#[0-9a-f]{6}$'`;

  const meilleurs = new Map();
  for (const c of candidats) {
    const distance = distanceCouleurs(source.hex, c.hex);
    if (distance > DISTANCE_MAX) continue;
    const cle = marques.find((b) => b.id === c.brand_id).brand_name;
    if (!meilleurs.has(cle) || meilleurs.get(cle).distance > distance) meilleurs.set(cle, { ...c, distance });
  }
  const parId = Object.fromEntries(marques.map((b) => [b.id, b]));
  const equivalences = [...meilleurs.values()].sort((a, b) => a.distance - b.distance).slice(0, 15)
    .map((c) => ({ ...c, distance: Math.round(c.distance * 10) / 10, pack: nomPack(parId[c.brand_id]) }));
  return NextResponse.json({ source: { ...source, pack: nomPack(marqueSource) }, famille: NOMS_FAMILLES[fam], equivalences });
}
