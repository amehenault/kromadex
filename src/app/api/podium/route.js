import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { podium } from '@/lib/recompensesServeur';
import { cloturerEpreuves } from '@/lib/clotures';
import { avancerCombats } from '@/lib/combats';
import { avancerTournois } from '@/lib/tournois';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await cloturerEpreuves();
  await avancerCombats();
  await avancerTournois();
  return NextResponse.json({ gagnants: await podium() });
}
