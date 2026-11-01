import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { listerObjectifs, terminerObjectif, MAX_OBJECTIFS_ACTIFS } from '@/lib/objectifs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json({ objectifs: await listerObjectifs(user.id) });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const texte = String(b.texte || '').trim().slice(0, 200);
  const tome = String(b.tome || '').trim().slice(0, 60);
  const page = String(b.page_no || '').trim().slice(0, 10);
  if (!texte && !(tome && page)) return NextResponse.json({ error: 'Écris ton objectif ou choisis un tome et une page' }, { status: 400 });
  if (page && !/^\d+$/.test(page)) return NextResponse.json({ error: 'Le numéro de page doit être un nombre' }, { status: 400 });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM objectifs_perso WHERE user_id = ${user.id} AND termine_le IS NULL`;
  if (n >= MAX_OBJECTIFS_ACTIFS) return NextResponse.json({ error: `Tu as déjà ${MAX_OBJECTIFS_ACTIFS} objectifs en cours` }, { status: 400 });
  await sql`INSERT INTO objectifs_perso (user_id, texte, tome, page_no) VALUES (${user.id}, ${texte}, ${tome}, ${tome ? page : ''})`;
  return NextResponse.json({ objectifs: await listerObjectifs(user.id) });
}

export async function PATCH(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const r = await terminerObjectif(user.id, id);
  if (!r) return NextResponse.json({ error: 'Objectif introuvable' }, { status: 404 });
  return NextResponse.json({ ...r, objectifs: await listerObjectifs(user.id) });
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  await sql`DELETE FROM objectifs_perso WHERE id = ${Number(id) || 0} AND user_id = ${user.id}`;
  return NextResponse.json({ objectifs: await listerObjectifs(user.id) });
}
