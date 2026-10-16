import { redirect, notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import Editor from '@/components/Editor';

export default async function Fiche({ params, searchParams }) {
  const { id } = await params;
  const q = await searchParams;
  const user = await getUser();
  if (!user) redirect('/login');
  // Tomes déjà utilisés + tomes possédés dans le catalogue
  const tomes = (await sql`
    select tome from pages where user_id = ${user.id} and tome <> ''
    union
    select c.nom from user_tomes u join tome_catalog c on c.id = u.tome_id where u.user_id = ${String(user.id)}
    order by 1`).map((r) => r.tome);
  let page = null;
  if (id !== 'new') {
    if (!isId(id)) notFound();
    const r = await sql`select id, title, tome, page_no, memo, codes, image_type is not null as has_image
      from pages where id = ${id} and user_id = ${user.id}`;
    if (!r.length) notFound();
    page = r[0];
  }
  const initial = page ? null : { tome: String(q?.tome || '').slice(0, 60), page_no: String(q?.page || '').slice(0, 10) };
  return <Editor page={page} tomes={tomes} initial={initial} />;
}
