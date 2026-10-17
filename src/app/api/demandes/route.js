import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { TYPES_DEMANDE, groupeDuType, nomType } from '@/lib/demandes';
import { prevenir } from '@/lib/push';

// Mes demandes, ou toutes les demandes pour l'admin (?tout=1)
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  if (new URL(req.url).searchParams.get('tout') && profil.role === 'admin') {
    const demandes = await sql`
      SELECT d.id, d.type, d.message, d.reponse, d.statut, d.cree_le, u.pseudo, u.email, u.role
      FROM demandes d JOIN users u ON u.id = d.user_id
      ORDER BY array_position(ARRAY['nouvelle', 'en_cours'], d.statut) NULLS LAST, d.cree_le ASC LIMIT 500`;
    return NextResponse.json({ demandes });
  }
  const demandes = await sql`
    SELECT id, type, message, reponse, statut, cree_le, reponse_vue
    FROM demandes WHERE user_id = ${profil.id} ORDER BY cree_le DESC LIMIT 100`;
  return NextResponse.json({ demandes });
}

// Envoyer une demande, ou ({ vues: true }) marquer les réponses reçues comme vues
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { type, message, vues } = await req.json().catch(() => ({}));
  if (vues) {
    await sql`UPDATE demandes SET reponse_vue = true WHERE user_id = ${profil.id} AND NOT reponse_vue`;
    return NextResponse.json({ ok: true });
  }
  const texte = String(message || '').trim();
  if (!TYPES_DEMANDE.some((t) => t.valeur === type)) return NextResponse.json({ error: 'Choisis un type de demande' }, { status: 400 });
  if (texte.length < 3) return NextResponse.json({ error: 'Écris ton message' }, { status: 400 });

  // Limite anti-abus : 10 demandes par jour
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM demandes WHERE user_id = ${profil.id} AND cree_le > now() - interval '1 day'`;
  if (n >= 10) return NextResponse.json({ error: 'Tu as déjà envoyé 10 demandes aujourd’hui, réessaie demain.' }, { status: 429 });

  await sql`INSERT INTO demandes (user_id, type, message) VALUES (${profil.id}, ${type}, ${texte.slice(0, 2000)})`;
  prevenir('demandes', { postes: ['admin'] }, { titre: `Nouvelle demande : ${nomType(type)}`, texte: texte.slice(0, 120), lien: '/profil/admin?onglet=demandes' }, profil.id);
  return NextResponse.json({ ok: true });
}

// Admin : changer le statut et répondre (résolue, ajoutée et refusée = archivée, jamais supprimée)
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id, statut, reponse } = await req.json().catch(() => ({}));
  // Le statut doit exister pour la catégorie de la demande (ex. « Résolue » pour un bug, « Ajoutée » pour un tome)
  const [d] = await sql`SELECT type, user_id, reponse FROM demandes WHERE id = ${Number(id)}`;
  if (!d) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
  if (!groupeDuType(d.type).statuts.includes(statut)) return NextResponse.json({ error: 'Statut invalide pour cette demande' }, { status: 400 });
  const texte = String(reponse || '').trim().slice(0, 2000);
  await sql`
    UPDATE demandes
    SET statut = ${statut}, reponse = ${texte}, maj_le = now(),
        reponse_vue = CASE WHEN reponse IS DISTINCT FROM ${texte} AND ${texte} <> '' THEN false ELSE reponse_vue END
    WHERE id = ${Number(id)}`;
  if (texte && texte !== d.reponse) {
    prevenir('reponses', { ids: [d.user_id] }, { titre: 'L’Invocatrice t’a répondu', texte: texte.slice(0, 120), lien: '/aide' });
  }
  return NextResponse.json({ ok: true });
}
