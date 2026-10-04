import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { readForm, isId } from '@/lib/pages';

const non = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function PUT(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return non('Non connecté.', 401);
  if (!isId(id)) return non('Introuvable.', 404);
  try {
    const { data: d, image } = await readForm(req);
    const r = image
      ? await sql`update pages set title=${d.title}, tome=${d.tome}, page_no=${d.page_no}, category=${d.category}, difficulty=${d.difficulty}, rating=${d.rating}, codes=${JSON.stringify(d.codes)}::jsonb, image_b64=${image.b64}, image_type=${image.type} where id=${id} and user_id=${user.id} returning id`
      : await sql`update pages set title=${d.title}, tome=${d.tome}, page_no=${d.page_no}, category=${d.category}, difficulty=${d.difficulty}, rating=${d.rating}, codes=${JSON.stringify(d.codes)}::jsonb where id=${id} and user_id=${user.id} returning id`;
    return r.length ? NextResponse.json({ ok: true }) : non('Introuvable.', 404);
  } catch (e) { return non(e.message, 400); }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return non('Non connecté.', 401);
  if (!isId(id)) return non('Introuvable.', 404);
  await sql`delete from pages where id = ${id} and user_id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
