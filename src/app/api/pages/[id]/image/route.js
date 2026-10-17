import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || !isId(id)) return new Response(null, { status: 404 });

  // Sa propre fiche, une fiche publiée dans la communauté, ou un coloriage soumis à une activité
  // (épreuve, combat, tournoi, bingo, expédition, épopée, prophétie)
  const r = await sql`select image_b64, image_type from pages p
    where p.id = ${id} and p.image_b64 is not null
      and (p.user_id = ${user.id} or p.publiee
        or exists (select 1 from defi_participations where page_id = p.id)
        or exists (select 1 from defi_envois where page_id = p.id)
        or exists (select 1 from combat_participants where page_id = p.id)
        or exists (select 1 from tournoi_matchs where page_a = p.id or page_b = p.id)
        or exists (select 1 from bingo_cases where page_id = p.id)
        or exists (select 1 from aventure_soumissions where page_id = p.id))`;
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