import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Dices } from 'lucide-react';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Library from '@/components/Library';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MesColoriages() {
  const user = await getUser();
  if (!user) redirect('/login');

  const pages = await sql`
    SELECT p.id, p.title, p.tome, p.page_no, p.memo, p.codes, p.image_type IS NOT NULL AS has_image, OCTET_LENGTH(p.image_b64) AS img_size,
           p.mots_cles || ARRAY(
             SELECT m.mot FROM mots_cles m JOIN tome_catalog c ON c.id = m.tome_id
             WHERE lower(c.nom) = lower(p.tome) AND (m.page_no = ANY(string_to_array(p.page_no, '-')) OR m.page_no = '')) AS mots
    FROM pages p
    WHERE p.user_id = ${user.id}
    ORDER BY p.created_at DESC
  `;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Coloriages</h2>
        <Link href="/roue" className="btn alt" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}>
          <Dices size={18} aria-hidden="true" /> Roue du Destin
        </Link>
      </div>
      <Library pages={JSON.parse(JSON.stringify(pages))} />
    </>
  );
}
