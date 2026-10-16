import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { lirePublication } from '@/lib/pages';

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const title = formData.get('title') || '';
    const tome = formData.get('tome') || '';
    const page_no = formData.get('page_no') || '';
    const memo = String(formData.get('memo') || '').slice(0, 1000);
    const codesRaw = formData.get('codes');
    const file = formData.get('image');
    const pub = lirePublication(formData);

    let codes = '[]';
    if (codesRaw) {
      try {
        const parsed = typeof codesRaw === 'string' ? JSON.parse(codesRaw) : codesRaw;
        codes = JSON.stringify(parsed);
      } catch (e) {
        codes = String(codesRaw);
      }
    }

    let base64 = null;
    let imageType = null;

    if (file && typeof file === 'object' && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64 = buffer.toString('base64');
      imageType = file.type || 'image/jpeg';
    }

    await sql`
      INSERT INTO pages (user_id, title, tome, page_no, memo, codes, image_b64, image_type, publiee, type_coloriage, publiee_le)
      VALUES (${user.id}, ${title}, ${tome}, ${page_no}, ${memo}, ${codes}::jsonb, ${base64}, ${imageType},
              ${pub.publiee}, ${pub.type}, ${pub.publiee ? new Date().toISOString() : null})
    `;

    // Un tome masqué redevient visible dès qu'on y enregistre une fiche
    if (tome) await sql`DELETE FROM user_tomes_masques WHERE user_id = ${String(user.id)} AND lower(nom) = lower(${tome})`;
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur lors de la création :', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}