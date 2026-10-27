import { NextResponse } from 'next/server';
import { exigerPoste } from '@/lib/roles';
import { activitesAVenir, texteRappel } from '@/lib/planification';
import { pushActif } from '@/lib/push';

export async function GET() {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const activites = (await activitesAVenir()).map((a) => ({ ...a, texte: a.rappel ? texteRappel(a) : '' }));
  return NextResponse.json({ activites, push: pushActif() });
}
