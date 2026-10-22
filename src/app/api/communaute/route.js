import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { mesTypesVisibles } from '@/lib/visibilite';
import { ajouterCodes } from '@/lib/palettesServeur';
import { VALEURS_TYPES } from '@/lib/typesColoriage';

export const dynamic = 'force-dynamic';


// Coloriages publiés.
//  ?vue=fil&type=&avant=   : derniers coloriages publiés (20 à la fois)
//  ?vue=tomes&type=        : tomes ayant des coloriages publiés de ce type
//  ?vue=pages&tome=        : numéros de page publiés pour ce tome
//  ?vue=page&tome=&page=   : coloriages publiés d'une page, avec leurs codes
//  ?vue=fiche&id=          : un coloriage publié avec ses codes
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const vue = q.get('vue') || 'fil';
  // Seuls les types que la personne fait ou veut voir sont proposés
  const visibles = await mesTypesVisibles(user.id);
  const type = visibles.includes(q.get('type')) ? q.get('type') : null;
  const tome = String(q.get('tome') || '').slice(0, 60);
  const moi = user.id;

  if (vue === 'tomes') {
    const tomes = await sql`
      SELECT min(p.tome) AS tome, count(*)::int AS n, min(c.couverture) AS couverture
      FROM pages p LEFT JOIN tome_catalog c ON lower(c.nom) = lower(p.tome)
      WHERE p.publiee AND p.tome <> '' AND p.type_coloriage = ANY(${type ? [type] : visibles})
      GROUP BY lower(p.tome) ORDER BY min(p.tome)`;
    return NextResponse.json({ tomes });
  }

  if (vue === 'pages') {
    const pages = await sql`
      SELECT page_no, count(*)::int AS n FROM pages
      WHERE publiee AND lower(tome) = lower(${tome}) AND page_no <> ''
      GROUP BY page_no`;
    pages.sort((a, b) => (parseInt(a.page_no, 10) || 0) - (parseInt(b.page_no, 10) || 0) || a.page_no.localeCompare(b.page_no));
    return NextResponse.json({ pages });
  }

  if (vue === 'fiche') {
    const id = q.get('id');
    if (!isId(id || '')) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    const [fiche] = await sql`
      SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime, p.codes,
           (p.user_id = ${moi}) AS mienne
      FROM pages p JOIN users u ON u.id = p.user_id
      WHERE p.publiee AND p.id = ${id}`;
    if (!fiche) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    // Palette dont s'inspire le coloriage, avec les codes de crayons et les packs utilisés
    const [pal] = await sql`
      SELECT pa.id, pa.nom, pa.couleurs, pa.packs,
             COALESCE((SELECT json_agg(trim(concat_ws(' ', mb.brand_name, mb.sub_type, mb.range_name))) FROM marker_brands mb WHERE mb.id = ANY(pa.packs)), '[]') AS noms_packs
      FROM pages p JOIN palettes pa ON pa.id = p.palette_id WHERE p.id = ${id}`;
    fiche.palette = pal ? (await ajouterCodes([pal]))[0] : null;
    // Coloriage consulté (quêtes « Première découverte », « Chasseur.se d'inspiration »)
    if (String(fiche.auteur_id) !== String(moi)) {
      await sql`INSERT INTO vues (user_id, genre, cible) VALUES (${moi}, 'fiche', ${id}) ON CONFLICT DO NOTHING`;
    }
    return NextResponse.json({ fiche });
  }

  if (vue === 'page') {
    const fiches = await sql`
      SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime, p.codes
      FROM pages p JOIN users u ON u.id = p.user_id
      WHERE p.publiee AND lower(p.tome) = lower(${tome}) AND p.page_no = ${String(q.get('page') || '')}
      ORDER BY likes DESC, p.publiee_le DESC LIMIT 50`;
    return NextResponse.json({ fiches });
  }

  // Fil : par défaut, seulement les types que la personne veut voir
  // ?suivis=1 : seulement les membres que je suis, tous types confondus
  const suivis = q.get('suivis') === '1';
  const vus = type ? [type] : visibles;
  const avant = q.get('avant') && !isNaN(Date.parse(q.get('avant'))) ? q.get('avant') : null;
  const fiches = await sql`
    SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime
    FROM pages p JOIN users u ON u.id = p.user_id
    WHERE p.publiee AND p.type_coloriage = ANY(${vus})
      AND (${avant}::timestamptz IS NULL OR p.publiee_le < ${avant}::timestamptz)
      AND (${suivis}::boolean IS NOT TRUE OR p.user_id IN (SELECT suivi FROM abonnements WHERE suiveur = ${moi}))
    ORDER BY p.publiee_le DESC LIMIT 20`;
  return NextResponse.json({ fiches });
}

// Aimer ou ne plus aimer un coloriage publié ({ id }),
// ou publier un de ses coloriages (avec image) depuis la section Coloriages terminés ({ publier: id, type })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id, publier, type } = await req.json().catch(() => ({}));
  if (publier) {
    if (!isId(String(publier)) || !VALEURS_TYPES.includes(type)) return NextResponse.json({ error: 'Choisis le type de coloriage' }, { status: 400 });
    const maj = await sql`UPDATE pages SET publiee = true, type_coloriage = ${type}, publiee_le = COALESCE(publiee_le, now())
      WHERE id = ${publier} AND user_id = ${user.id} AND image_b64 IS NOT NULL RETURNING id`;
    if (!maj.length) return NextResponse.json({ error: 'Coloriage introuvable (il faut une photo pour le publier)' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  if (!isId(id || '')) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const [p] = await sql`SELECT 1 FROM pages WHERE id = ${id} AND publiee`;
  if (!p) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const supprime = await sql`DELETE FROM page_likes WHERE user_id = ${user.id} AND page_id = ${id} RETURNING 1`;
  if (!supprime.length) await sql`INSERT INTO page_likes (user_id, page_id) VALUES (${user.id}, ${id}) ON CONFLICT DO NOTHING`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM page_likes WHERE page_id = ${id}`;
  return NextResponse.json({ aime: !supprime.length, likes: n });
}
