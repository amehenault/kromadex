import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || !isId(id)) return new Response(null, { status: 404 });

  const r = await sql`select image_b64, image_type from pages where id = ${id} and user_id = ${user.id} and image_b64 is not null`;
  if (!r.length) return new Response(null, { status: 404 });

  return new Response(Buffer.from(r[0].image_b64, 'base64'), {
    headers: {
      'Content-Type': r[0].image_type,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}