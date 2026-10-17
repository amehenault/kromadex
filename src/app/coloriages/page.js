import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Dices } from 'lucide-react';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import Library from '@/components/Library';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mes coloriages (bibliothèque personnelle), avec l'accès à la Roue du destin
export default async function MesColoriages() {
  const user = await getUser();
  if (!user) redirect('/login');

  const pages = await sql`
    SELECT id, title, tome, page_no, memo, codes, image_type IS NOT NULL AS has_image, OCTET_LENGTH(image_b64) AS img_size
    FROM pages
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Mes coloriages</h2>
        <Link href="/roue" className="btn alt" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}>
          <Dices size={18} aria-hidden="true" /> Roue du destin
        </Link>
      </div>
      <Library pages={JSON.parse(JSON.stringify(pages))} />
    </>
  );
}
