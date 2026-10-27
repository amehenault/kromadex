import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { verifierLimite } from '@/lib/abonnement';
import { prevenir } from '@/lib/push';
import { VALEURS_TYPES } from '@/lib/typesColoriage';
import { COMBATS, THEMES_DUEL } from '@/lib/activites';
import { avancerCombats, verifierDepartVerdict, seSuiventMutuellement } from '@/lib/combats';

const ACTIFS = ['invitation', 'ouvert', 'soumission'];

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await avancerCombats();
  const combats = await sql`
    SELECT c.id, c.genre, c.categorie, c.theme_type, c.theme, c.statut, c.cree_le, c.soumission_fin, c.verdict_fin, c.places,
           c.cree_le + make_interval(days => ${COMBATS.joursAcceptation}) AS acceptation_fin,
           c.createur = ${user.id} AS je_cree, c.invite = ${user.id} AS je_suis_invite,
           c.gagnant = ${user.id} AS j_ai_gagne, c.gagnant IS NOT NULL AS a_gagnant,
           (SELECT page_id FROM combat_participants p WHERE p.combat_id = c.id AND p.user_id = c.gagnant) AS page_gagnante,
           (SELECT count(*)::int FROM combat_participants p WHERE p.combat_id = c.id) AS participants,
           (SELECT count(*)::int FROM combat_participants p WHERE p.combat_id = c.id AND p.page_id IS NOT NULL) AS coloriages,
           mp.user_id IS NOT NULL AS je_participe, mp.page_id AS ma_page,
           CASE WHEN c.genre = 'duel' AND (mp.user_id IS NOT NULL OR c.invite = ${user.id}) THEN
             (SELECT json_agg(json_build_object('user_id', u.id, 'pseudo', u.pseudo, 'name', u.name, 'role', u.role, 'a_avatar', u.avatar_b64 IS NOT NULL,
                                                'avatar_maj', u.avatar_maj, 'soumis', p.page_id IS NOT NULL))
              FROM combat_participants p JOIN users u ON u.id = p.user_id WHERE p.combat_id = c.id AND p.user_id <> ${user.id})
           END AS adversaires,
           CASE WHEN c.genre = 'joute' THEN
             (SELECT json_agg(json_build_object('numero', x.numero, 'soumis', x.soumis, 'moi', x.moi) ORDER BY x.numero)
              FROM (SELECT row_number() OVER (ORDER BY p.soumis_le NULLS LAST, p.user_id) AS numero,
                           p.page_id IS NOT NULL AS soumis, p.user_id = ${user.id} AS moi
                    FROM combat_participants p WHERE p.combat_id = c.id) x)
           END AS coloristes,
           CASE WHEN c.createur = ${user.id} AND c.invite IS NOT NULL THEN (SELECT pseudo FROM users WHERE id = c.invite) END AS pseudo_invite
    FROM combats c
    LEFT JOIN combat_participants mp ON mp.combat_id = c.id AND mp.user_id = ${user.id}
    WHERE c.genre IN ('duel', 'joute') AND (
          c.statut IN ('ouvert', 'verdict')
       OR (c.statut IN ('invitation', 'soumission') AND (mp.user_id IS NOT NULL OR c.invite = ${user.id}))
       OR (c.statut = 'termine' AND c.verdict_fin > now() - interval '30 days')
       OR (c.statut IN ('refuse', 'annule') AND mp.user_id IS NOT NULL AND c.cree_le > now() - interval '20 days'))
    ORDER BY c.cree_le DESC LIMIT 200`;
  return NextResponse.json({ combats });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await avancerCombats();
  const b = await req.json().catch(() => ({}));
  const moi = user.id;
  const erreur = (message, status = 400) => NextResponse.json({ error: message }, { status });

  const monColoriage = async (pageId, categorie) => {
    if (!isId(String(pageId || ''))) return null;
    const [p] = await sql`SELECT id, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage FROM pages WHERE id = ${pageId} AND user_id = ${moi} AND image_b64 IS NOT NULL`;
    return p && p.type_coloriage === categorie ? p : null;
  };

  if (b.action === 'creer') {
    const genre = b.genre === 'joute' ? 'joute' : 'duel';
    const places = [2, 3, 4].includes(Number(b.places)) ? Number(b.places) : COMBATS.maxJoute;
    const categorie = VALEURS_TYPES.includes(b.categorie) ? b.categorie : null;
    if (!categorie) return erreur('Choisis le type de coloriage');
    const themeType = THEMES_DUEL.some((t) => t.valeur === b.themeType) ? b.themeType : null;
    const theme = String(b.theme || '').trim().slice(0, 80);
    if (!themeType || !theme) return erreur('Choisis le thème (couleur, personnage ou ambiance) et écris-le');
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM combats WHERE createur = ${moi} AND statut = ANY(${ACTIFS})`;
    if (n >= 3) return erreur('Tu as déjà 3 combats en attente', 429);
    const limite = (genre === 'duel' && await verifierLimite(moi, 'duels')) || await verifierLimite(moi, 'combats');
    if (limite) return limite;

    if (genre === 'duel') {
      if (!isId(String(b.inviteId || '')) || String(b.inviteId) === String(moi)) return erreur('Choisis la personne à défier');
      const [u] = await sql`SELECT id FROM users WHERE id = ${b.inviteId}`;
      if (!u) return erreur('Membre introuvable', 404);
      if (!(await seSuiventMutuellement(moi, u.id))) return erreur('Pour un duel, vous devez vous suivre mutuellement', 403);
      const [c] = await sql`
        INSERT INTO combats (genre, createur, invite, categorie, theme_type, theme, statut, soumission_fin)
        VALUES ('duel', ${moi}, ${u.id}, ${categorie}, ${themeType}, ${theme}, 'invitation', now() + make_interval(days => ${COMBATS.joursSoumission}))
        RETURNING id`;
      await sql`INSERT INTO combat_participants (combat_id, user_id) VALUES (${c.id}, ${moi})`;
      prevenir('combats', { ids: [u.id] }, { titre: 'Invitation à un duel', texte: `Thème : ${theme}. Tu as 5 jours pour accepter.`, lien: '/combats' });
      return NextResponse.json({ ok: true, id: c.id });
    }
    const [c] = await sql`
      INSERT INTO combats (genre, createur, categorie, theme_type, theme, statut, soumission_fin, places)
      VALUES ('joute', ${moi}, ${categorie}, ${themeType}, ${theme}, 'ouvert', now() + make_interval(days => ${COMBATS.joursSoumission}), ${places})
      RETURNING id`;
    await sql`INSERT INTO combat_participants (combat_id, user_id) VALUES (${c.id}, ${moi})`;
    return NextResponse.json({ ok: true, id: c.id });
  }

  const [c] = await sql`SELECT * FROM combats WHERE id = ${Number(b.id)}`;
  if (!c) return erreur('Combat introuvable', 404);
  const [moiDedans] = await sql`SELECT page_id FROM combat_participants WHERE combat_id = ${c.id} AND user_id = ${moi}`;

  if (b.action === 'accepter') {
    if (c.statut !== 'invitation' || String(c.invite) !== String(moi)) return erreur('Tu ne peux pas accepter ce duel', 403);
    const limite = await verifierLimite(moi, 'duels', { combatId: c.id }) || await verifierLimite(moi, 'combats', { combatId: c.id });
    if (limite) return limite;
    const maj = await sql`UPDATE combats SET statut = 'soumission', soumission_fin = now() + make_interval(days => ${COMBATS.joursSoumission})
      WHERE id = ${c.id} AND statut = 'invitation' RETURNING id`;
    if (!maj.length) return erreur('Ce duel n’est plus en attente', 409);
    await sql`INSERT INTO combat_participants (combat_id, user_id) VALUES (${c.id}, ${moi}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'rejoindre') {
    if (c.genre !== 'joute' || c.statut !== 'ouvert') return erreur('Cette joute n’accepte plus de coloristes', 403);
    if (moiDedans) return NextResponse.json({ ok: true });
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM combat_participants WHERE combat_id = ${c.id}`;
    if (n >= (c.places || COMBATS.maxJoute)) return erreur('Cette joute est complète', 409);
    const limite = await verifierLimite(moi, 'combats', { combatId: c.id });
    if (limite) return limite;
    await sql`INSERT INTO combat_participants (combat_id, user_id) VALUES (${c.id}, ${moi}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'refuser') {
    if (c.statut !== 'invitation' || String(c.invite) !== String(moi)) return erreur('Impossible', 403);
    await sql`UPDATE combats SET statut = 'refuse' WHERE id = ${c.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'annuler') {
    if (String(c.createur) !== String(moi)) return erreur('Impossible', 403);
    const [{ autres }] = await sql`SELECT count(*)::int AS autres FROM combat_participants WHERE combat_id = ${c.id} AND user_id <> ${moi}`;
    const annulable = c.statut === 'invitation' || (c.statut === 'ouvert' && !autres) || ['refuse', 'annule'].includes(c.statut);
    if (!annulable) return erreur('Le combat a déjà commencé', 403);
    await sql`DELETE FROM combats WHERE id = ${c.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'soumettre') {
    const page = await monColoriage(b.pageId, c.categorie);
    if (!page) return erreur('Choisis un de tes coloriages du bon type');
    if (c.genre === 'duel') {
      if (c.statut !== 'soumission' || !moiDedans) return erreur('Tu ne peux pas soumettre de coloriage à ce duel', 403);
    } else {
      if (c.statut !== 'ouvert') return erreur('Cette joute n’accepte plus de coloriage', 403);
      if (!moiDedans) {
        const [{ n }] = await sql`SELECT count(*)::int AS n FROM combat_participants WHERE combat_id = ${c.id}`;
        if (n >= (c.places || COMBATS.maxJoute)) return erreur('Cette joute est complète', 409);
        const limite = await verifierLimite(moi, 'combats', { combatId: c.id });
        if (limite) return limite;
      }
    }
    const [deja] = await sql`SELECT 1 FROM combat_participants WHERE combat_id = ${c.id} AND page_id = ${page.id} AND user_id <> ${moi}`;
    if (deja) return erreur('Ce coloriage est déjà dans ce combat');
    await sql`
      INSERT INTO combat_participants (combat_id, user_id, page_id, soumis_le) VALUES (${c.id}, ${moi}, ${page.id}, now())
      ON CONFLICT (combat_id, user_id) DO UPDATE SET page_id = EXCLUDED.page_id, soumis_le = now()`;
    await verifierDepartVerdict(c.id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'quitter') {
    if (c.genre !== 'joute' || c.statut !== 'ouvert' || String(c.createur) === String(moi) || !moiDedans) return erreur('Impossible', 403);
    await sql`DELETE FROM combat_participants WHERE combat_id = ${c.id} AND user_id = ${moi}`;
    return NextResponse.json({ ok: true });
  }
  return erreur('Action inconnue');
}
