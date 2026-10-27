import { neon } from '@neondatabase/serverless';

const BASE = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
const BYPASS = process.env.VERCEL_BYPASS || '';
if (!/^https:\/\/kromadex-[a-z0-9-]+\.vercel\.app$/.test(BASE)) { console.error('PREVIEW_URL doit être une prévisualisation *.vercel.app.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const [estTest] = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'environnement_test'`;
if (!estTest) { console.error('REFUS : DATABASE_URL ne vise pas la base de test.'); process.exit(1); }

let reussis = 0, echecs = 0;
const verifier = (nom, ok, detail = '') => { ok ? reussis++ : echecs++; console.log(`  ${ok ? 'ok   ' : 'ÉCHEC'} ${nom} ${ok ? '' : detail}`); };

async function appel(chemin, { methode = 'GET', json, entetes = {} } = {}) {
  const h = { 'x-vercel-protection-bypass': BYPASS, origin: BASE, ...entetes };
  if (json) h['content-type'] = 'application/json';
  const r = await fetch(BASE + chemin, { method: methode, headers: h, body: json && JSON.stringify(json), redirect: 'manual' });
  return { status: r.status, cookies: r.headers.getSetCookie?.() || [], donnees: await r.json().catch(() => null) };
}

const debut = new Date();
console.log('\nProtection de la prévisualisation');
const sansJeton = await fetch(BASE + '/login', { redirect: 'manual' });
verifier('sans jeton, la prévisualisation est fermée au public (401 ou redirection)', [401, 302, 303, 307].includes(sansJeton.status), sansJeton.status);

console.log('\nDétection de l’IP et limite des connexions');
const statuts = [];
for (let i = 1; i <= 6; i++) {
  const ip = `203.0.113.${i}`;
  const r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'test2@kromadex.test', password: 'faux' },
    entetes: { 'x-real-ip': ip, 'x-forwarded-for': ip, forwarded: `for=${ip}`, 'true-client-ip': ip, 'cf-connecting-ip': ip, 'x-client-ip': ip } });
  statuts.push(r.status);
}
verifier('IP inventées ignorées : le 6e essai est bloqué malgré 6 « IP » différentes', statuts.slice(0, 5).every((s) => s === 401) && statuts[5] === 429, statuts.join(','));
let r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'test2@kromadex.test', password: 'mdp1234!' } });
verifier('même le bon mot de passe est bloqué depuis cette adresse', r.status === 429, r.status);
const [{ n: ipsDistinctes }] = await sql`SELECT count(DISTINCT ip_h)::int AS n FROM essais_limites WHERE genre = 'connexion' AND cree_le >= ${debut.toISOString()}`;
verifier('une seule adresse IP notée pour ces essais (la vraie, fixée par Vercel)', ipsDistinctes === 1, ipsDistinctes);

console.log('\nBase utilisée');
r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'admin@kromadex.test', password: 'mdp1234!' } });
verifier('connexion du compte admin@kromadex.test (il n’existe que dans la base de test)', r.status === 200, r.status);

console.log('\nCookies');
r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'test1@kromadex.test', password: 'mdp1234!' } });
const session = r.cookies.find((c) => c.startsWith('cm_session=')) || '';
const appareil = r.cookies.find((c) => c.startsWith('cm_appareil=')) || '';
const attributsOk = (c) => /HttpOnly/i.test(c) && /Secure/i.test(c) && /SameSite=lax/i.test(c);
verifier('connexion réussie', r.status === 200, r.status);
verifier('cookie de session HttpOnly, Secure, SameSite=Lax', attributsOk(session));
verifier('cookie « appareil connu » HttpOnly, Secure, SameSite=Lax', attributsOk(appareil));

console.log('\nCSRF');
r = await appel('/api/auth/logout', { methode: 'POST', entetes: { origin: 'https://evil.example' } });
verifier('écriture depuis un autre site refusée (403)', r.status === 403, r.status);

console.log('\nAucune action extérieure');
r = await appel('/api/auth/oubli', { methode: 'POST', json: { email: 'test1@kromadex.test' } });
const [demande] = await sql`SELECT 1 FROM demandes WHERE type = 'motdepasse' AND cree_le >= ${debut.toISOString()}`;
verifier('mot de passe oublié : aucun courriel, le lien est noté dans la base de test', r.status === 200 && Boolean(demande));

console.log('\nAvis ThriveCart (mode test attendu)');
const SECRET = process.env.THRIVECART_SECRET;
const [t2] = await sql`SELECT id, plus_statut, plus_jusqu, plus_formule FROM users WHERE email = 'test2@kromadex.test'`;
const marque = `apercu-${Date.now()}`;
const avis = (extra) => ({ thrivecart_secret: SECRET, mode: 'test', event: 'order.subscription_payment', event_id: `${marque}-1`,
  passthrough: { user_id: t2.id }, order: { total: '379', total_str: '3.79' }, ...extra });
const envoi = (corps) => appel('/api/paiements/thrivecart', { methode: 'POST', json: corps, entetes: { origin: '' } });
const plus = async () => (await sql`SELECT plus_statut, plus_jusqu FROM users WHERE id = ${t2.id}`)[0];
const [a1, a2] = await Promise.all([envoi(avis()), envoi(avis())]);
const p1 = await plus();
const jours = p1.plus_jusqu ? (new Date(p1.plus_jusqu) - Date.now()) / 86400000 : 0;
verifier('avis « test » : deux copies simultanées acceptées (200)', a1.status === 200 && a2.status === 200, `${a1.status},${a2.status}`);
verifier('avis « test » : un seul mois ajouté', p1.plus_statut === 'actif' && jours > 32 && jours < 35, jours.toFixed(1));
const [{ n: cles }] = await sql`SELECT count(*)::int AS n FROM paiements_traites WHERE cle LIKE ${'%' + marque + '%'}`;
verifier('avis « test » : noté une seule fois', cles === 1, cles);
r = await envoi(avis({ mode: 'live', event_id: `${marque}-2` }));
verifier('avis « live » ignoré par la prévisualisation (mode test)', r.donnees?.ignore === 'mode' && String((await plus()).plus_jusqu) === String(p1.plus_jusqu));
r = await envoi(avis({ thrivecart_secret: 'faux', event_id: `${marque}-3` }));
verifier('avis forgé (mauvais secret) refusé (401)', r.status === 401, r.status);
await sql`UPDATE users SET plus_statut = ${t2.plus_statut}, plus_jusqu = ${t2.plus_jusqu}, plus_formule = ${t2.plus_formule} WHERE id = ${t2.id}`;
await sql`DELETE FROM paiements_traites WHERE cle LIKE ${'%' + marque + '%'}`;
await sql`DELETE FROM paiements_evenements WHERE recu_le >= ${debut.toISOString()}`;

await sql`DELETE FROM essais_limites WHERE cree_le >= ${debut.toISOString()}`;
await sql`DELETE FROM demandes WHERE type = 'motdepasse' AND cree_le >= ${debut.toISOString()}`;
await sql`DELETE FROM reinitialisations WHERE cree_le >= ${debut.toISOString()}`;
await sql`DELETE FROM sessions`;
await sql`DELETE FROM appareils_connus`;
console.log(`\nRésultat : ${reussis} réussi(s), ${echecs} échec(s).`);
process.exit(echecs ? 1 : 0);
