import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { activitesNonVues, marquerActivitesVues } from '@/lib/activitesVues';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  return NextResponse.json(await activitesNonVues(user.id));
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { sorte } = await req.json().catch(() => ({}));
  if (!['epreuves', 'bingos', 'aventures'].includes(sorte)) return NextResponse.json({ error: 'Sorte inconnue' }, { status: 400 });
  await marquerActivitesVues(user.id, sorte);
  return NextResponse.json(await activitesNonVues(user.id));
}
