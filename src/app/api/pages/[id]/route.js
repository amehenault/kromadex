import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { lirePublication, lirePalette } from '@/lib/pages';
import { accorderXPColoriage, ajusterXPDoublePage, retirerXPColoriage } from '@/lib/xpColoriage';
import { imageDuFormulaire, ErreurImage, reponseErreurImage, COTE } from '@/lib/images';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const title = formData.get('title');
    const tome = formData.get('tome');
    const page_no = formData.get('page_no');
    const memo = String(formData.get('memo') || '').slice(0, 1000);
    const codes = formData.get('codes');
    const file = formData.get('image');
    const pub = lirePublication(formData);
    // Palette dont s'inspire le coloriage (gardée telle quelle si le champ n'est pas envoyé)
    const changePalette = formData.has('palette_id');
    const paletteId = changePalette ? await lirePalette(formData, user.id) : null;

    // Image vérifiée et réencodée (refusée si ce n'est pas une vraie image JPG, PNG ou WebP)
    const image = await imageDuFormulaire(file, { coteMax: COTE.coloriage });
    if (image) {
      const base64 = image.b64;
      const imageType = image.type;

      await sql`
        UPDATE pages 
        SET title = ${title}, 
            tome = ${tome}, 
            page_no = ${page_no},
            memo = ${memo},
            codes = ${codes},
            publiee = ${pub.publiee},
            type_coloriage = ${pub.type},
            -- la date de publication est gardée tant que la fiche reste publiée
            publiee_le = CASE WHEN ${pub.publiee} THEN COALESCE(publiee_le, now()) ELSE NULL END, 
            image_b64 = ${base64}, 
            image_type = ${imageType}
        WHERE id = ${id} AND user_id = ${user.id}
      `;
      // Première vraie image de la fiche : les XP du coloriage sont donnés à ce moment (une seule fois par fiche)
      const [p] = await sql`SELECT 1 FROM pages WHERE id = ${id} AND user_id = ${user.id}`;
      if (p) await accorderXPColoriage(user.id, id).catch(() => {});
    } else {
      await sql`
        UPDATE pages 
        SET title = ${title}, 
            tome = ${tome}, 
            page_no = ${page_no},
            memo = ${memo},
            codes = ${codes},
            publiee = ${pub.publiee},
            type_coloriage = ${pub.type},
            -- la date de publication est gardée tant que la fiche reste publiée
            publiee_le = CASE WHEN ${pub.publiee} THEN COALESCE(publiee_le, now()) ELSE NULL END
        WHERE id = ${id} AND user_id = ${user.id}
      `;
    }

    // Double page cochée ou décochée sans nouvelle image : XP de la seconde page donnés ou repris
    await ajusterXPDoublePage(user.id, id).catch(() => {});
    if (changePalette) await sql`UPDATE pages SET palette_id = ${paletteId} WHERE id = ${id} AND user_id = ${user.id}`;
    if (tome) await sql`DELETE FROM user_tomes_masques WHERE user_id = ${String(user.id)} AND lower(nom) = lower(${tome})`;
    revalidatePath('/');
    revalidatePath(`/pages/${id}`);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ErreurImage) return reponseErreurImage(err);
    console.error('Erreur de sauvegarde :', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const supprimee = await sql`
      DELETE FROM pages
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    // Les XP gagnés en ajoutant ce coloriage sont retirés (les deux pages d'une double page)
    if (supprimee.length) await retirerXPColoriage(user.id, id).catch(() => {});

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur de suppression :', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}