import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { isId } from '@/lib/pages';

// Commentaires d'un coloriage publié (?page=id), dans l'ordre, avec les réponses
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('page');
  if (!isId(String(id || ''))) return NextResponse.json({ commentaires: [] });
  const commentaires = await sql`
    SELECT c.id, c.parent_id, c.texte, c.cree_le, c.user_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (c.user_id = ${user.id} OR p.user_id = ${user.id}) AS peut_retirer
    FROM page_commentaires c JOIN users u ON u.id = c.user_id JOIN pages p ON p.id = c.page_id AND p.publiee
    WHERE c.page_id = ${id} ORDER BY c.cree_le ASC LIMIT 500`;
  return NextResponse.json({ commentaires });
}

// Commenter un coloriage publié, ou répondre à un commentaire ({ pageId, texte, parentId? })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { pageId, texte, parentId } = await req.json().catch(() => ({}));
  const t = String(texte || '').trim().slice(0, 1000);
  if (!t) return NextResponse.json({ error: 'Écris ton commentaire' }, { status: 400 });
  if (!isId(String(pageId || ''))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const [p] = await sql`SELECT 1 FROM pages WHERE id = ${pageId} AND publiee`;
  if (!p) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  let parent = null;
  if (parentId) {
    // On répond toujours au commentaire principal (un seul niveau de réponses)
    const [c] = await sql`SELECT id, parent_id FROM page_commentaires WHERE id = ${Number(parentId)} AND page_id = ${pageId}`;
    if (!c) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
    parent = c.parent_id || c.id;
  }
  await sql`INSERT INTO page_commentaires (page_id, user_id, parent_id, texte) VALUES (${pageId}, ${user.id}, ${parent}, ${t})`;
  return NextResponse.json({ ok: true });
}

// Retirer un commentaire : le sien, ceux reçus sur son coloriage, ou n'importe lequel pour l'admin et la modo
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const profil = await getUserProfile(user.id);
  if (['admin', 'modo'].includes(profil?.role)) {
    await sql`DELETE FROM page_commentaires WHERE id = ${Number(id)}`;
  } else {
    await sql`DELETE FROM page_commentaires c USING pages p
      WHERE c.id = ${Number(id)} AND p.id = c.page_id AND (c.user_id = ${user.id} OR p.user_id = ${user.id})`;
  }
  return NextResponse.json({ ok: true });
}
