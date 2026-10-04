import { redirect, notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import Editor from '@/components/Editor';

export default async function Fiche({ params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect('/login');
  const cats = (await sql`select distinct category from pages where user_id = ${user.id} and category <> '' order by 1`).map((r) => r.category);
  let page = null;
  if (id !== 'new') {
    if (!isId(id)) notFound();
    const r = await sql`select id, title, tome, page_no, category, difficulty, rating, codes, image_type is not null as has_image
      from pages where id = ${id} and user_id = ${user.id}`;
    if (!r.length) notFound();
    page = r[0];
  }
  return <Editor page={page} categories={cats} />;
}
