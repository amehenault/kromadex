import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'node:crypto';

const BASE = process.env.BASE || 'http://localhost:3123';
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) { console.error('Ces tests ne visent que un serveur local.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const [estTest] = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'environnement_test'`;
if (!estTest) { console.error('REFUS : cette base n’est pas marquée comme base de test.'); process.exit(1); }
const SECRET = process.env.CRON_SECRET;
if (!SECRET) { console.error('CRON_SECRET manquant.'); process.exit(1); }

const marque = `test-nettoyage-${Date.now()}`;
let reussis = 0, echecs = 0;
function verifier(nom, condition, detail = '') {
  if (condition) { reussis++; console.log(`  ok   ${nom}`); }
  else { echecs++; console.log(`  ÉCHEC ${nom} ${detail}`); }
}
const appel = (chemin, secret = SECRET) => fetch(BASE + chemin, { headers: secret ? { authorization: `Bearer ${secret}` } : {} })
  .then(async (r) => ({ status: r.status, donnees: await r.json().catch(() => null) }));
const jeton = () => `${marque}-${randomBytes(8).toString('hex')}`;

const [u] = await sql`SELECT id FROM users WHERE email = 'test1@kromadex.test'`;
const j = { vieux: [], recents: [] };
try {
  const [d1] = await sql`INSERT INTO demandes (user_id, type, message, statut, ferme_le, maj_le) VALUES (${u.id}, 'bug', ${marque}, 'resolue', now() - interval '31 days', now() - interval '31 days') RETURNING id`;
  const [d2] = await sql`INSERT INTO demandes (user_id, type, message, statut, ferme_le) VALUES (${u.id}, 'bug', ${marque}, 'resolue', now() - interval '29 days') RETURNING id`;
  const [d3] = await sql`INSERT INTO demandes (user_id, type, message, statut, ferme_le, maj_le) VALUES (${u.id}, 'bug', ${marque}, 'en_cours', NULL, now() - interval '90 days') RETURNING id`;
  const [p1] = await sql`INSERT INTO paiements_evenements (evenement, resultat, recu_le) VALUES ('x', ${marque}, now() - interval '31 days') RETURNING id`;
  const [p2] = await sql`INSERT INTO paiements_evenements (evenement, resultat, recu_le) VALUES ('x', ${marque}, now() - interval '29 days') RETURNING id`;
  const [e1] = await sql`INSERT INTO essais_limites (genre, ip_h, cree_le) VALUES ('connexion', ${marque}, now() - interval '3 days') RETURNING id`;
  const [e2] = await sql`INSERT INTO essais_limites (genre, ip_h, cree_le) VALUES ('connexion', ${marque}, now() - interval '1 day') RETURNING id`;
  const r1 = jeton(), r2 = jeton(), s1 = jeton(), s2 = jeton(), a1 = jeton(), a2 = jeton();
  await sql`INSERT INTO reinitialisations (jeton_hash, user_id, expire_le) VALUES (${r1}, ${u.id}, now() - interval '2 days'), (${r2}, ${u.id}, now() + interval '1 hour')`;
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${s1}, ${u.id}, now() - interval '1 minute'), (${s2}, ${u.id}, now() + interval '1 day')`;
  await sql`INSERT INTO appareils_connus (jeton_hash, user_id, cree_le) VALUES (${a1}, ${u.id}, now() - interval '400 days'), (${a2}, ${u.id}, now() - interval '300 days')`;
  const existe = async () => ({
    d1: (await sql`SELECT 1 FROM demandes WHERE id = ${d1.id}`).length, d2: (await sql`SELECT 1 FROM demandes WHERE id = ${d2.id}`).length,
    d3: (await sql`SELECT 1 FROM demandes WHERE id = ${d3.id}`).length,
    p1: (await sql`SELECT 1 FROM paiements_evenements WHERE id = ${p1.id}`).length, p2: (await sql`SELECT 1 FROM paiements_evenements WHERE id = ${p2.id}`).length,
    e1: (await sql`SELECT 1 FROM essais_limites WHERE id = ${e1.id}`).length, e2: (await sql`SELECT 1 FROM essais_limites WHERE id = ${e2.id}`).length,
    r1: (await sql`SELECT 1 FROM reinitialisations WHERE jeton_hash = ${r1}`).length, r2: (await sql`SELECT 1 FROM reinitialisations WHERE jeton_hash = ${r2}`).length,
    s1: (await sql`SELECT 1 FROM sessions WHERE token_hash = ${s1}`).length, s2: (await sql`SELECT 1 FROM sessions WHERE token_hash = ${s2}`).length,
    a1: (await sql`SELECT 1 FROM appareils_connus WHERE jeton_hash = ${a1}`).length, a2: (await sql`SELECT 1 FROM appareils_connus WHERE jeton_hash = ${a2}`).length,
  });

  console.log('\nNettoyage automatique');
  let r = await appel('/api/nettoyage', '');
  verifier('sans le secret : refusé (401)', r.status === 401, r.status);
  r = await appel('/api/nettoyage', 'mauvais');
  verifier('mauvais secret : refusé (401)', r.status === 401, r.status);
  r = await appel('/api/nettoyage?simulation=1');
  const avant = await existe();
  verifier('simulation : compte les vieilles lignes', r.status === 200 && r.donnees.actif === false && Object.values(r.donnees.resultats).every((n) => n >= 1), JSON.stringify(r.donnees));
  verifier('simulation : rien n’est supprimé', Object.values(avant).every((n) => n === 1), JSON.stringify(avant));
  r = await appel('/api/nettoyage');
  const apres = await existe();
  verifier('nettoyage actif lancé', r.status === 200 && r.donnees.actif === true, JSON.stringify(r.donnees));
  verifier('demande fermée depuis 31 jours supprimée', apres.d1 === 0);
  verifier('demande fermée depuis 29 jours gardée', apres.d2 === 1);
  verifier('demande rouverte gardée même si vieille', apres.d3 === 1);
  verifier('avis ThriveCart de 31 jours supprimé, celui de 29 jours gardé', apres.p1 === 0 && apres.p2 === 1);
  verifier('tentative de 3 jours supprimée, celle d’hier gardée', apres.e1 === 0 && apres.e2 === 1);
  verifier('lien de réinitialisation expiré supprimé, lien valide gardé', apres.r1 === 0 && apres.r2 === 1);
  verifier('session expirée supprimée, session valide gardée', apres.s1 === 0 && apres.s2 === 1);
  verifier('appareil connu de plus d’un an supprimé, celui de 300 jours gardé', apres.a1 === 0 && apres.a2 === 1);
} catch (e) {
  echecs++;
  console.error('\nErreur pendant les tests :', e);
} finally {
  await sql`DELETE FROM demandes WHERE message = ${marque}`;
  await sql`DELETE FROM paiements_evenements WHERE resultat = ${marque}`;
  await sql`DELETE FROM essais_limites WHERE ip_h = ${marque}`;
  await sql`DELETE FROM reinitialisations WHERE jeton_hash LIKE ${marque + '%'}`;
  await sql`DELETE FROM sessions WHERE token_hash LIKE ${marque + '%'}`;
  await sql`DELETE FROM appareils_connus WHERE jeton_hash LIKE ${marque + '%'}`;
  console.log(`\nRésultat : ${reussis} réussi(s), ${echecs} échec(s). Données de test effacées.`);
  process.exit(echecs ? 1 : 0);
}
