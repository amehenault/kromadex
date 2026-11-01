import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export const dynamic = 'force-dynamic';

const MAX_ALBUMS = 50;
const non = (message, status = 400) => NextResponse.json({ error: message }, { status });

async function lister(proprietaire, moi) {
  const albums = await sql`SELECT id, nom FROM albums WHERE user_id = ${proprietaire} ORDER BY cree_le DESC`;
  if (!albums.length) return [];
  const pages = await sql`
    SELECT ap.album_id, p.id, p.title, p.tome, p.page_no, OCTET_LENGTH(p.image_b64) AS img_size, p.publiee
    FROM album_pages ap JOIN pages p ON p.id = ap.page_id
    WHERE ap.album_id = ANY(${albums.map((a) => a.id)}) AND p.image_b64 IS NOT NULL AND (${moi} OR p.publiee)
    ORDER BY ap.ajoute_le DESC`;
  return albums
    .map((a) => ({ ...a, pages: pages.filter((p) => p.album_id === a.id) }))
    .filter((a) => moi || a.pages.length);
}

export async function GET(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const id = new URL(req.url).searchParams.get('id') || user.id;
  if (!isId(String(id))) return non('Introuvable', 404);
  return NextResponse.json({ albums: await lister(id, String(id) === String(user.id)) });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const b = await req.json().catch(() => ({}));
  const albumId = Number(b.albumId) || 0;

  if (b.action === 'creer') {
    const nom = String(b.nom || '').trim().slice(0, 60);
    if (!nom) return non('Donne un nom à ton album');
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM albums WHERE user_id = ${user.id}`;
    if (n >= MAX_ALBUMS) return non(`Tu as déjà ${MAX_ALBUMS} albums`);
    await sql`INSERT INTO albums (user_id, nom) VALUES (${user.id}, ${nom})`;
  } else {
    const [a] = await sql`SELECT id FROM albums WHERE id = ${albumId} AND user_id = ${user.id}`;
    if (!a) return non('Album introuvable', 404);
    if (b.action === 'renommer') {
      const nom = String(b.nom || '').trim().slice(0, 60);
      if (!nom) return non('Donne un nom à ton album');
      await sql`UPDATE albums SET nom = ${nom} WHERE id = ${a.id}`;
    } else if (b.action === 'ajouter' || b.action === 'retirer') {
      if (!isId(String(b.pageId || ''))) return non('Coloriage introuvable', 404);
      const [p] = await sql`SELECT id FROM pages WHERE id = ${b.pageId} AND user_id = ${user.id}`;
      if (!p) return non('Coloriage introuvable', 404);
      if (b.action === 'ajouter') await sql`INSERT INTO album_pages (album_id, page_id) VALUES (${a.id}, ${p.id}) ON CONFLICT DO NOTHING`;
      else await sql`DELETE FROM album_pages WHERE album_id = ${a.id} AND page_id = ${p.id}`;
    } else return non('Action inconnue');
  }
  return NextResponse.json({ albums: await lister(user.id, true) });
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const { albumId } = await req.json().catch(() => ({}));
  await sql`DELETE FROM albums WHERE id = ${Number(albumId) || 0} AND user_id = ${user.id}`;
  return NextResponse.json({ albums: await lister(user.id, true) });
}
