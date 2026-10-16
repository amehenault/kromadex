import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const TYPES = ['mystere', 'cozy', 'autre'];

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
  const type = TYPES.includes(q.get('type')) ? q.get('type') : null;
  const tome = String(q.get('tome') || '').slice(0, 60);
  const moi = user.id;

  if (vue === 'tomes') {
    const tomes = await sql`
      SELECT min(p.tome) AS tome, count(*)::int AS n, min(c.couverture) AS couverture
      FROM pages p LEFT JOIN tome_catalog c ON lower(c.nom) = lower(p.tome)
      WHERE p.publiee AND p.tome <> '' AND (${type}::text IS NULL OR p.type_coloriage = ${type})
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
           u.id AS auteur_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime, p.codes
      FROM pages p JOIN users u ON u.id = p.user_id
      WHERE p.publiee AND p.id = ${id}`;
    if (!fiche) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ fiche });
  }

  if (vue === 'page') {
    const fiches = await sql`
      SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime, p.codes
      FROM pages p JOIN users u ON u.id = p.user_id
      WHERE p.publiee AND lower(p.tome) = lower(${tome}) AND p.page_no = ${String(q.get('page') || '')}
      ORDER BY likes DESC, p.publiee_le DESC LIMIT 50`;
    return NextResponse.json({ fiches });
  }

  // Fil : par défaut, seulement les types que la personne veut voir
  const [prefs] = await sql`SELECT types_vus FROM users WHERE id = ${moi}`;
  const vus = type ? [type] : prefs?.types_vus?.length ? prefs.types_vus : TYPES;
  const avant = q.get('avant') && !isNaN(Date.parse(q.get('avant'))) ? q.get('avant') : null;
  const fiches = await sql`
    SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime
    FROM pages p JOIN users u ON u.id = p.user_id
    WHERE p.publiee AND p.type_coloriage = ANY(${vus})
      AND (${avant}::timestamptz IS NULL OR p.publiee_le < ${avant}::timestamptz)
    ORDER BY p.publiee_le DESC LIMIT 20`;
  return NextResponse.json({ fiches });
}

// Aimer ou ne plus aimer un coloriage publié ({ id })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!isId(id || '')) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const [p] = await sql`SELECT 1 FROM pages WHERE id = ${id} AND publiee`;
  if (!p) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const supprime = await sql`DELETE FROM page_likes WHERE user_id = ${user.id} AND page_id = ${id} RETURNING 1`;
  if (!supprime.length) await sql`INSERT INTO page_likes (user_id, page_id) VALUES (${user.id}, ${id}) ON CONFLICT DO NOTHING`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM page_likes WHERE page_id = ${id}`;
  return NextResponse.json({ aime: !supprime.length, likes: n });
}
