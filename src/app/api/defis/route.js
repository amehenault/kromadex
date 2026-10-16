import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste, premierDuMois } from '@/lib/roles';

// Défi du mois en cours, défi du mois prochain et historique
export async function GET() {
  const { erreur } = await exigerPoste();
  if (erreur) return erreur;
  const defis = await sql`
    SELECT d.id, to_char(d.mois, 'YYYY-MM-DD') AS mois, d.titre, d.description, u.pseudo AS choisi_par
    FROM defis d LEFT JOIN users u ON u.id = d.choisi_par
    ORDER BY d.mois DESC LIMIT 24`;
  return NextResponse.json({ defis, moisActuel: premierDuMois(0), moisProchain: premierDuMois(1) });
}

// Créer ou modifier le défi d'un mois (un seul défi par mois).
// L'admin choisit n'importe quel mois, la modo le mois en cours ou un mois à venir,
// la cheffe seulement le défi du mois prochain.
export async function POST(req) {
  const { profil, erreur } = await exigerPoste('admin', 'modo', 'cheffe');
  if (erreur) return erreur;

  const { mois, titre, description } = await req.json();
  const m = /^\d{4}-\d{2}/.test(mois || '') ? `${mois.slice(0, 7)}-01` : null;
  if (!m || !titre?.trim()) return NextResponse.json({ error: 'Mois et titre requis' }, { status: 400 });
  if (profil.role === 'cheffe' && m !== premierDuMois(1)) {
    return NextResponse.json({ error: 'La cheffe choisit seulement le défi du mois prochain' }, { status: 403 });
  }
  if (profil.role === 'modo' && m < premierDuMois(0)) {
    return NextResponse.json({ error: 'Les défis des mois passés ne se modifient plus' }, { status: 403 });
  }

  await sql`
    INSERT INTO defis (mois, titre, description, choisi_par)
    VALUES (${m}, ${titre.trim().slice(0, 100)}, ${String(description || '').slice(0, 1000)}, ${profil.id})
    ON CONFLICT (mois) DO UPDATE SET titre = EXCLUDED.titre, description = EXCLUDED.description, choisi_par = EXCLUDED.choisi_par`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json();
  await sql`DELETE FROM defis WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
