import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

// Commentaires d'une publication de la communauté (?publication=id), avec un niveau de réponses
// (même forme que les commentaires des coloriages : le composant CommentairesFiche sert aux deux)
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const id = Number(new URL(req.url).searchParams.get('publication')) || 0;
  const commentaires = await sql`
    SELECT c.id, c.parent_id, c.texte, c.cree_le, c.user_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (c.user_id = ${profil.id} OR p.user_id = ${profil.id} OR ${['admin', 'modo'].includes(profil.role)}) AS peut_retirer,
           (c.user_id = ${profil.id}) AS mien
    FROM publication_commentaires c JOIN users u ON u.id = c.user_id JOIN publications p ON p.id = c.publication_id
    WHERE c.publication_id = ${id} ORDER BY c.cree_le ASC LIMIT 500`;
  return NextResponse.json({ commentaires });
}

// Commenter une publication, ou répondre à un commentaire ({ publicationId, texte, parentId? })
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { publicationId, texte, parentId } = await req.json().catch(() => ({}));
  const t = String(texte || '').trim().slice(0, 1000);
  if (!t) return NextResponse.json({ error: 'Écris ton commentaire' }, { status: 400 });
  const id = Number(publicationId) || 0;
  if (!(await sql`SELECT 1 FROM publications WHERE id = ${id}`).length) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  let parent = null;
  if (parentId) {
    // On répond toujours au commentaire principal (un seul niveau de réponses)
    const [c] = await sql`SELECT id, parent_id FROM publication_commentaires WHERE id = ${Number(parentId)} AND publication_id = ${id}`;
    if (!c) return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
    parent = c.parent_id || c.id;
  }
  await sql`INSERT INTO publication_commentaires (publication_id, user_id, parent_id, texte) VALUES (${id}, ${profil.id}, ${parent}, ${t})`;
  return NextResponse.json({ ok: true });
}

// Retirer un commentaire : le sien, ceux reçus sur sa publication, ou n'importe lequel pour l'admin et les Sentinelles
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  if (['admin', 'modo'].includes(profil.role)) await sql`DELETE FROM publication_commentaires WHERE id = ${Number(id) || 0}`;
  else await sql`DELETE FROM publication_commentaires c USING publications p
    WHERE c.id = ${Number(id) || 0} AND p.id = c.publication_id AND (c.user_id = ${profil.id} OR p.user_id = ${profil.id})`;
  return NextResponse.json({ ok: true });
}
