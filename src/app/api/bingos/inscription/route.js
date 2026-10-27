import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { verifierLimite } from '@/lib/abonnement';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { bingoId } = await req.json().catch(() => ({}));
  const [b] = await sql`SELECT id FROM bingos WHERE id = ${Number(bingoId)}
    AND debut <= (now() AT TIME ZONE 'America/Toronto')::date
    AND COALESCE(fin, (date_trunc('month', debut) + interval '1 month - 2 days')::date) >= (now() AT TIME ZONE 'America/Toronto')::date`;
  if (!b) return NextResponse.json({ error: "Ce bingo n'est pas en cours" }, { status: 403 });
  const limite = await verifierLimite(user.id, 'bingos', { bingoId: b.id });
  if (limite) return limite;
  await sql`INSERT INTO bingo_inscriptions (bingo_id, user_id) VALUES (${b.id}, ${user.id}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ ok: true });
}
