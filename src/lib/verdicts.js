import { sql } from '@/lib/db';
import { isId } from '@/lib/pages';

// Verdicts de l'Assemblée.
// Une activité = epreuve:<id>, combat:<id> ou match:<id> (match d'un tournoi).
//  - une personne rend un seul verdict par activité, et peut le changer une seule fois ;
//  - on ne voit jamais l'autrice ou l'auteur des coloriages, ni le nombre de verdicts par coloriage ;
//  - on ne peut pas voter pour son propre coloriage, ni dans un combat auquel on participe.

export function lireActivite(activite) {
  const m = /^(epreuve|combat|match):(\d+)$/.exec(String(activite || ''));
  return m ? { genre: m[1], id: Number(m[2]) } : null;
}

// Coloriages en lice, personnes qui ne peuvent pas voter et fenêtre de vote
async function lice({ genre, id }) {
  if (genre === 'epreuve') {
    const [d] = await sql`
      SELECT (debut <= (now() AT TIME ZONE 'America/Toronto')::date AND fin >= (now() AT TIME ZONE 'America/Toronto')::date AND NOT cloture) AS ouvert,
             (((fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin
      FROM defis WHERE id = ${id} AND genre IN ('officiel', 'modo', 'cheffe')`;
    if (!d) return null;
    const entrees = await sql`
      SELECT dp.user_id, dp.page_id, dp.cree_le AS soumis_le
      FROM defi_participations dp JOIN pages p ON p.id = dp.page_id
      WHERE dp.defi_id = ${id} AND dp.page_id IS NOT NULL`;
    return { ouvert: d.ouvert, fin: d.fin, entrees, exclus: [] };
  }
  if (genre === 'combat') {
    const [c] = await sql`SELECT statut, verdict_fin, (statut = 'verdict' AND verdict_fin > now()) AS ouvert FROM combats WHERE id = ${id}`;
    if (!c) return null;
    const entrees = await sql`SELECT user_id, page_id, soumis_le FROM combat_participants WHERE combat_id = ${id} AND page_id IS NOT NULL`;
    const tous = await sql`SELECT user_id FROM combat_participants WHERE combat_id = ${id}`;
    return { ouvert: c.ouvert, fin: c.verdict_fin, entrees, exclus: tous.map((t) => String(t.user_id)) };
  }
  const [m] = await sql`
    SELECT joueur_a, joueur_b, page_a, page_b, soumis_a, soumis_b, verdict_fin,
           (soumission_fin <= now() AND verdict_fin > now() AND gagnant IS NULL AND page_a IS NOT NULL AND page_b IS NOT NULL) AS ouvert
    FROM tournoi_matchs WHERE id = ${id}`;
  if (!m) return null;
  const entrees = [
    m.page_a && { user_id: m.joueur_a, page_id: m.page_a, soumis_le: m.soumis_a },
    m.page_b && { user_id: m.joueur_b, page_id: m.page_b, soumis_le: m.soumis_b },
  ].filter(Boolean);
  return { ouvert: m.ouvert, fin: m.verdict_fin, entrees, exclus: [m.joueur_a, m.joueur_b].filter(Boolean).map(String) };
}

