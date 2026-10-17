import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { recompensesDe } from '@/lib/recompensesServeur';

// Récompenses d'un membre (?user=id), ou les miennes
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('user');
  const cible = id && isId(id) ? id : user.id;
  return NextResponse.json({ recompenses: await recompensesDe(cible) });
}
