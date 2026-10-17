import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { estHex, MIN_COULEURS, MAX_COULEURS } from '@/lib/palettes';

// ?vue=crayons : mes crayons avec leur couleur (sets possédés et crayons à l'unité)
// ?vue=mes : mes palettes
// ?vue=communaute : palettes partagées par la communauté, les plus aimées en premier
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const vue = new URL(req.url).searchParams.get('vue');
  const uid = String(profil.id);

  if (vue === 'crayons') {
    const crayons = await sql`
      SELECT DISTINCT ON (mc.id) mc.id, mc.color_code AS code, mc.color_name AS nom, upper(mc.hex_value) AS hex,
             mb.brand_name AS marque, mb.range_name AS gamme
      FROM marker_colors mc JOIN marker_brands mb ON mb.id = mc.brand_id
      WHERE mc.hex_value ~* '^#[0-9a-f]{6}$'
        AND (mc.brand_id IN (SELECT brand_id FROM user_sets WHERE user_id = ${uid})
             OR mc.id IN (SELECT color_id FROM user_markers WHERE user_id = ${uid}))`;
    return NextResponse.json({ crayons });
  }

  const palettes = await sql`
    SELECT p.id, p.nom, p.couleurs, p.partagee, p.cree_le, p.user_id AS auteur_id, u.pseudo, u.name,
           (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM palette_likes l WHERE l.palette_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM palette_likes l WHERE l.palette_id = p.id AND l.user_id = ${profil.id}) AS aime
    FROM palettes p JOIN users u ON u.id = p.user_id
    WHERE ${vue === 'communaute'} AND p.partagee OR ${vue !== 'communaute'} AND p.user_id = ${profil.id}
    ORDER BY ${vue === 'communaute'} DESC, p.cree_le DESC LIMIT 200`;
  if (vue === 'communaute') palettes.sort((a, b) => b.likes - a.likes || new Date(b.cree_le) - new Date(a.cree_le));
  return NextResponse.json({ palettes });
}

// Créer une palette ({ nom, couleurs, partagee }) ou aimer une palette partagée ({ like: id })
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const b = await req.json().catch(() => ({}));

  if (b.like) {
    const [p] = await sql`SELECT 1 FROM palettes WHERE id = ${Number(b.like)} AND partagee`;
    if (!p) return NextResponse.json({ error: 'Palette introuvable' }, { status: 404 });
    const retire = await sql`DELETE FROM palette_likes WHERE user_id = ${profil.id} AND palette_id = ${Number(b.like)} RETURNING 1`;
    if (!retire.length) await sql`INSERT INTO palette_likes (user_id, palette_id) VALUES (${profil.id}, ${Number(b.like)}) ON CONFLICT DO NOTHING`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM palette_likes WHERE palette_id = ${Number(b.like)}`;
    return NextResponse.json({ aime: !retire.length, likes: n });
  }

  const couleurs = (Array.isArray(b.couleurs) ? b.couleurs : []).filter(estHex).map((c) => c.toUpperCase());
  if (couleurs.length < MIN_COULEURS || couleurs.length > MAX_COULEURS) {
    return NextResponse.json({ error: `Une palette a de ${MIN_COULEURS} à ${MAX_COULEURS} couleurs` }, { status: 400 });
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM palettes WHERE user_id = ${profil.id}`;
  if (n >= 200) return NextResponse.json({ error: 'Tu as déjà 200 palettes' }, { status: 429 });
  const [p] = await sql`INSERT INTO palettes (user_id, nom, couleurs, partagee)
    VALUES (${profil.id}, ${String(b.nom || '').trim().slice(0, 60)}, ${couleurs}, ${b.partagee === true}) RETURNING id`;
  return NextResponse.json({ ok: true, id: p.id });
}

// Renommer, partager ou ne plus partager une de mes palettes ({ id, nom?, partagee? })
export async function PUT(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const b = await req.json().catch(() => ({}));
  const [p] = await sql`SELECT nom, partagee FROM palettes WHERE id = ${Number(b.id)} AND user_id = ${profil.id}`;
  if (!p) return NextResponse.json({ error: 'Palette introuvable' }, { status: 404 });
  const nom = b.nom !== undefined ? String(b.nom).trim().slice(0, 60) : p.nom;
  const partagee = b.partagee !== undefined ? b.partagee === true : p.partagee;
  await sql`UPDATE palettes SET nom = ${nom}, partagee = ${partagee} WHERE id = ${Number(b.id)}`;
  return NextResponse.json({ ok: true });
}

// Supprimer une de mes palettes (l'admin et les sentinelles peuvent retirer une palette partagée)
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  if (['admin', 'modo'].includes(profil.role)) await sql`DELETE FROM palettes WHERE id = ${Number(id)} AND (user_id = ${profil.id} OR partagee)`;
  else await sql`DELETE FROM palettes WHERE id = ${Number(id)} AND user_id = ${profil.id}`;
  return NextResponse.json({ ok: true });
}
