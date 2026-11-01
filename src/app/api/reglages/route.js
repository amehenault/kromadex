import { NextResponse } from 'next/server';
import { exigerPoste } from '@/lib/roles';
import { REGLAGES, lireReglage, ecrireReglage } from '@/lib/reglages';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const reglages = {};
  for (const cle of Object.keys(REGLAGES)) reglages[cle] = await lireReglage(cle);
  return NextResponse.json({ reglages });
}

export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { cle, valeur } = await req.json().catch(() => ({}));
  if (!(cle in REGLAGES) || typeof valeur !== typeof REGLAGES[cle]) return NextResponse.json({ error: 'Réglage invalide' }, { status: 400 });
  await ecrireReglage(cle, valeur);
  return NextResponse.json({ ok: true });
}
