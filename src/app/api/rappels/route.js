import { NextResponse } from 'next/server';
import { rappelsDuJour, notifierAujourdhui } from '@/lib/planification';
import { prevenirMaintenant } from '@/lib/push';
import { nettoyer } from '@/lib/nettoyage';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const nettoyage = await nettoyer();
  const rappels = await rappelsDuJour();
  if (!notifierAujourdhui(rappels)) return NextResponse.json({ ok: true, rappels: rappels.length, envoyes: 0, nettoyage });
  const texte = rappels.length === 1 ? rappels[0].texte : `${rappels.length} activités à planifier. ${rappels[0].texte}`;
  const envoyes = await prevenirMaintenant('rappels', { postes: ['admin'] }, { titre: 'Activités à venir', texte, lien: '/activites-a-venir' });
  return NextResponse.json({ ok: true, rappels: rappels.length, envoyes, nettoyage });
}
