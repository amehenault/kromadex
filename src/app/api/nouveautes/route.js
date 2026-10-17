import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { VALEURS_NOUVEAUTE } from '@/lib/nouveautes';

// Articles d'une catégorie (?categorie=), les plus récents en premier
export async function GET(req) {
  const { erreur } = await exigerPoste();
  if (erreur) return erreur;
  const c = new URL(req.url).searchParams.get('categorie');
  const categorie = VALEURS_NOUVEAUTE.includes(c) ? c : null;
  const articles = await sql`
    SELECT id, categorie, titre, resume, contenu, publie_le FROM nouveautes
    WHERE ${categorie}::text IS NULL OR categorie = ${categorie}
    ORDER BY publie_le DESC LIMIT 100`;
  return NextResponse.json({ articles });
}

// Admin : écrire ou modifier un article
export async function POST(req) {
  const { profil, erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const a = await req.json().catch(() => ({}));
  const titre = String(a.titre || '').trim().slice(0, 140);
  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
  const categorie = VALEURS_NOUVEAUTE.includes(a.categorie) ? a.categorie : 'nouvelles';
  const resume = String(a.resume || '').slice(0, 400);
  const contenu = String(a.contenu || '').slice(0, 8000);
  if (a.id) {
    await sql`UPDATE nouveautes SET categorie = ${categorie}, titre = ${titre}, resume = ${resume}, contenu = ${contenu} WHERE id = ${Number(a.id)}`;
  } else {
    await sql`INSERT INTO nouveautes (categorie, titre, resume, contenu, auteur) VALUES (${categorie}, ${titre}, ${resume}, ${contenu}, ${profil.id})`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  await sql`DELETE FROM nouveautes WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
