import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { accorderXP } from '@/lib/series';

// Durée des votes et récompense du coloriage gagnant
const DUREE_VOTE = '3 days';
const XP_VICTOIRE = 50;

// Termine les combats dont le vote est fini et récompense le gagnant (égalité : pas de gagnant)
async function terminerCombats() {
  const finis = await sql`
    UPDATE combats c SET statut = 'termine',
      gagnant = CASE
        WHEN v.a > v.b THEN c.createur
        WHEN v.b > v.a THEN c.adversaire
        ELSE NULL END
    FROM (SELECT c2.id,
            (SELECT count(*) FROM combat_votes x WHERE x.combat_id = c2.id AND x.choix = 'a') AS a,
            (SELECT count(*) FROM combat_votes x WHERE x.combat_id = c2.id AND x.choix = 'b') AS b
          FROM combats c2 WHERE c2.statut = 'en_cours' AND c2.fin <= now()) v
    WHERE c.id = v.id
    RETURNING c.id, c.gagnant`;
  for (const f of finis) if (f.gagnant) await accorderXP(f.gagnant, `combat:${f.id}`, XP_VICTOIRE).catch(() => {});
}

// Combats ouverts, invitations reçues, combats en cours (votes) et terminés
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await terminerCombats();
  const combats = await sql`
    SELECT c.id, c.statut, c.fin, c.cree_le, c.gagnant, c.invite,
           c.createur, ua.pseudo AS pseudo_a, ua.name AS nom_a, (ua.avatar_b64 IS NOT NULL) AS avatar_a, ua.avatar_maj AS avatar_maj_a,
           c.adversaire, ub.pseudo AS pseudo_b, ub.name AS nom_b, (ub.avatar_b64 IS NOT NULL) AS avatar_b, ub.avatar_maj AS avatar_maj_b,
           ui.pseudo AS pseudo_invite,
           c.page_a, pa.title AS titre_a, OCTET_LENGTH(pa.image_b64) AS img_a,
           c.page_b, pb.title AS titre_b, OCTET_LENGTH(pb.image_b64) AS img_b,
           (SELECT count(*)::int FROM combat_votes v WHERE v.combat_id = c.id AND v.choix = 'a') AS votes_a,
           (SELECT count(*)::int FROM combat_votes v WHERE v.combat_id = c.id AND v.choix = 'b') AS votes_b,
           (SELECT v.choix FROM combat_votes v WHERE v.combat_id = c.id AND v.user_id = ${user.id}) AS mon_vote
    FROM combats c
    JOIN users ua ON ua.id = c.createur JOIN pages pa ON pa.id = c.page_a
    LEFT JOIN users ub ON ub.id = c.adversaire LEFT JOIN pages pb ON pb.id = c.page_b
    LEFT JOIN users ui ON ui.id = c.invite
    WHERE c.statut IN ('ouvert', 'en_cours')
       OR (c.statut = 'termine' AND c.fin > now() - interval '30 days')
       OR (c.statut = 'refuse' AND c.createur = ${user.id} AND c.cree_le > now() - interval '7 days')
    ORDER BY c.statut, c.fin NULLS FIRST, c.cree_le DESC LIMIT 200`;
  return NextResponse.json({ combats, moi: String(user.id) });
}

// Actions : creer, accepter, refuser, annuler, voter
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const moi = user.id;
  const pagePubliee = async (id) => isId(String(id || '')) && (await sql`SELECT 1 FROM pages WHERE id = ${id} AND user_id = ${moi} AND publiee`).length > 0;

  if (b.action === 'creer') {
    if (!(await pagePubliee(b.pageId))) return NextResponse.json({ error: 'Choisis un de tes coloriages publiés' }, { status: 400 });
    let invite = null;
    if (b.inviteId) {
      if (!isId(String(b.inviteId)) || String(b.inviteId) === String(moi)) return NextResponse.json({ error: 'Invitation impossible' }, { status: 400 });
      const [u] = await sql`SELECT id FROM users WHERE id = ${b.inviteId}`;
      if (!u) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });
      invite = u.id;
    }
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM combats WHERE createur = ${moi} AND statut = 'ouvert'`;
    if (n >= 3) return NextResponse.json({ error: 'Tu as déjà 3 combats en attente' }, { status: 429 });
    await sql`INSERT INTO combats (createur, page_a, invite) VALUES (${moi}, ${b.pageId}, ${invite})`;
    return NextResponse.json({ ok: true });
  }

  const [c] = await sql`SELECT * FROM combats WHERE id = ${Number(b.id)}`;
  if (!c) return NextResponse.json({ error: 'Combat introuvable' }, { status: 404 });

  if (b.action === 'accepter') {
    if (c.statut !== 'ouvert' || String(c.createur) === String(moi) || (c.invite && String(c.invite) !== String(moi))) {
      return NextResponse.json({ error: 'Tu ne peux pas accepter ce combat' }, { status: 403 });
    }
    if (!(await pagePubliee(b.pageId))) return NextResponse.json({ error: 'Choisis un de tes coloriages publiés' }, { status: 400 });
    const maj = await sql`UPDATE combats SET adversaire = ${moi}, page_b = ${b.pageId}, statut = 'en_cours', fin = now() + ${DUREE_VOTE}::interval
      WHERE id = ${c.id} AND statut = 'ouvert' RETURNING id`;
    if (!maj.length) return NextResponse.json({ error: 'Quelqu’un a déjà accepté ce combat' }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'refuser') {
    if (c.statut !== 'ouvert' || String(c.invite) !== String(moi)) return NextResponse.json({ error: 'Impossible' }, { status: 403 });
    await sql`UPDATE combats SET statut = 'refuse' WHERE id = ${c.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'annuler') {
    if (String(c.createur) !== String(moi) || !['ouvert', 'refuse'].includes(c.statut)) return NextResponse.json({ error: 'Impossible' }, { status: 403 });
    await sql`DELETE FROM combats WHERE id = ${c.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'voter') {
    if (c.statut !== 'en_cours' || new Date(c.fin) <= new Date()) return NextResponse.json({ error: 'Le vote est terminé' }, { status: 403 });
    if ([String(c.createur), String(c.adversaire)].includes(String(moi))) return NextResponse.json({ error: 'Tu ne peux pas voter pour ton propre combat' }, { status: 403 });
    if (!['a', 'b'].includes(b.choix)) return NextResponse.json({ error: 'Choix invalide' }, { status: 400 });
    await sql`INSERT INTO combat_votes (combat_id, user_id, choix) VALUES (${c.id}, ${moi}, ${b.choix})
      ON CONFLICT (combat_id, user_id) DO UPDATE SET choix = EXCLUDED.choix`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
