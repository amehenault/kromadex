import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { NB_CASES, VALEURS_CATEGORIES_BINGO } from '@/lib/bingos';
import { mesTypesVisibles, categoriesBingoVisibles } from '@/lib/visibilite';
import { cloturerBingos } from '@/lib/clotures';

const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);

// Bingos en cours (avec mes cases cochées), ou tous les bingos pour l'admin (?gestion=1).
// Un bingo programmé n'apparaît aux membres qu'à partir de sa date de début.
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const gestion = new URL(req.url).searchParams.get('gestion') === '1' && profil.role === 'admin';
  const categories = categoriesBingoVisibles(await mesTypesVisibles(profil.id));
  await cloturerBingos();
  const bingos = await sql`
    SELECT b.id, b.titre, b.cases, b.conditions, b.categorie,
           to_char(b.debut, 'YYYY-MM-DD') AS debut, to_char(b.fin, 'YYYY-MM-DD') AS fin,
           (b.debut > (now() AT TIME ZONE 'America/Toronto')::date) AS programme,
           (((COALESCE(b.fin, (date_trunc('month', b.debut) + interval '1 month - 2 days')::date) + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin_instant,
           COALESCE((SELECT json_agg(json_build_object('case', c.case_no, 'page', c.page_id, 'valide', c.valide,
                                                       'img_size', (SELECT OCTET_LENGTH(p.image_b64) FROM pages p WHERE p.id = c.page_id)))
                     FROM bingo_cases c WHERE c.bingo_id = b.id AND c.user_id = ${profil.id}), '[]') AS cochees,
           EXISTS (SELECT 1 FROM bingo_inscriptions i WHERE i.bingo_id = b.id AND i.user_id = ${profil.id}) AS inscrit,
           (SELECT count(*)::int FROM bingo_inscriptions i WHERE i.bingo_id = b.id) AS participants
    FROM bingos b
    WHERE ${gestion}
       OR (b.categorie = ANY(${categories}) AND b.debut <= (now() AT TIME ZONE 'America/Toronto')::date AND COALESCE(b.fin, (date_trunc('month', b.debut) + interval '1 month - 2 days')::date) >= (now() AT TIME ZONE 'America/Toronto')::date)
    ORDER BY b.debut DESC NULLS LAST, b.cree_le DESC LIMIT 50`;
  return NextResponse.json({ bingos });
}

// Admin : créer, modifier ou programmer un bingo (9 cases, chacune avec sa condition).
// Deux bingos au maximum par mois (selon la date de début). Sans date de fin : la veille du dernier jour du mois,
// pour que les XP soient versés le dernier jour.
export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id, titre, cases, conditions, categorie, debut, fin } = await req.json();
  const liste = (Array.isArray(cases) ? cases : []).slice(0, NB_CASES).map((c) => String(c || '').trim().slice(0, 60));
  const conds = Array.from({ length: NB_CASES }, (_, i) => String((Array.isArray(conditions) ? conditions[i] : '') || '').trim().slice(0, 300));
  if (!String(titre || '').trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
  if (liste.length !== NB_CASES || liste.some((c) => !c)) {
    return NextResponse.json({ error: `Les ${NB_CASES} cases doivent avoir une tâche` }, { status: 400 });
  }
  const cat = VALEURS_CATEGORIES_BINGO.includes(categorie) ? categorie : 'les_deux';
  const d = date(debut);
  if (!d) return NextResponse.json({ error: 'Choisis la date de début' }, { status: 400 });
  const f = date(fin);
  if (f && f < d) return NextResponse.json({ error: 'La fin doit être après le début' }, { status: 400 });
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM bingos
    WHERE date_trunc('month', debut) = date_trunc('month', ${d}::date) AND id <> ${Number(id) || 0}`;
  if (n >= 2) return NextResponse.json({ error: 'Il y a déjà 2 bingos ce mois-là' }, { status: 409 });

  const t = titre.trim().slice(0, 100);
  if (id) {
    await sql`UPDATE bingos SET titre = ${t}, cases = ${liste}, conditions = ${conds}, categorie = ${cat}, debut = ${d}, fin = ${f}
      WHERE id = ${Number(id)}`;
  } else {
    await sql`INSERT INTO bingos (titre, cases, conditions, categorie, debut, fin) VALUES (${t}, ${liste}, ${conds}, ${cat}, ${d}, ${f})`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json();
  await sql`DELETE FROM bingos WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
