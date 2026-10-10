import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Library from '@/components/Library';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Accueil() {
  const user = await getUser();
  if (!user) redirect('/login');

  const pages = await sql`
    SELECT id, title, tome, page_no, codes, image_type IS NOT NULL AS has_image, OCTET_LENGTH(image_b64) AS img_size
    FROM pages 
    WHERE user_id = ${user.id} 
    ORDER BY created_at DESC
  `;

  return <Library pages={JSON.parse(JSON.stringify(pages))} />;
}