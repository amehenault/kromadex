import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { exigerPoste } from '@/lib/roles';
import { traiterImage, ErreurImage } from '@/lib/images';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = await getUser();
  if (!user) return new NextResponse('Non autorisé', { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id')) || 0;
  const [a] = await sql`SELECT illustration_b64, illustration_type FROM aventures WHERE id = ${id} AND illustration_b64 IS NOT NULL`;
  if (!a) return new NextResponse('Introuvable', { status: 404 });
  return new NextResponse(Buffer.from(a.illustration_b64, 'base64'), {
    headers: { 'Content-Type': a.illustration_type, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const f = await req.formData().catch(() => null);
  const id = Number(f?.get('id')) || 0;
  const fichier = f?.get('image');
  if (!id || !fichier || typeof fichier !== 'object') return NextResponse.json({ error: 'Image manquante' }, { status: 400 });
  try {
    const img = await traiterImage(Buffer.from(await fichier.arrayBuffer()), { coteMax: 900, qualite: 82 });
    const maj = await sql`UPDATE aventures SET illustration_b64 = ${img.b64}, illustration_type = ${img.type}, illustration_maj = now() WHERE id = ${id} RETURNING id`;
    if (!maj.length) return NextResponse.json({ error: 'Aventure introuvable' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErreurImage) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  await sql`UPDATE aventures SET illustration_b64 = NULL, illustration_type = NULL, illustration_maj = now() WHERE id = ${Number(id) || 0}`;
  return NextResponse.json({ ok: true });
}
