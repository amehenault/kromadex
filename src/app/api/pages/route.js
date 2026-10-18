import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { lirePublication, lirePalette } from '@/lib/pages';
import { accorderSerie } from '@/lib/series';
import { accorderXPColoriage } from '@/lib/xpColoriage';
import { imageDuFormulaire, ErreurImage, reponseErreurImage, COTE } from '@/lib/images';

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
    const paletteId = await lirePalette(formData, user.id);

    let codes = '[]';
    if (codesRaw) {
      try {
        const parsed = typeof codesRaw === 'string' ? JSON.parse(codesRaw) : codesRaw;
        codes = JSON.stringify(parsed);
      } catch (e) {
        codes = String(codesRaw);
      }
    }

    // Image vérifiée et réencodée (refusée si ce n'est pas une vraie image JPG, PNG ou WebP)
    const image = await imageDuFormulaire(file, { coteMax: COTE.coloriage });
    const base64 = image?.b64 ?? null;
    const imageType = image?.type ?? null;

    const [nouvelle] = await sql`
      INSERT INTO pages (user_id, title, tome, page_no, memo, codes, image_b64, image_type, publiee, type_coloriage, publiee_le, palette_id)
      VALUES (${user.id}, ${title}, ${tome}, ${page_no}, ${memo}, ${codes}::jsonb, ${base64}, ${imageType},
              ${pub.publiee}, ${pub.type}, ${pub.publiee ? new Date().toISOString() : null}, ${paletteId})
      RETURNING id
    `;

    // Les XP du coloriage sont donnés seulement avec une image (une fiche sans image reste un brouillon)
    if (image) await accorderXPColoriage(user.id, nouvelle.id).catch(() => {});

    // Un tome masqué redevient visible dès qu'on y enregistre une fiche
    if (tome) await sql`DELETE FROM user_tomes_masques WHERE user_id = ${String(user.id)} AND lower(nom) = lower(${tome})`;
    // Série de coloriage : bonus d'XP à chaque tranche de 7 jours consécutifs
    await accorderSerie(user.id, 'coloriage').catch(() => {});
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ErreurImage) return reponseErreurImage(err);
    console.error('Erreur lors de la création :', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}