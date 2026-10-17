import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TYPES = ['image/jpeg', 'image/webp', 'image/png'];

// Photo de profil : ?id=<membre> (par défaut, la personne connectée)
export async function GET(req) {
  const user = await getUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const id = new URL(req.url).searchParams.get('id') || user.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 400 });
  const [r] = await sql`SELECT avatar_b64, avatar_type FROM users WHERE id = ${id}`;
  if (!r?.avatar_b64) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(r.avatar_b64, 'base64'), {
    headers: { 'Content-Type': r.avatar_type, 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
}

// Reçoit l'image déjà recadrée et réduite par le téléphone ({ type, b64 })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { type, b64 } = await req.json().catch(() => ({}));
  if (!TYPES.includes(type) || typeof b64 !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(b64)) {
    return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
  }
  if (b64.length > 400_000) return NextResponse.json({ error: 'Image trop lourde' }, { status: 413 });
  await sql`UPDATE users SET avatar_b64 = ${b64}, avatar_type = ${type}, avatar_maj = now() WHERE id = ${user.id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await sql`UPDATE users SET avatar_b64 = NULL, avatar_type = NULL, avatar_maj = now() WHERE id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
