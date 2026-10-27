import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CLES = ['bingo', 'epreuve', 'aventure', 'missive'];
const cleValide = (c) => (CLES.includes(String(c)) ? String(c) : null);

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const cle = cleValide(new URL(req.url).searchParams.get('cle'));
  if (!cle) return NextResponse.json({ error: 'Brouillon inconnu' }, { status: 400 });
  const [b] = await sql`SELECT donnees, maj_le FROM brouillons WHERE user_id = ${user.id} AND cle = ${cle}`;
  return NextResponse.json({ brouillon: b || null });
}

export async function PUT(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { cle, donnees } = await req.json().catch(() => ({}));
  if (!cleValide(cle) || typeof donnees !== 'object' || !donnees) return NextResponse.json({ error: 'Brouillon invalide' }, { status: 400 });
  const texte = JSON.stringify(donnees);
  if (texte.length > 200000) return NextResponse.json({ error: 'Brouillon trop lourd' }, { status: 413 });
  await sql`INSERT INTO brouillons (user_id, cle, donnees) VALUES (${user.id}, ${cle}, ${texte}::jsonb)
    ON CONFLICT (user_id, cle) DO UPDATE SET donnees = EXCLUDED.donnees, maj_le = now()`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { cle } = await req.json().catch(() => ({}));
  await sql`DELETE FROM brouillons WHERE user_id = ${user.id} AND cle = ${String(cle || '')}`;
  return NextResponse.json({ ok: true });
}
