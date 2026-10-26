import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { estHex, MIN_COULEURS, MAX_COULEURS } from '@/lib/palettes';
import { ajouterCodes } from '@/lib/palettesServeur';
import { cleValide } from '@/lib/themesPalettes';

// ?vue=crayons : mes crayons avec leur couleur et leur pack (sets possédés et crayons à l'unité), et la liste de mes packs
// ?vue=mes : mes palettes
// ?vue=communaute : palettes partagées par la communauté, les plus aimées en premier
// Chaque palette donne ses packs de crayons (noms) et les coloriages publiés qui s'en inspirent.
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const vue = new URL(req.url).searchParams.get('vue');
  const uid = String(profil.id);

  if (vue === 'crayons') {
    const [crayons, packs] = await Promise.all([
      sql`
        SELECT DISTINCT ON (mc.id) mc.id, mc.color_code AS code, mc.color_name AS nom, upper(mc.hex_value) AS hex,
               mb.id AS pack, mb.brand_name AS marque, mb.range_name AS gamme
        FROM marker_colors mc JOIN marker_brands mb ON mb.id = mc.brand_id
        WHERE mc.hex_value ~* '^#[0-9a-f]{6}$'
          AND (mc.brand_id IN (SELECT brand_id FROM user_sets WHERE user_id = ${uid})
               OR mc.id IN (SELECT color_id FROM user_markers WHERE user_id = ${uid}))`,
      sql`
        SELECT DISTINCT mb.id, mb.brand_name AS marque, mb.sub_type AS sorte, mb.range_name AS gamme
        FROM marker_brands mb
        WHERE mb.id IN (SELECT brand_id FROM user_sets WHERE user_id = ${uid})
           OR mb.id IN (SELECT mc.brand_id FROM marker_colors mc JOIN user_markers um ON um.color_id = mc.id WHERE um.user_id = ${uid})
        ORDER BY mb.brand_name, mb.range_name`,
    ]);
    return NextResponse.json({ crayons, packs });
  }

  const palettes = await sql`
    SELECT p.id, p.nom, p.couleurs, p.packs, p.partagee, p.ambiance, p.fete, p.cree_le, p.user_id AS auteur_id, u.pseudo, u.name, u.role,
           (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           COALESCE((SELECT json_agg(trim(concat_ws(' ', mb.brand_name, mb.sub_type, mb.range_name))) FROM marker_brands mb WHERE mb.id = ANY(p.packs)), '[]') AS noms_packs,
           (SELECT count(*)::int FROM palette_likes l WHERE l.palette_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM palette_likes l WHERE l.palette_id = p.id AND l.user_id = ${profil.id}) AS aime,
           COALESCE((SELECT json_agg(json_build_object('id', g.id, 'img_size', OCTET_LENGTH(g.image_b64), 'titre', g.title) ORDER BY g.publiee_le DESC)
                     FROM (SELECT * FROM pages g WHERE g.palette_id = p.id AND g.publiee AND g.image_b64 IS NOT NULL ORDER BY g.publiee_le DESC LIMIT 6) g), '[]') AS coloriages
    FROM palettes p JOIN users u ON u.id = p.user_id
    WHERE ${vue === 'communaute'} AND p.partagee OR ${vue !== 'communaute'} AND p.user_id = ${profil.id}
    ORDER BY ${vue === 'communaute'} DESC, p.cree_le DESC LIMIT 200`;
  if (vue === 'communaute') palettes.sort((a, b) => b.likes - a.likes || new Date(b.cree_le) - new Date(a.cree_le));
  return NextResponse.json({ palettes: await ajouterCodes(palettes) });
}

// Couleurs, packs, ambiance et fête d'une palette, vérifiés
function lirePalette(b) {
  const couleurs = (Array.isArray(b.couleurs) ? b.couleurs : []).filter(estHex).map((c) => c.toUpperCase());
  const packs = [...new Set((Array.isArray(b.packs) ? b.packs : []).map(Number).filter((n) => n > 0))].slice(0, 20);
  return {
    couleurs, packs, titre: String(b.nom || '').trim().slice(0, 60),
    ambiance: cleValide('ambiance', b.ambiance), fete: cleValide('fete', b.fete),
  };
}

// Créer une palette ({ nom, couleurs, packs, ambiance, fete, partagee }) ou aimer une palette partagée ({ like: id })
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

  const { couleurs, packs, titre, ambiance, fete } = lirePalette(b);
  if (couleurs.length < MIN_COULEURS || couleurs.length > MAX_COULEURS) {
    return NextResponse.json({ error: `Une palette a de ${MIN_COULEURS} à ${MAX_COULEURS} couleurs` }, { status: 400 });
  }
  // Pas deux fois la même palette (mêmes couleurs, dans le même ordre)
  const [deja] = await sql`SELECT 1 FROM palettes WHERE user_id = ${profil.id} AND couleurs = ${couleurs}::text[]`;
  if (deja) return NextResponse.json({ error: 'Tu as déjà enregistré cette palette' }, { status: 409 });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM palettes WHERE user_id = ${profil.id}`;
  if (n >= 200) return NextResponse.json({ error: 'Tu as déjà 200 palettes' }, { status: 429 });
  const [p] = await sql`INSERT INTO palettes (user_id, nom, couleurs, packs, partagee, ambiance, fete)
    VALUES (${profil.id}, ${titre}, ${couleurs}, ${packs}, ${b.partagee === true}, ${ambiance}, ${fete}) RETURNING id`;
  return NextResponse.json({ ok: true, id: p.id });
}

// Modifier une de mes palettes : titre, couleurs, packs, ambiance, fête, partage ({ id, nom?, couleurs?, packs?, ambiance?, fete?, partagee? })
export async function PUT(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const b = await req.json().catch(() => ({}));
  const [p] = await sql`SELECT nom, couleurs, packs, partagee, ambiance, fete FROM palettes WHERE id = ${Number(b.id)} AND user_id = ${profil.id}`;
  if (!p) return NextResponse.json({ error: 'Palette introuvable' }, { status: 404 });
  const lu = lirePalette({ ...b, couleurs: b.couleurs ?? p.couleurs, packs: b.packs ?? p.packs, nom: b.nom ?? p.nom,
    ambiance: b.ambiance ?? p.ambiance, fete: b.fete ?? p.fete });
  if (lu.couleurs.length < MIN_COULEURS || lu.couleurs.length > MAX_COULEURS) {
    return NextResponse.json({ error: `Une palette a de ${MIN_COULEURS} à ${MAX_COULEURS} couleurs` }, { status: 400 });
  }
  const [deja] = await sql`SELECT 1 FROM palettes WHERE user_id = ${profil.id} AND couleurs = ${lu.couleurs}::text[] AND id <> ${Number(b.id)}`;
  if (deja) return NextResponse.json({ error: 'Tu as déjà enregistré cette palette' }, { status: 409 });
  const partagee = b.partagee !== undefined ? b.partagee === true : p.partagee;
  await sql`UPDATE palettes SET nom = ${lu.titre}, couleurs = ${lu.couleurs}, packs = ${lu.packs}, partagee = ${partagee},
    ambiance = ${lu.ambiance}, fete = ${lu.fete} WHERE id = ${Number(b.id)}`;
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
