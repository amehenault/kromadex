import { NextResponse } from 'next/server';
import { rappelsDuJour } from '@/lib/planification';
import { prevenirMaintenant } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Rappel quotidien (lancé chaque matin par la tâche planifiée de vercel.json) :
// tant qu'une activité n'est pas planifiée, l'Invocatrice reçoit une notification par jour.
// La tâche planifiée envoie l'en-tête Authorization: Bearer <CRON_SECRET>.
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const rappels = await rappelsDuJour();
  if (!rappels.length) return NextResponse.json({ ok: true, rappels: 0 });
  const texte = rappels.length === 1 ? rappels[0].texte : `${rappels.length} activités à planifier. ${rappels[0].texte}`;
  const envoyes = await prevenirMaintenant('rappels', { postes: ['admin'] }, { titre: 'Activités à venir', texte, lien: '/activites-a-venir' });
  return NextResponse.json({ ok: true, rappels: rappels.length, envoyes });
}
