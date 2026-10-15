import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const user = await getUser();

  if (!user || !name) return new Response(null, { status: 404 });

  const r = await sql`
    SELECT image_b64, image_type 
    FROM tome_covers 
    WHERE user_id = ${user.id} AND tome_name = ${name}
  `;

  if (!r.length || !r[0].image_b64) return new Response(null, { status: 404 });

  return new Response(Buffer.from(r[0].image_b64, 'base64'), {
    headers: {
      'Content-Type': r[0].image_type || 'image/jpeg',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const tomeName = formData.get('tome');
    const file = formData.get('image');

    if (!tomeName || !file || typeof file !== 'object') {
      return NextResponse.json({ error: 'Fichier ou nom de tome invalide' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const imageType = file.type || 'image/jpeg';

    await sql`
      INSERT INTO tome_covers (user_id, tome_name, image_b64, image_type, updated_at)
      VALUES (${user.id}, ${tomeName}, ${base64}, ${imageType}, NOW())
      ON CONFLICT (user_id, tome_name) 
      DO UPDATE SET image_b64 = ${base64}, image_type = ${imageType}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur sauvegarde couverture tome :', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}