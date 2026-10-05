import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { readForm } from '@/lib/pages';

export async function PUT(req, { params }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: d, image } = await readForm(req);

    if (image) {
      await sql`
        update pages
        set 
          title = ${d.title}, 
          tome = ${d.tome}, 
          page_no = ${d.page_no}, 
          category = ${d.category}, 
          difficulty = ${d.difficulty}, 
          rating = ${d.rating}, 
          codes = ${JSON.stringify(d.codes)}::jsonb, 
          image_b64 = ${image.b64}, 
          image_type = ${image.type}
        where id = ${id} and user_id = ${user.id}
      `;
    } else {
      await sql`
        update pages
        set 
          title = ${d.title}, 
          tome = ${d.tome}, 
          page_no = ${d.page_no}, 
          category = ${d.category}, 
          difficulty = ${d.difficulty}, 
          rating = ${d.rating}, 
          codes = ${JSON.stringify(d.codes)}::jsonb
        where id = ${id} and user_id = ${user.id}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erreur PUT /api/pages/[id]:', e);
    return NextResponse.json({ error: e.message || 'Erreur lors de la mise à jour.' }, { status: 400 });
  }
}