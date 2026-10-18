// Tests de non-régression de sécurité, contre un serveur LOCAL branché sur la branche Neon de TEST.
// Jamais le site en ligne, jamais la base de production (le script refuse une base non marquée « test »).
//
//   1. npm run db:preparer-test   (une seule fois : catalogue et comptes de test dans la branche de test)
//   2. npm run build
//   3. npm run start:test         (serveur en mode test : .env.local et ses clés de production sont ignorés)
//   4. npm run test:securite
//
// Utilise les comptes test1, test2 (Coloristes) et test3 (Sentinelle), mot de passe « mdp1234! ».
// Tout ce que le test crée est effacé à la fin, et l'état des comptes de test est remis comme avant.
import { neon } from '@neondatabase/serverless';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:3123';
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) { console.error('Ces tests ne visent que un serveur local.'); process.exit(1); }
const SECRET = process.env.THRIVECART_SECRET_TEST || 'secret-test-local';
const MDP = 'mdp1234!';
const sql = neon(process.env.DATABASE_URL);
// Garde-fou : seulement une base de test préparée par scripts/preparer-base-test.mjs
const [estTest] = await sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'environnement_test'`;
if (!estTest) { console.error('REFUS : cette base n’est pas marquée comme base de test.'); process.exit(1); }
const sha = (t) => createHash('sha256').update(String(t)).digest('hex');
const debut = new Date();
const marque = `test-securite-${Date.now()}`;

let reussis = 0, echecs = 0;
function verifier(nom, condition, detail = '') {
  if (condition) { reussis++; console.log(`  ok   ${nom}`); }
  else { echecs++; console.log(`  ÉCHEC ${nom} ${detail}`); }
}

// Requête avec une adresse IP simulée (en local, personne d'autre ne fixe x-real-ip)
async function appel(chemin, { methode = 'GET', corps, json, cookie, ip = '198.51.100.1', entetes = {} } = {}) {
  const h = { 'x-real-ip': ip, origin: BASE, ...entetes };
  if (cookie) h.cookie = cookie;
  let body = corps;
  if (json !== undefined) { h['content-type'] = 'application/json'; body = JSON.stringify(json); }
  const r = await fetch(BASE + chemin, { method: methode, headers: h, body, redirect: 'manual' });
  const texte = await r.text();
  let donnees = null; try { donnees = JSON.parse(texte); } catch {}
  return { status: r.status, headers: r.headers, donnees, texte, cookies: r.headers.getSetCookie?.() || [] };
}
const cookieDe = (r, nom) => r.cookies.map((c) => c.split(';')[0]).find((c) => c.startsWith(`${nom}=`)) || '';

async function connexion(email, ip) {
  const r = await appel('/api/auth/login', { methode: 'POST', json: { email, password: MDP }, ip });
  if (r.status !== 200) throw new Error(`Connexion impossible pour ${email} (${r.status})`);
  return { session: cookieDe(r, 'cm_session'), appareil: cookieDe(r, 'cm_appareil') };
}

const imagePng = () => sharp({ create: { width: 300, height: 200, channels: 3, background: '#4bbca1' } }).png().toBuffer();
// Mêmes champs que ceux envoyés par l'éditeur de coloriage
const formulaire = (champs, fichier, type = 'image/jpeg', nom = 'image.jpg') => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ tome: '', page_no: '', memo: '', codes: '[]', ...champs })) fd.append(k, v);
  if (fichier) fd.append('image', new Blob([fichier], { type }), nom);
  return fd;
};
const HTML = Buffer.from('<html><body><script>fetch("/api/roles")</script></body></html>');
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

// État de départ des comptes de test (remis à la fin)
const comptes = Object.fromEntries((await sql`SELECT id, email, role, xp, level, plus_statut, plus_jusqu, plus_formule, avatar_b64, avatar_type, avatar_maj
  FROM users WHERE email IN ('test1@kromadex.test', 'test2@kromadex.test', 'test3@kromadex.test')`).map((u) => [u.email.split('@')[0], u]));
if (Object.keys(comptes).length !== 3) { console.error('Comptes de test introuvables.'); process.exit(1); }

try {
  const s1 = (await connexion('test1@kromadex.test', '198.51.100.11')).session;
  const s2 = (await connexion('test2@kromadex.test', '198.51.100.12')).session;
  const s3 = (await connexion('test3@kromadex.test', '198.51.100.13')).session;

  console.log('\n1. Images des coloriages');
  let r = await appel('/api/pages', { methode: 'POST', cookie: s1, corps: formulaire({ title: `${marque}-html` }, HTML) });
  verifier('HTML déguisé en JPEG refusé (415)', r.status === 415, r.status);
  r = await appel('/api/pages', { methode: 'POST', cookie: s1, corps: formulaire({ title: `${marque}-svg` }, SVG, 'image/svg+xml', 'a.svg') });
  verifier('SVG avec script refusé (415)', r.status === 415, r.status);
  const [{ n: crees }] = await sql`SELECT count(*)::int AS n FROM pages WHERE title LIKE ${marque + '-%'}`;
  verifier('aucune fiche créée pour les fichiers refusés', crees === 0, crees);

  // Brouillon sans image : pas d'XP ; image ajoutée ensuite : XP une seule fois
  r = await appel('/api/pages', { methode: 'POST', cookie: s1, corps: formulaire({ title: `${marque}-brouillon` }) });
  verifier('fiche sans image (brouillon) enregistrée', r.status === 200, r.status);
  const [brouillon] = await sql`SELECT id FROM pages WHERE title = ${marque + '-brouillon'}`;
  const xpDe = async (id) => (await sql`SELECT xp FROM xp_journal WHERE cle = ${'page:' + id}`)[0]?.xp ?? 0;
  verifier('aucun XP pour une fiche sans image', (await xpDe(brouillon.id)) === 0);
  r = await appel(`/api/pages/${brouillon.id}`, { methode: 'PUT', cookie: s1, corps: formulaire({ title: `${marque}-brouillon`, publiee: '1', type_coloriage: 'cozy' }, await imagePng(), 'image/png', 'a.png') });
  verifier('image ajoutée au brouillon', r.status === 200, r.status);
  verifier('100 XP donnés quand l’image est ajoutée', (await xpDe(brouillon.id)) === 100);
  r = await appel(`/api/pages/${brouillon.id}`, { methode: 'PUT', cookie: s1, corps: formulaire({ title: `${marque}-brouillon`, publiee: '1', type_coloriage: 'cozy' }, await imagePng(), 'image/png', 'a.png') });
  const [{ n: lignesXp }] = await sql`SELECT count(*)::int AS n FROM xp_journal WHERE cle = ${'page:' + brouillon.id}`;
  verifier('changer l’image ne redonne pas d’XP', lignesXp === 1 && (await xpDe(brouillon.id)) === 100);

  const [stockee] = await sql`SELECT image_type, substr(image_b64, 1, 16) AS debut FROM pages WHERE id = ${brouillon.id}`;
  verifier('image stockée réencodée en WebP', stockee.image_type === 'image/webp' && Buffer.from(stockee.debut, 'base64').toString('latin1', 8, 12) === 'WEBP');

  r = await appel(`/api/pages/${brouillon.id}/image?s=1`, { cookie: s2 });
  verifier('image publiée servie à une autre personne', r.status === 200, r.status);
  verifier('en-tête Content-Type image/webp', r.headers.get('content-type') === 'image/webp', r.headers.get('content-type'));
  verifier('en-tête X-Content-Type-Options: nosniff', r.headers.get('x-content-type-options') === 'nosniff');
  verifier('en-tête CSP sandbox', /sandbox/.test(r.headers.get('content-security-policy') || ''));

  // Ancien fichier piégé déjà en base (enregistré avant la correction) : jamais servi
  const [piege] = await sql`INSERT INTO pages (user_id, title, image_b64, image_type, publiee, type_coloriage, publiee_le)
    VALUES (${comptes.test1.id}, ${marque + '-ancien-piege'}, ${HTML.toString('base64')}, 'image/jpeg', true, 'cozy', now()) RETURNING id`;
  r = await appel(`/api/pages/${piege.id}/image`, { cookie: s2 });
  verifier('ancien fichier HTML en base non servi (404)', r.status === 404, r.status);

  console.log('\n2. Accès aux données d’une autre personne');
  r = await appel(`/api/pages/${brouillon.id}`, { methode: 'PUT', cookie: s2, corps: formulaire({ title: 'pirate' }) });
  const [apres] = await sql`SELECT title FROM pages WHERE id = ${brouillon.id}`;
  verifier('test2 ne peut pas modifier la fiche de test1 (requête valide, sans effet)', r.status === 200 && apres.title === `${marque}-brouillon`, r.status);
  await appel(`/api/pages/${brouillon.id}`, { methode: 'DELETE', cookie: s2 });
  verifier('test2 ne peut pas supprimer la fiche de test1', (await sql`SELECT 1 FROM pages WHERE id = ${brouillon.id}`).length === 1);

  console.log('\n3. Couvertures de tomes et photo de profil');
  const tome = `${marque}-tome`;
  r = await appel('/api/tomes/cover', { methode: 'POST', cookie: s1, corps: formulaire({ tome }, HTML) });
  verifier('couverture HTML refusée (415)', r.status === 415, r.status);
  r = await appel('/api/tomes/cover', { methode: 'POST', cookie: s1, corps: formulaire({ tome }, await imagePng(), 'image/png', 'c.png') });
  verifier('vraie couverture acceptée', r.status === 200, r.status);
  r = await appel(`/api/tomes/cover?name=${encodeURIComponent(tome)}&format=img`, { cookie: s1 });
  verifier('couverture servie en WebP avec nosniff', r.headers.get('content-type') === 'image/webp' && r.headers.get('x-content-type-options') === 'nosniff');
  r = await appel('/api/user/avatar', { methode: 'POST', cookie: s1, json: { type: 'image/png', b64: HTML.toString('base64') } });
  verifier('photo de profil HTML annoncée PNG refusée (415)', r.status === 415, r.status);
  r = await appel('/api/user/avatar', { methode: 'POST', cookie: s1, json: { type: 'image/png', b64: (await imagePng()).toString('base64') } });
  verifier('vraie photo de profil acceptée', r.status === 200, r.status);
  r = await appel(`/api/user/avatar?id=${comptes.test1.id}`, { cookie: s2 });
  verifier('photo de profil servie en WebP avec nosniff', r.headers.get('content-type') === 'image/webp' && r.headers.get('x-content-type-options') === 'nosniff');

  console.log('\n4. Postes et courriels');
  r = await appel('/api/roles', { cookie: s1 });
  verifier('Coloriste : liste des membres refusée (403)', r.status === 403, r.status);
  r = await appel('/api/roles', { methode: 'PUT', cookie: s1, json: { targetUserId: comptes.test1.id, role: 'modo' } });
  const [roleT1] = await sql`SELECT role FROM users WHERE id = ${comptes.test1.id}`;
  verifier('Coloriste : ne peut pas se donner un poste', r.status === 403 && roleT1.role === 'coloriste', r.status);
  r = await appel('/api/abonnement', { methode: 'PUT', cookie: s1, json: { userId: comptes.test1.id } });
  verifier('Coloriste : ne peut pas s’offrir Kromadex+ (403)', r.status === 403, r.status);
  r = await appel('/api/roles', { cookie: s3 });
  verifier('Sentinelle : liste reçue sans aucun courriel', r.status === 200 && r.donnees.users.length > 0 && r.donnees.users.every((u) => !('email' in u)));
  r = await appel('/api/moderation', { cookie: s3 });
  verifier('Sentinelle : modération sans aucun courriel', r.status === 200 && r.donnees.membres.every((u) => !('email' in u)));
  for (const chemin of ['/api/bingos/validation', '/api/defis/signalements', '/api/mots-cles?gestion=1']) {
    r = await appel(chemin, { cookie: s3 });
    const liste = Object.values(r.donnees || {}).find(Array.isArray) || [];
    verifier(`Sentinelle : ${chemin} sans courriel`, r.status === 200 && liste.every((x) => !x.email));
  }
  await sql`UPDATE users SET role = 'admin' WHERE id = ${comptes.test3.id}`;
  r = await appel('/api/roles', { cookie: s3 });
  verifier('Invocatrice : les courriels sont présents', r.status === 200 && r.donnees.users.some((u) => u.email));
  await sql`UPDATE users SET role = ${comptes.test3.role} WHERE id = ${comptes.test3.id}`;

  console.log('\n5. Protection CSRF');
  r = await appel('/api/palettes', { methode: 'POST', cookie: s1, json: { nom: 'x', couleurs: ['#000000', '#FFFFFF'] }, entetes: { origin: 'https://evil.example' } });
  verifier('écriture depuis un autre site refusée (403)', r.status === 403, r.status);
  r = await appel('/api/palettes', { methode: 'POST', cookie: s1, json: { nom: 'x', couleurs: ['#000000', '#FFFFFF'] }, entetes: { origin: '', 'sec-fetch-site': 'cross-site' } });
  verifier('écriture « cross-site » sans Origin refusée (403)', r.status === 403, r.status);
  r = await appel('/api/auth/logout', { methode: 'POST', entetes: { origin: 'https://evil.example' } });
  verifier('déconnexion forcée depuis un autre site refusée (403)', r.status === 403, r.status);
  r = await appel('/api/paiements/thrivecart', { methode: 'POST', json: { event: 'x', thrivecart_secret: 'mauvais' }, entetes: { origin: 'https://evil.example' } });
  verifier('webhook exempté du CSRF mais mauvais secret refusé (401)', r.status === 401, r.status);

  console.log('\n6. Limitation des connexions');
  const email2 = 'test2@kromadex.test';
  const essais = [];
  for (let i = 0; i < 6; i++) essais.push((await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: 'faux' }, ip: '203.0.113.1' })).status);
  verifier('5 mauvais mots de passe acceptés, le 6e bloqué (429)', essais.slice(0, 5).every((s) => s === 401) && essais[5] === 429, essais.join(','));
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '203.0.113.1' });
  verifier('même le bon mot de passe est bloqué depuis cette adresse', r.status === 429, r.status);
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '203.0.113.2' });
  verifier('la titulaire se connecte depuis une autre adresse (pas de blocage du compte)', r.status === 200, r.status);
  const appareil2 = cookieDe(r, 'cm_appareil');
  verifier('un cookie « appareil connu » est donné après une connexion réussie', Boolean(appareil2));
  const attributs = r.cookies.find((c) => c.startsWith('cm_appareil=')) || '';
  verifier('cookie « appareil connu » HttpOnly et SameSite=Lax', /HttpOnly/i.test(attributs) && /SameSite=lax/i.test(attributs), attributs.replace(/=[0-9a-f]{64}/, '=<jeton>'));
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'test1@kromadex.test', password: 'faux' }, ip: '203.0.113.9' });
  verifier('aucun cookie « appareil connu » après un échec', !cookieDe(r, 'cm_appareil'));
  const [jetonsAvant] = await sql`SELECT count(*)::int AS n FROM appareils_connus`;
  r = await appel('/api/auth/register', { methode: 'POST', json: { email: 'pas-un-courriel' }, ip: '203.0.113.10' });
  verifier('aucun cookie « appareil connu » après une inscription refusée', !cookieDe(r, 'cm_appareil'));
  verifier('les jetons sont stockés en empreinte, jamais en clair',
    (await sql`SELECT count(*)::int AS n FROM appareils_connus WHERE jeton_hash = ${appareil2.split('=')[1]}`)[0].n === 0
    && (await sql`SELECT count(*)::int AS n FROM appareils_connus WHERE jeton_hash = ${sha(appareil2.split('=')[1])}`)[0].n === 1);
  verifier('aucun jeton créé par un échec ou une inscription refusée', (await sql`SELECT count(*)::int AS n FROM appareils_connus`)[0].n === jetonsAvant.n);

  // Essais en même temps : au plus 5 passent
  const paralleles = await Promise.all(Array.from({ length: 15 }, () =>
    appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: 'faux' }, ip: '203.0.113.3' }).then((x) => x.status)));
  verifier('15 essais simultanés : au plus 5 vérifiés, les autres bloqués', paralleles.filter((s) => s === 401).length <= 5 && paralleles.filter((s) => s === 429).length >= 10, paralleles.join(','));

  // Attaque répartie sur le compte : 55 essais depuis 11 adresses
  for (let a = 0; a < 11; a++) {
    await Promise.all(Array.from({ length: 5 }, () => appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: 'faux' }, ip: `192.0.2.${10 + a}` })));
  }
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '192.0.2.200' });
  verifier('compte très attaqué : nouvel appareil bloqué (429)', r.status === 429, r.status);
  // Faux cookies : un jeton inventé, un jeton d'un autre compte, une valeur mal formée ne débloquent rien
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '192.0.2.202', cookie: `cm_appareil=${'a'.repeat(64)}` });
  verifier('jeton « appareil connu » inventé : toujours bloqué', r.status === 429, r.status);
  const appareil1 = (await connexion('test1@kromadex.test', '198.51.100.21')).appareil;
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '192.0.2.203', cookie: appareil1 });
  verifier('jeton d’un autre compte : toujours bloqué', r.status === 429, r.status);
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '192.0.2.204', cookie: "cm_appareil=' OR 1=1 --" });
  verifier('jeton mal formé : toujours bloqué', r.status === 429, r.status);
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: MDP }, ip: '192.0.2.201', cookie: appareil2 });
  verifier('compte très attaqué : l’appareil connu de la titulaire se connecte', r.status === 200, r.status);
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: email2, password: 'faux' }, ip: '192.0.2.205', cookie: appareil2 });
  verifier('appareil connu mais mauvais mot de passe : refusé (401)', r.status === 401, r.status);

  const inscriptions = [];
  for (let i = 0; i < 11; i++) inscriptions.push((await appel('/api/auth/register', { methode: 'POST', json: { email: 'pas-un-courriel' }, ip: '203.0.113.50' })).status);
  verifier('inscriptions : 10 essais par heure et par adresse, le 11e bloqué', inscriptions.slice(0, 10).every((s) => s === 400) && inscriptions[10] === 429, inscriptions.join(','));
  const oublis = [];
  for (let i = 0; i < 11; i++) oublis.push((await appel('/api/auth/oubli', { methode: 'POST', json: { email: `${marque}@exemple.invalid` }, ip: '203.0.113.51' })).status);
  verifier('mot de passe oublié : le 11e essai bloqué', oublis.slice(0, 10).every((s) => s === 200) && oublis[10] === 429, oublis.join(','));

  console.log('\n7. Avis de paiement ThriveCart');
  const avis = (extra) => ({ thrivecart_secret: SECRET, mode: 'live', event: 'order.subscription_payment', event_id: `${marque}-1`,
    passthrough: { user_id: comptes.test2.id }, order: { total: '379', total_str: '3.79' }, ...extra });
  const plusDe = async () => (await sql`SELECT plus_statut, plus_jusqu FROM users WHERE id = ${comptes.test2.id}`)[0];
  const [r1, r2] = await Promise.all([
    appel('/api/paiements/thrivecart', { methode: 'POST', json: avis(), entetes: { origin: '' } }),
    appel('/api/paiements/thrivecart', { methode: 'POST', json: avis(), entetes: { origin: '' } }),
  ]);
  const p1 = await plusDe();
  const jours = (new Date(p1.plus_jusqu) - Date.now()) / 86400000;
  verifier('deux copies simultanées : acceptées toutes les deux (200)', r1.status === 200 && r2.status === 200, `${r1.status},${r2.status}`);
  verifier('deux copies simultanées : un seul mois ajouté', p1.plus_statut === 'actif' && jours > 32 && jours < 35, jours.toFixed(1));
  const [{ n: traites }] = await sql`SELECT count(*)::int AS n FROM paiements_traites WHERE cle LIKE ${'%' + marque + '%'}`;
  verifier('l’avis est noté une seule fois', traites === 1, traites);
  await appel('/api/paiements/thrivecart', { methode: 'POST', json: avis(), entetes: { origin: '' } });
  verifier('avis renvoyé plus tard : aucun effet', String((await plusDe()).plus_jusqu) === String(p1.plus_jusqu));
  r = await appel('/api/paiements/thrivecart', { methode: 'POST', json: avis({ mode: 'test', event_id: `${marque}-2` }), entetes: { origin: '' } });
  verifier('avis en mode test ignoré sur un site en mode live', r.donnees?.ignore === 'mode' && String((await plusDe()).plus_jusqu) === String(p1.plus_jusqu));
  r = await appel('/api/paiements/thrivecart', { methode: 'POST', json: avis({ thrivecart_secret: 'faux', event_id: `${marque}-3` }), entetes: { origin: '' } });
  verifier('avis forgé (mauvais secret) refusé (401)', r.status === 401 && String((await plusDe()).plus_jusqu) === String(p1.plus_jusqu), r.status);
  r = await appel('/api/paiements/thrivecart', { methode: 'POST', json: avis({ event: 'order.refund', event_id: `${marque}-4` }), entetes: { origin: '' } });
  verifier('remboursement : Kromadex+ retiré', (await plusDe()).plus_statut === 'aucun');
} catch (e) {
  echecs++;
  console.error('\nErreur pendant les tests :', e);
} finally {
  // Remise en état : rien de ce que le test a créé ne reste
  const ids = Object.values(comptes).map((u) => u.id);
  for (const p of await sql`SELECT id FROM pages WHERE title LIKE ${marque + '-%'}`) {
    await sql`DELETE FROM xp_journal WHERE cle = ${'page:' + p.id}`;
    await sql`DELETE FROM pages WHERE id = ${p.id}`;
  }
  await sql`DELETE FROM tome_covers WHERE tome_name LIKE ${marque + '-%'}`;
  await sql`DELETE FROM palettes WHERE user_id = ANY(${ids}) AND cree_le >= ${debut.toISOString()}`;
  await sql`DELETE FROM paiements_traites WHERE cle LIKE ${'%' + marque + '%'}`;
  await sql`DELETE FROM paiements_evenements WHERE recu_le >= ${debut.toISOString()}
    AND (donnees->>'event_id' LIKE ${marque + '%'} OR donnees->>'event' = 'x')`;
  await sql`DELETE FROM essais_limites WHERE cree_le >= ${debut.toISOString()}`;
  await sql`DELETE FROM appareils_connus WHERE user_id = ANY(${ids})`;
  await sql`DELETE FROM sessions WHERE user_id = ANY(${ids}) AND expires_at > now() + interval '29 days'`;
  for (const u of Object.values(comptes)) {
    await sql`UPDATE users SET role = ${u.role}, xp = ${u.xp}, level = ${u.level}, plus_statut = ${u.plus_statut}, plus_jusqu = ${u.plus_jusqu},
      plus_formule = ${u.plus_formule}, avatar_b64 = ${u.avatar_b64}, avatar_type = ${u.avatar_type}, avatar_maj = ${u.avatar_maj} WHERE id = ${u.id}`;
  }
  console.log(`\nRésultat : ${reussis} réussi(s), ${echecs} échec(s). Données de test effacées.`);
  process.exit(echecs ? 1 : 0);
}
