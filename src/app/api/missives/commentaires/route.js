import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

// Commentaires d'une missive (?missive=id)
export async function GET(req) {
  const { erreur } = await exigerPoste();
  if (erreur) return erreur;
  const id = Number(new URL(req.url).searchParams.get('missive'));
  const commentaires = await sql`
    SELECT c.id, c.texte, c.cree_le, c.user_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
    FROM missive_commentaires c JOIN users u ON u.id = c.user_id
    WHERE c.missive_id = ${id} ORDER BY c.cree_le ASC LIMIT 300`;
  return NextResponse.json({ commentaires });
}

// Commenter, seulement si la missive est publiée et que les commentaires sont permis
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { missiveId, texte } = await req.json().catch(() => ({}));
  const t = String(texte || '').trim().slice(0, 1000);
  if (!t) return NextResponse.json({ error: 'Écris ton commentaire' }, { status: 400 });
  const [m] = await sql`SELECT commentaires FROM missives WHERE id = ${Number(missiveId)} AND statut = 'publiee'`;
  if (!m) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (!m.commentaires) return NextResponse.json({ error: 'Les commentaires sont fermés pour cette missive' }, { status: 403 });
  await sql`INSERT INTO missive_commentaires (missive_id, user_id, texte) VALUES (${Number(missiveId)}, ${profil.id}, ${t})`;
  return NextResponse.json({ ok: true });
}

// Retirer un commentaire : le sien, ou n'importe lequel pour l'admin et la modo
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  if (['admin', 'modo'].includes(profil.role)) await sql`DELETE FROM missive_commentaires WHERE id = ${Number(id)}`;
  else await sql`DELETE FROM missive_commentaires WHERE id = ${Number(id)} AND user_id = ${profil.id}`;
  return NextResponse.json({ ok: true });
}
