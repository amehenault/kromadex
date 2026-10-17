import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { lirePublication } from '@/lib/pages';
import { retirerXP } from '@/lib/series';

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

    if (file && typeof file === 'object' && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const imageType = file.type || 'image/jpeg';

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

    if (tome) await sql`DELETE FROM user_tomes_masques WHERE user_id = ${String(user.id)} AND lower(nom) = lower(${tome})`;
    revalidatePath('/');
    revalidatePath(`/pages/${id}`);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur de sauvegarde :', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
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

    // Les XP gagnés en ajoutant ce coloriage sont retirés
    if (supprimee.length) await retirerXP(user.id, `page:${id}`).catch(() => {});

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur de suppression :', err);
    return NextResponse.json({ error: err.message || 'Erreur lors de la suppression' }, { status: 500 });
  }
}