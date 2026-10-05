import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { readForm } from '@/lib/pages';

export async function POST(req) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
  }

  try {
    const { data: d, image } = await readForm(req);

    const r = await sql`
      insert into pages (user_id, title, tome, page_no, category, difficulty, rating, codes, image_b64, image_type)
      values (
        ${user.id}, 
        ${d.title}, 
        ${d.tome}, 
        ${d.page_no}, 
        ${d.category}, 
        ${d.difficulty}, 
        ${d.rating}, 
        ${JSON.stringify(d.codes)}::jsonb, 
        ${image?.b64 ?? null}, 
        ${image?.type ?? null}
      )
      returning id
    `;

    return NextResponse.json({ id: r[0].id });
  } catch (e) {
    console.error('Erreur POST /api/pages:', e);
    return NextResponse.json({ error: e.message || 'Erreur lors de la création.' }, { status: 400 });
  }
}