import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { nettoyerPseudo, erreurPseudo, pseudoPris, estDoublon, MESSAGE_PRIS } from '@/lib/pseudo';

export const dynamic = 'force-dynamic';

// Disponibilité d'un pseudo pendant la saisie (?q=), aussi pendant l'inscription (sans compte)
export async function GET(req) {
  const user = await getUser();
  const pseudo = nettoyerPseudo(new URL(req.url).searchParams.get('q'));
  const erreur = erreurPseudo(pseudo);
  if (erreur) return NextResponse.json({ libre: false, erreur });
  if (await pseudoPris(pseudo, user?.id)) return NextResponse.json({ libre: false, erreur: MESSAGE_PRIS });
  return NextResponse.json({ libre: true });
}

// Changer son pseudo
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const pseudo = nettoyerPseudo(b.pseudo);
  const erreur = erreurPseudo(pseudo);
  if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
  if (await pseudoPris(pseudo, user.id)) return NextResponse.json({ error: MESSAGE_PRIS }, { status: 409 });
  try {
    await sql`UPDATE users SET pseudo = ${pseudo} WHERE id = ${user.id}`;
  } catch (e) {
    if (estDoublon(e)) return NextResponse.json({ error: MESSAGE_PRIS }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true, pseudo });
}
