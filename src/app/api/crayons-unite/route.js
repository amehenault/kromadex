import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_CRAYONS = 500;
const texte = (v, n) => String(v ?? '').trim().slice(0, n);
const estHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const crayons = await sql`SELECT id, marque, code, hex FROM crayons_unite WHERE user_id = ${user.id} ORDER BY lower(marque), code`;
  return NextResponse.json({ crayons });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const marque = texte(b.marque, 60);
  const code = texte(b.code, 40);
  const hex = estHex(b.hex) ? b.hex.toUpperCase() : '';
  if (!marque || !code) return NextResponse.json({ error: 'Écris la marque et le code de la couleur' }, { status: 400 });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM crayons_unite WHERE user_id = ${user.id}`;
  if (n >= MAX_CRAYONS) return NextResponse.json({ error: `Tu as déjà ${MAX_CRAYONS} crayons à l’unité` }, { status: 429 });
  const [c] = await sql`INSERT INTO crayons_unite (user_id, marque, code, hex) VALUES (${user.id}, ${marque}, ${code}, ${hex}) RETURNING id, marque, code, hex`;
  return NextResponse.json({ ok: true, crayon: c });
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  await sql`DELETE FROM crayons_unite WHERE id = ${Number(id) || 0} AND user_id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
