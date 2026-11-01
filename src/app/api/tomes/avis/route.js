import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function possedeTome(tomeId, userId) {
  const [r] = await sql`SELECT 1 FROM tome_catalog c WHERE c.id = ${tomeId}
    AND (EXISTS (SELECT 1 FROM user_tomes u WHERE u.tome_id = c.id AND u.user_id = ${String(userId)})
      OR EXISTS (SELECT 1 FROM pages p WHERE p.user_id = ${userId} AND lower(p.tome) = lower(c.nom)))`;
  return !!r;
}

const non = (message, status = 400) => NextResponse.json({ error: message }, { status });

async function lister(tomeId, moi) {
  const avis = await sql`
    SELECT a.note, a.avis, a.maj_le, (a.user_id = ${moi}) AS mien,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
    FROM avis_tomes a JOIN users u ON u.id = a.user_id
    WHERE a.tome_id = ${tomeId} ORDER BY (a.user_id = ${moi}) DESC, a.maj_le DESC LIMIT 100`;
  const possede = await possedeTome(tomeId, moi);
  return { avis, possede: !!possede };
}

export async function GET(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const id = Number(new URL(req.url).searchParams.get('id')) || 0;
  return NextResponse.json(await lister(id, user.id));
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const b = await req.json().catch(() => ({}));
  const id = Number(b.tomeId) || 0;
  const note = parseInt(b.note, 10);
  const avis = String(b.avis || '').trim().slice(0, 300);
  if (!(note >= 1 && note <= 5)) return non('Choisis une note de 1 à 5 cristaux');
  const possede = await possedeTome(id, user.id);
  if (!possede) return non('Ajoute ce tome ou ce livre à ta collection pour donner ton avis', 403);
  await sql`
    INSERT INTO avis_tomes (tome_id, user_id, note, avis) VALUES (${id}, ${user.id}, ${note}, ${avis})
    ON CONFLICT (tome_id, user_id) DO UPDATE SET note = EXCLUDED.note, avis = EXCLUDED.avis, maj_le = now()`;
  return NextResponse.json(await lister(id, user.id));
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return non('Non autorisé', 401);
  const { tomeId } = await req.json().catch(() => ({}));
  await sql`DELETE FROM avis_tomes WHERE tome_id = ${Number(tomeId) || 0} AND user_id = ${user.id}`;
  return NextResponse.json(await lister(Number(tomeId) || 0, user.id));
}