// Ce que voit une personne : les coloriages (sans autrice ni compte), son verdict et le nombre de votants
export async function vueVerdict(activite, userId) {
  const a = lireActivite(activite);
  const l = a && (await lice(a));
  if (!l) return null;
  let pages = l.entrees.length
    ? await sql`
        SELECT id, OCTET_LENGTH(image_b64) AS img_size, user_id = ${userId} AS a_moi
        FROM pages WHERE id = ANY(${l.entrees.map((e) => e.page_id)})
        ORDER BY md5(id::text || ${String(userId)})`
    : [];
  // Combats et matchs de tournoi : « Coloriste 1, 2… » dans l'ordre de soumission, le même pour tout le monde
  const numerote = a.genre !== 'epreuve';
  if (numerote) {
    const ordre = [...l.entrees].sort((x, y) => new Date(x.soumis_le) - new Date(y.soumis_le)).map((e) => String(e.page_id));
    pages = [...pages].sort((x, y) => ordre.indexOf(String(x.id)) - ordre.indexOf(String(y.id)))
      .map((p) => ({ ...p, numero: ordre.indexOf(String(p.id)) + 1 }));
  }
  const [mien] = await sql`SELECT page_id, changements FROM verdicts WHERE activite = ${activite} AND user_id = ${userId}`;
  const [{ total }] = await sql`SELECT count(*)::int AS total FROM verdicts WHERE activite = ${activite}`;
  const participant = l.exclus.includes(String(userId));
  return {
    activite,
    ouvert: l.ouvert,
    fin: l.fin,
    numerote,
    fiches: pages.map((p) => ({ id: p.id, img_size: p.img_size, a_moi: p.a_moi, numero: p.numero || null })),
    monVerdict: mien?.page_id || null,
    peutChanger: !mien || mien.changements < 1,
    total,
    peutVoter: l.ouvert && !participant,
    raison: participant ? 'Tu participes à ce combat : tu ne peux pas rendre de verdict.' : !l.ouvert ? 'Le verdict n’est pas ouvert.' : '',
  };
}

// Rendre (ou changer une seule fois) son verdict
export async function rendreVerdict(activite, userId, pageId) {
  const a = lireActivite(activite);
  const l = a && (await lice(a));
  if (!l) return { erreur: 'Activité introuvable', status: 404 };
  if (!l.ouvert) return { erreur: 'Le verdict n’est pas ouvert', status: 403 };
  if (l.exclus.includes(String(userId))) return { erreur: 'Tu ne peux pas rendre de verdict dans un combat auquel tu participes', status: 403 };
  if (!isId(String(pageId || ''))) return { erreur: 'Coloriage introuvable', status: 404 };
  const entree = l.entrees.find((e) => String(e.page_id) === String(pageId));
  if (!entree) return { erreur: 'Ce coloriage n’est pas en lice', status: 400 };
  if (String(entree.user_id) === String(userId)) return { erreur: 'Tu ne peux pas voter pour ton propre coloriage', status: 403 };

  const [mien] = await sql`SELECT page_id, changements FROM verdicts WHERE activite = ${activite} AND user_id = ${userId}`;
  if (!mien) {
    await sql`INSERT INTO verdicts (activite, user_id, page_id) VALUES (${activite}, ${userId}, ${pageId}) ON CONFLICT DO NOTHING`;
    return { ok: true };
  }
  if (String(mien.page_id) === String(pageId)) return { ok: true };
  if (mien.changements >= 1) return { erreur: 'Tu as déjà changé ton verdict une fois : il est définitif', status: 403 };
  await sql`UPDATE verdicts SET page_id = ${pageId}, changements = changements + 1 WHERE activite = ${activite} AND user_id = ${userId}`;
  return { ok: true };
}

// Gagnant.e d'après les verdicts. Égalité : le coloriage soumis le premier l'emporte.
// sansVote : 'aucun' (pas de gagnant sans verdict) ou 'premier' (le premier soumis l'emporte, pour les tournois)
export async function gagnantVerdict(activite, entrees, { sansVote = 'aucun', egalite = 'premier' } = {}) {
  if (!entrees.length) return null;
  const votes = await sql`SELECT page_id, count(*)::int AS n FROM verdicts WHERE activite = ${activite} GROUP BY page_id`;
  const compte = Object.fromEntries(votes.map((v) => [String(v.page_id), v.n]));
  const classes = [...entrees].sort((x, y) =>
    (compte[String(y.page_id)] || 0) - (compte[String(x.page_id)] || 0) || new Date(x.soumis_le) - new Date(y.soumis_le));
  const meilleur = compte[String(classes[0].page_id)] || 0;
  if (!meilleur && sansVote === 'aucun') return null;
  if (egalite === 'aucun' && classes[1] && (compte[String(classes[1].page_id)] || 0) === meilleur) return null;
  return classes[0].user_id;
}
