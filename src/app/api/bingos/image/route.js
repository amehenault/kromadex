import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { exigerPoste } from '@/lib/roles';
import { traiterImage, ErreurImage } from '@/lib/images';
import { NB_CASES } from '@/lib/bingos';

export const dynamic = 'force-dynamic';

const numeroCase = (v) => { const n = parseInt(v, 10); return n >= 0 && n < NB_CASES ? n : null; };

// Image de fond d'une case de bingo (?id=&case=), visible par les membres connectés
export async function GET(req) {
  const user = await getUser();
  if (!user) return new NextResponse('Non autorisé', { status: 401 });
  const q = new URL(req.url).searchParams;
  const n = numeroCase(q.get('case'));
  if (n === null) return new NextResponse('Case invalide', { status: 400 });
  const [i] = await sql`SELECT image_b64, type FROM bingo_images WHERE bingo_id = ${Number(q.get('id')) || 0} AND case_no = ${n}`;
  if (!i) return new NextResponse('Introuvable', { status: 404 });
  return new NextResponse(Buffer.from(i.image_b64, 'base64'), {
    headers: { 'Content-Type': i.type, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}

// Invocatrice ou ménestrelle (pour ses bingos) : poser l'image de fond d'une case (formulaire : bingoId, case, image).
// L'image est vérifiée, réduite à 600 pixels et réencodée en WebP.
export async function POST(req) {
  const { profil, erreur } = await exigerPoste('admin', 'menestrel');
  if (erreur) return erreur;
  const f = await req.formData().catch(() => null);
  const bingoId = Number(f?.get('bingoId')) || 0;
  const n = numeroCase(f?.get('case'));
  const fichier = f?.get('image');
  if (!bingoId || n === null || !fichier || typeof fichier !== 'object') return NextResponse.json({ error: 'Image ou case manquante' }, { status: 400 });
  const [b] = await sql`SELECT 1 FROM bingos WHERE id = ${bingoId} AND (${profil.role === 'admin'} OR createur = ${profil.id})`;
  if (!b) return NextResponse.json({ error: 'Bingo introuvable' }, { status: 404 });
  try {
    const img = await traiterImage(Buffer.from(await fichier.arrayBuffer()), { coteMax: 600, qualite: 80 });
    await sql`
      INSERT INTO bingo_images (bingo_id, case_no, image_b64, type, maj_le) VALUES (${bingoId}, ${n}, ${img.b64}, ${img.type}, now())
      ON CONFLICT (bingo_id, case_no) DO UPDATE SET image_b64 = EXCLUDED.image_b64, type = EXCLUDED.type, maj_le = now()`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErreurImage) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}

// Invocatrice ou ménestrelle (pour ses bingos) : retirer l'image de fond d'une case
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste('admin', 'menestrel');
  if (erreur) return erreur;
  const { bingoId, case: c } = await req.json().catch(() => ({}));
  const n = numeroCase(c);
  if (n === null) return NextResponse.json({ error: 'Case invalide' }, { status: 400 });
  await sql`DELETE FROM bingo_images i USING bingos b
    WHERE i.bingo_id = ${Number(bingoId) || 0} AND i.case_no = ${n} AND b.id = i.bingo_id
      AND (${profil.role === 'admin'} OR b.createur = ${profil.id})`;
  return NextResponse.json({ ok: true });
}
