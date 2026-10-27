import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await sql`UPDATE users SET tutoriel_vu = true WHERE id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
