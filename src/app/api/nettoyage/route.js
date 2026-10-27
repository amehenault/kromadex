import { NextResponse } from 'next/server';
import { nettoyer } from '@/lib/nettoyage';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const simulation = new URL(req.url).searchParams.get('simulation');
  return NextResponse.json({ ok: true, ...(await nettoyer(simulation ? { actif: false } : undefined)) });
}
