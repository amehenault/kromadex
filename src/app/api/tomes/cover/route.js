import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { imageDuFormulaire, ErreurImage, reponseErreurImage, enTetesImage, formatReel, COTE } from '@/lib/images';

export const dynamic = 'force-dynamic';

const DEFAULT_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="none"><rect width="300" height="400" fill="%239BD7C6"/><rect x="20" y="20" width="260" height="360" rx="12" fill="%23DEF2EC" stroke="%230E322A" stroke-width="3"/><text x="150" y="240" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230E322A" text-anchor="middle">KROMADEX</text><text x="150" y="265" font-family="sans-serif" font-size="13" fill="%23358B76" text-anchor="middle">Aucune couverture</text></svg>`;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    // format=img : renvoie l'image elle-même (pour <img src>), sinon du JSON
    const enImage = searchParams.get('format') === 'img';
    const user = await getUser();

    if (user && name) {
      const userIdStr = String(user.id);
      const r = await sql`
        SELECT image_b64
        FROM tome_covers
        WHERE user_id = ${userIdStr} AND tome_name = ${name}
      `;

      if (r.length && r[0].image_b64) {
        // Type déduit du contenu réel : un ancien fichier qui n'est pas une vraie image n'est jamais servi
        const contenu = Buffer.from(r[0].image_b64, 'base64');
        const format = formatReel(contenu);
        if (format) {
          if (enImage) return new NextResponse(contenu, { headers: enTetesImage(contenu, 'private, no-cache') });
          return NextResponse.json({ cover: `data:image/${format};base64,${r[0].image_b64}` });
        }
      }

      // Pas de couverture personnelle : celle du catalogue si le nom correspond à un tome connu
      const c = await sql`SELECT couverture FROM tome_catalog WHERE lower(nom) = lower(${name}) LIMIT 1`;
      if (c.length && c[0].couverture) {
        if (enImage) return NextResponse.redirect(new URL(c[0].couverture, req.url));
        return NextResponse.json({ cover: c[0].couverture });
      }
    }

    if (enImage) return new NextResponse(null, { status: 404 });
    return NextResponse.json({ cover: DEFAULT_COVER_SVG });
  } catch (err) {
    return NextResponse.json({ cover: DEFAULT_COVER_SVG });
  }
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const tomeName = String(formData.get('tome') || '').trim().slice(0, 120);
    // Image vérifiée et réencodée (refusée si ce n'est pas une vraie image JPG, PNG ou WebP)
    const image = await imageDuFormulaire(formData.get('image'), { coteMax: COTE.couverture });
    if (!tomeName || !image) return NextResponse.json({ error: 'Fichier invalide' }, { status: 400 });
    const base64 = image.b64;
    const imageType = image.type;
    const userIdStr = String(user.id);

    await sql`
      INSERT INTO tome_covers (user_id, tome_name, image_b64, image_type, updated_at)
      VALUES (${userIdStr}, ${tomeName}, ${base64}, ${imageType}, NOW())
      ON CONFLICT (user_id, tome_name) 
      DO UPDATE SET image_b64 = ${base64}, image_type = ${imageType}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true, cover: `data:${imageType};base64,${base64}` });
  } catch (err) {
    if (err instanceof ErreurImage) return reponseErreurImage(err);
    console.error('Erreur sauvegarde couverture :', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}