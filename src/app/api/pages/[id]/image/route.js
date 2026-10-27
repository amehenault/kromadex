import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { enTetesImage } from '@/lib/images';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }) {
  const { id } = await params;
  const user = await getUser();
  if (!user || !isId(id)) return new Response(null, { status: 404 });

  const r = await sql`select image_b64 from pages p
    where p.id = ${id} and p.image_b64 is not null
      and (p.user_id = ${user.id} or p.publiee
        or exists (select 1 from defi_participations where page_id = p.id)
        or exists (select 1 from defi_envois where page_id = p.id)
        or exists (select 1 from combat_participants where page_id = p.id)
        or exists (select 1 from tournoi_matchs where page_a = p.id or page_b = p.id)
        or exists (select 1 from bingo_cases where page_id = p.id)
        or exists (select 1 from aventure_soumissions where page_id = p.id))`;
  if (!r.length) return new Response(null, { status: 404 });

  const versionnee = new URL(req.url).searchParams.has('s');
  const contenu = Buffer.from(r[0].image_b64, 'base64');
  const entetes = enTetesImage(contenu, versionnee ? 'private, max-age=86400' : 'private, no-cache');
  if (!entetes) return new Response(null, { status: 404 });
  return new Response(contenu, { headers: entetes });
}
