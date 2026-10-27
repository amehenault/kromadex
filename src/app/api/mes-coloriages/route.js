import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const type = ['mystere', 'cozy', 'autre'].includes(q.get('type')) ? q.get('type') : null;
  const tomes = q.get('tomes') === '1';
  const publiees = q.get('publiees') === '1';
  const nonPubliees = q.get('nonpubliees') === '1';
  const fiches = await sql`
    SELECT id, title, tome, page_no, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage, publiee, OCTET_LENGTH(image_b64) AS img_size
    FROM pages
    WHERE user_id = ${user.id} AND image_b64 IS NOT NULL
      AND (${type}::text IS NULL OR COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') = ${type})
      AND (NOT ${tomes} OR tome <> '')
      AND (NOT ${publiees} OR publiee)
      AND (NOT ${nonPubliees} OR NOT publiee)
    ORDER BY created_at DESC LIMIT 300`;
  return NextResponse.json({ fiches });
}
