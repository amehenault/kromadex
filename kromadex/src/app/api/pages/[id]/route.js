import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const title = formData.get('title');
    const tome = formData.get('tome');
    const page_no = formData.get('page_no');
    const codes = formData.get('codes');
    const file = formData.get('image');

    // Vérifie si un nouveau fichier image a réellement été téléversé
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
            codes = ${codes}, 
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
            codes = ${codes}
        WHERE id = ${id} AND user_id = ${user.id}
      `;
    }

    revalidatePath('/');
    revalidatePath(`/pages/${id}`);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur de sauvegarde :', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}