import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { vueVerdict, rendreVerdict, lireActivite } from '@/lib/verdicts';
import { cloturerEpreuves } from '@/lib/clotures';
import { avancerCombats } from '@/lib/combats';
import { avancerTournois } from '@/lib/tournois';
import { verdictsARendre } from '@/lib/verdictsARendre';

async function avancer(activite) {
  const a = lireActivite(activite);
  if (a?.genre === 'epreuve') await cloturerEpreuves();
  else if (a?.genre === 'combat') await avancerCombats();
  else if (a?.genre === 'match') await avancerTournois();
}

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  if (q.get('a_rendre')) return NextResponse.json({ activites: await verdictsARendre(user.id) });
  const activite = q.get('activite');
  await avancer(activite);
  const vue = await vueVerdict(activite, user.id);
  if (!vue) return NextResponse.json({ error: 'Activité introuvable' }, { status: 404 });
  return NextResponse.json(vue);
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { activite, pageId } = await req.json().catch(() => ({}));
  await avancer(activite);
  const r = await rendreVerdict(activite, user.id, pageId);
  if (r.erreur) return NextResponse.json({ error: r.erreur }, { status: r.status });
  return NextResponse.json(await vueVerdict(activite, user.id));
}
