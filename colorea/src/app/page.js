import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Library from '@/components/Library';

export default async function Accueil() {
  const user = await getUser();
  if (!user) redirect('/login');
  const pages = await sql`select id, title, tome, page_no, category, image_type is not null as has_image
    from pages where user_id = ${user.id} order by created_at desc`;
  return <Library pages={pages} />;
}
