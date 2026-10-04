import { redirect, notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import Editor from '@/components/Editor';

export default async function Fiche({ params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect('/login');
  const tomes = (await sql`select distinct tome from pages where user_id = ${user.id} and tome <> '' order by 1`).map((r) => r.tome);
  let page = null;
  if (id !== 'new') {
    if (!isId(id)) notFound();
    const r = await sql`select id, title, tome, page_no, codes, image_type is not null as has_image
      from pages where id = ${id} and user_id = ${user.id}`;
    if (!r.length) notFound();
    page = r[0];
  }
  return <Editor page={page} tomes={tomes} />;
}
