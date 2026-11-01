import { after } from 'next/server';
import { sql } from '@/lib/db';
import { notifier, pushActif } from '@/lib/push';
import { typesVisibles } from '@/lib/typesColoriage';
import { categoriesBingoVisibles } from '@/lib/visibilite';
import { TYPES_ACTIVITES } from '@/lib/activitesNoms';

// Prévient les membres le jour où une activité commence (tout de suite si elle commence aujourd'hui,
// sinon au passage quotidien de /api/rappels). Chaque activité n'est annoncée qu'une fois.
// Les épreuves de groupe, créées par les membres, ne sont pas annoncées pour éviter trop de notifications.
export async function annoncerActivites() {
  if (!pushActif()) return 0;
  const nouvelles = await sql`
    WITH jour AS (SELECT (now() AT TIME ZONE 'America/Toronto')::date AS j)
    SELECT x.* FROM (
      SELECT 'bingo:' || b.id AS cle, 'bingo' AS genre, b.titre, b.categorie, '/defis' AS lien
      FROM bingos b, jour WHERE NOT b.cloture AND COALESCE(b.debut, b.cree_le::date) BETWEEN jour.j - 2 AND jour.j
      UNION ALL
      SELECT 'aventure:' || a.id, a.genre, a.titre, a.categorie, '/aventures/' || a.id
      FROM aventures a, jour WHERE a.debut BETWEEN jour.j - 2 AND jour.j
      UNION ALL
      SELECT 'defi:' || d.id, 'defi_' || d.genre, d.titre, d.categorie, '/defis'
      FROM defis d, jour WHERE d.genre <> 'groupe' AND NOT d.cloture AND COALESCE(d.debut, d.mois) BETWEEN jour.j - 2 AND jour.j
      UNION ALL
      SELECT 'tournoi:' || t.id, 'tournoi', t.titre, t.categorie, '/combats'
      FROM tournois t WHERE t.statut = 'inscriptions' AND t.cree_le > now() - interval '2 days'
    ) x
    WHERE NOT EXISTS (SELECT 1 FROM annonces_envoyees e WHERE e.cle = x.cle)`;
  if (!nouvelles.length) return 0;

  const membres = await sql`
    SELECT DISTINCT u.id, u.types_pratiques, u.types_vus FROM users u JOIN push_abonnements p ON p.user_id = u.id
    WHERE COALESCE((u.notifs ->> 'activites')::boolean, true)`;
  const aAnnoncer = [];
  for (const n of nouvelles) {
    const reservee = await sql`INSERT INTO annonces_envoyees (cle) VALUES (${n.cle}) ON CONFLICT DO NOTHING RETURNING cle`;
    if (reservee.length) aAnnoncer.push(n);
  }
  let envoyes = 0;
  for (const m of membres) {
    const vus = typesVisibles(m.types_pratiques, m.types_vus);
    const pourMoi = aAnnoncer.filter((n) => (n.genre === 'bingo' ? categoriesBingoVisibles(vus).includes(n.categorie) : n.categorie === 'tous' || vus.includes(n.categorie)));
    if (!pourMoi.length) continue;
    const nom = (n) => TYPES_ACTIVITES[n.genre] || 'Activité';
    const message = pourMoi.length === 1
      ? { titre: `Nouveau : ${nom(pourMoi[0])}`, texte: pourMoi[0].titre, lien: pourMoi[0].lien }
      : { titre: `${pourMoi.length} nouvelles activités`, texte: pourMoi.map((n) => `${nom(n)} : ${n.titre}`).join(' · ').slice(0, 180), lien: '/defis' };
    envoyes += await notifier(m.id, message);
  }
  return envoyes;
}

export function annoncerBientot() {
  if (!pushActif()) return;
  after(async () => {
    try { await annoncerActivites(); } catch (e) { console.error('Annonce des activités :', e); }
  });
}
