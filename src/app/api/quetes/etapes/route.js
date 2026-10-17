import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { accorderXP } from '@/lib/series';

// Quêtes de fêtes en cours, avec mes étapes cochées
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const quetes = await sql`
    SELECT q.id, q.fete, q.titre, q.description, q.etapes, q.xp,
           to_char(q.debut, 'YYYY-MM-DD') AS debut, to_char(q.fin, 'YYYY-MM-DD') AS fin,
           (((q.fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin_instant,
           COALESCE((SELECT array_agg(e.etape) FROM quete_etapes e WHERE e.quete_id = q.id AND e.user_id = ${user.id}), '{}') AS cochees,
           EXISTS (SELECT 1 FROM xp_journal j WHERE j.user_id = ${user.id} AND j.cle = 'fete:' || q.id) AS terminee
    FROM quetes q
    WHERE q.active AND (q.debut IS NULL OR q.debut <= (now() AT TIME ZONE 'America/Toronto')::date) AND (q.fin IS NULL OR q.fin >= (now() AT TIME ZONE 'America/Toronto')::date)
    ORDER BY q.fin NULLS LAST, q.fete`;
  return NextResponse.json({ quetes });
}

// Cocher ou décocher une étape ({ queteId, etape }). Toutes les étapes cochées = XP de la quête (une fois).
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { queteId, etape } = await req.json().catch(() => ({}));
  const [q] = await sql`SELECT id, etapes, xp FROM quetes WHERE id = ${Number(queteId)} AND active
    AND (debut IS NULL OR debut <= (now() AT TIME ZONE 'America/Toronto')::date) AND (fin IS NULL OR fin >= (now() AT TIME ZONE 'America/Toronto')::date)`;
  if (!q) return NextResponse.json({ error: "Cette quête n'est pas en cours" }, { status: 403 });
  const n = Number(etape);
  if (!(n >= 0 && n < q.etapes.length)) return NextResponse.json({ error: 'Étape invalide' }, { status: 400 });

  const retire = await sql`DELETE FROM quete_etapes WHERE user_id = ${user.id} AND quete_id = ${q.id} AND etape = ${n} RETURNING 1`;
  if (!retire.length) await sql`INSERT INTO quete_etapes (user_id, quete_id, etape) VALUES (${user.id}, ${q.id}, ${n}) ON CONFLICT DO NOTHING`;
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM quete_etapes WHERE user_id = ${user.id} AND quete_id = ${q.id}`;
  let xp = 0;
  if (total >= q.etapes.length && (await accorderXP(user.id, `fete:${q.id}`, q.xp))) xp = q.xp;
  return NextResponse.json({ cochee: !retire.length, xp });
}
