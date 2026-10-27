import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const id = q.get('id') || user.id;
  if (!isId(String(id))) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const membres = q.get('liste') === 'abonnements'
    ? await sql`SELECT u.id AS user_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
        FROM abonnements a JOIN users u ON u.id = a.suivi WHERE a.suiveur = ${id} ORDER BY a.cree_le DESC LIMIT 500`
    : await sql`SELECT u.id AS user_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
        FROM abonnements a JOIN users u ON u.id = a.suiveur WHERE a.suivi = ${id} ORDER BY a.cree_le DESC LIMIT 500`;
  return NextResponse.json({ membres });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!isId(String(id || '')) || String(id) === String(user.id)) return NextResponse.json({ error: 'Impossible' }, { status: 400 });
  const [cible] = await sql`SELECT 1 FROM users WHERE id = ${id}`;
  if (!cible) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  const retire = await sql`DELETE FROM abonnements WHERE suiveur = ${user.id} AND suivi = ${id} RETURNING 1`;
  if (!retire.length) await sql`INSERT INTO abonnements (suiveur, suivi) VALUES (${user.id}, ${id}) ON CONFLICT DO NOTHING`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM abonnements WHERE suivi = ${id}`;
  return NextResponse.json({ abonne: !retire.length, abonnes: n });
}
