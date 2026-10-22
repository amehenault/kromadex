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
import { createHash, randomUUID, randomBytes, scryptSync } from 'node:crypto';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:3123';
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) { console.error('Ces tests ne visent que un serveur local.'); process.exit(1); }
// Même secret fictif que le serveur de test (.env.test.local) ; les avis simulés sont en mode « live »,
// donc THRIVECART_MODE doit valoir « live » pour que le serveur les accepte (et ignore ceux en mode « test »)
const SECRET = process.env.THRIVECART_SECRET;
if (!SECRET) { console.error('THRIVECART_SECRET manquant dans .env.test.local.'); process.exit(1); }
if (process.env.THRIVECART_MODE !== 'live') { console.error('THRIVECART_MODE doit valoir « live » dans .env.test.local pour ces tests.'); process.exit(1); }
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

let livreModifie = null; // tome dont le test change le nombre de pages (remis comme avant à la fin)
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
  verifier('Invocatrice : aucun courriel non plus (espace admin sans courriels)', r.status === 200 && r.donnees.users.every((u) => !('email' in u)));
  for (const chemin of ['/api/moderation', '/api/lancement', '/api/abonnement', '/api/demandes?tout=1', '/api/defis/signalements', '/api/mots-cles?gestion=1', '/api/bingos/validation']) {
    r = await appel(chemin, { cookie: s3 });
    verifier(`Invocatrice : ${chemin} sans courriel`, r.status === 200 && !/"email"/.test(r.texte), r.status);
  }
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

  console.log('\n8. Journal des avis ThriveCart (champs listés seulement)');
  await appel('/api/paiements/thrivecart', { methode: 'POST', entetes: { origin: '' },
    json: avis({ event_id: `${marque}-5`, customer: { email: `${marque}@exemple.invalid`, name: 'Nom Secret', address: { line1: 'Rue Secrète' } }, order: { total: '379', card_last4: '4242' } }) });
  const journal = await sql`SELECT courriel, resultat, donnees FROM paiements_evenements WHERE recu_le >= ${debut.toISOString()}`;
  const acceptes = journal.filter((j) => String(j.donnees?.event_id || '').startsWith(marque));
  verifier('les avis acceptés sont notés', acceptes.length >= 3, acceptes.length);
  const texteJournal = JSON.stringify(journal.map((j) => j.donnees));
  verifier('jamais le mot secret dans le journal', !texteJournal.includes(SECRET));
  verifier('ni nom, ni adresse, ni carte dans le journal', !/Nom Secret|Rue Secrète|4242/.test(texteJournal));
  verifier('seulement les champs listés', acceptes.every((j) => Object.keys(j.donnees).every((k) => ['event', 'event_id', 'mode', 'passthrough_user_id', 'order_total', 'order_total_str', 'formule'].includes(k))));
  const refuses = journal.filter((j) => j.resultat.startsWith('refusé'));
  verifier('avis refusé : ni courriel ni contenu gardés', refuses.length > 0 && refuses.every((j) => j.courriel === '' && Object.keys(j.donnees).length === 0));

  console.log('\n9. Signalements');
  r = await appel('/api/signalements', { methode: 'POST', cookie: s2, json: { genre: 'coloriage', cible: brouillon.id, raison: 'Spam ou publicité', details: marque } });
  verifier('un membre signale le coloriage publié d’un autre', r.status === 200, r.status);
  r = await appel('/api/signalements', { methode: 'POST', cookie: s1, json: { genre: 'coloriage', cible: brouillon.id, raison: 'Spam ou publicité' } });
  verifier('on ne peut pas signaler son propre contenu (400)', r.status === 400, r.status);
  r = await appel('/api/signalements', { methode: 'POST', cookie: s2, json: { genre: 'coloriage', cible: brouillon.id, raison: 'Raison inventée' } });
  verifier('raison inconnue refusée (400)', r.status === 400, r.status);
  r = await appel('/api/signalements', { cookie: s1 });
  verifier('Coloriste : liste des signalements refusée (403)', r.status === 403, r.status);
  r = await appel('/api/signalements', { cookie: s3 });
  const signale = r.donnees?.signalements?.find((x) => x.cible === brouillon.id);
  verifier('Sentinelle : le coloriage signalé est dans la liste', r.status === 200 && signale?.nombre === 1);
  verifier('Sentinelle : aucun courriel dans les signalements', !/@kromadex\.test|exemple\.invalid/.test(r.texte));
  r = await appel('/api/notifications', { cookie: s3 });
  const signalesAvant = r.donnees?.signales || 0;
  verifier('Sentinelle : point rouge pour le contenu signalé', signalesAvant >= 1, JSON.stringify(r.donnees));
  r = await appel('/api/notifications', { cookie: s1 });
  verifier('Coloriste : jamais de point rouge de signalements', (r.donnees?.signales || 0) === 0 && (r.donnees?.mots_cles_signales || 0) === 0);
  r = await appel('/api/signalements', { methode: 'PUT', cookie: s3, json: { genre: 'coloriage', cible: brouillon.id, action: 'retirer' } });
  verifier('le point rouge baisse une fois le signalement traité', ((await appel('/api/notifications', { cookie: s3 })).donnees?.signales || 0) === signalesAvant - 1);
  const [retire] = await sql`SELECT publiee FROM pages WHERE id = ${brouillon.id}`;
  verifier('Sentinelle : « retirer » dépublie le coloriage', r.status === 200 && retire.publiee === false, r.status);
  verifier('le signalement est marqué traité', (await sql`SELECT traite FROM signalements WHERE genre = 'coloriage' AND cible = ${brouillon.id}`).every((x) => x.traite));

  console.log('\n9b. Confidentialité d’un coloriage non publié (ni soumis à une activité)');
  r = await appel(`/api/pages/${brouillon.id}/image?s=1`);
  verifier('visiteur non connecté : image refusée (404)', r.status === 404, r.status);
  r = await appel(`/api/pages/${brouillon.id}/image?s=1`, { cookie: s1 });
  verifier('propriétaire : image servie', r.status === 200, r.status);
  verifier('image gardée 1 jour au plus en cache, en privé', r.headers.get('cache-control') === 'private, max-age=86400', r.headers.get('cache-control'));
  r = await appel(`/api/pages/${brouillon.id}/image?s=1`, { cookie: s2 });
  verifier('autre membre : image refusée après le retrait (404)', r.status === 404, r.status);
  r = await appel(`/api/pages/${brouillon.id}/image?s=1`, { cookie: s3 });
  verifier('Sentinelle : image refusée elle aussi (404)', r.status === 404, r.status);
  r = await appel(`/api/communaute?vue=fiche&id=${brouillon.id}`, { cookie: s2 });
  verifier('autre membre : fiche (codes, titre) refusée (404)', r.status === 404, r.status);
  // Déconnexion rapide : pas de vidage de cache imposé (lent dans Chrome) ; les notifications de l'appareil sont retirées en même temps
  const endpoint = `https://push.exemple.invalid/${marque}`;
  await sql`INSERT INTO push_abonnements (user_id, endpoint, cles) VALUES (${comptes.test2.id}, ${endpoint}, '{}')`;
  const debutDeconnexion = Date.now();
  r = await appel('/api/auth/logout', { methode: 'POST', cookie: s2, json: { endpoint } });
  verifier('déconnexion rapide, sans vidage de cache imposé', r.status === 200 && !r.headers.get('clear-site-data') && Date.now() - debutDeconnexion < 3000, `${Date.now() - debutDeconnexion} ms`);
  verifier('déconnexion : les notifications de cet appareil sont retirées', (await sql`SELECT 1 FROM push_abonnements WHERE endpoint = ${endpoint}`).length === 0);
  r = await appel('/api/roles', { cookie: s2 });
  verifier('déconnexion : la session ne fonctionne plus', r.status === 401, r.status);

  console.log('\n10. Suppression d’un compte');
  const emailJetable = `${marque}@kromadex.test`;
  const pseudoJetable = `jetable${Date.now()}`;
  const sel = randomBytes(16);
  const [jetable] = await sql`INSERT INTO users (email, password_hash, pseudo, name, role)
    VALUES (${emailJetable}, ${sel.toString('hex') + ':' + scryptSync(MDP, sel, 64).toString('hex')}, ${pseudoJetable}, 'Prénom Jetable', 'coloriste') RETURNING id`;
  const idJ = String(jetable.id);
  // Données dans les tables sans lien automatique avec le compte, et traces qui la désignent
  const [tomeCat] = await sql`SELECT id FROM tome_catalog LIMIT 1`;
  if (tomeCat) await sql`INSERT INTO user_tomes (user_id, tome_id) VALUES (${idJ}, ${tomeCat.id})`;
  await sql`INSERT INTO tomes_perso (user_id, nom) VALUES (${idJ}, ${marque})`;
  const [pageJ] = await sql`INSERT INTO pages (user_id, title, publiee, type_coloriage, publiee_le) VALUES (${idJ}, ${marque + '-jetable'}, true, 'cozy', now()) RETURNING id`;
  await sql`INSERT INTO vues (user_id, genre, cible) VALUES (${comptes.test1.id}, 'profil', ${idJ}), (${comptes.test1.id}, 'fiche', ${String(pageJ.id)})`;
  const [pubJ] = await sql`INSERT INTO publications (user_id, genre, texte) VALUES (${idJ}, 'question', ${marque}) RETURNING id`;
  await sql`INSERT INTO signalements (genre, cible, user_id, raison) VALUES ('membre', ${idJ}, ${comptes.test1.id}, 'Autre'), ('coloriage', ${String(pageJ.id)}, ${comptes.test1.id}, 'Autre'),
    ('publication', ${String(pubJ.id)}, ${comptes.test1.id}, 'Autre')`;
  await sql`INSERT INTO paiements_evenements (evenement, courriel, user_id, resultat, donnees) VALUES ('order.success', ${emailJetable}, ${idJ}, 'actif', '{}'),
    ('order.success', ${emailJetable.toUpperCase()}, NULL, 'membre introuvable', '{}')`;
  await sql`INSERT INTO paiements_traites (cle, evenement, user_id) VALUES (${marque + '-jetable'}, 'order.success', ${idJ})`;
  await sql`INSERT INTO essais_limites (genre, email_h) VALUES ('connexion', ${sha(emailJetable)})`;
  await sql`INSERT INTO recompenses (user_id, genre, detail, source) VALUES (${comptes.test1.id}, 'sceau', ${'de @' + pseudoJetable}, ${marque + '-sceau'})`;
  await sql`UPDATE users SET plus_statut = 'annule', plus_jusqu = now() + interval '10 days' WHERE id = ${idJ}`;

  const sJ = (await connexion(emailJetable, '198.51.100.40')).session;
  r = await appel('/api/user/compte', { methode: 'DELETE', cookie: sJ, json: { motDePasse: 'mauvais' } });
  verifier('mauvais mot de passe : compte gardé (401)', r.status === 401 && (await sql`SELECT 1 FROM users WHERE id = ${idJ}`).length === 1, r.status);
  r = await appel('/api/user/compte', { methode: 'DELETE', cookie: sJ, json: { motDePasse: MDP } });
  verifier('abonnement annulé mais encore actif : la suppression est permise', r.status === 200, r.status);

  // Toutes les colonnes qui peuvent désigner un compte, dans toutes les tables de la base
  const colonnes = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
    AND data_type IN ('uuid', 'text') AND column_name ~ '^(user_id|auteur|par|valide_par|createur|gagnant|invite|adversaire|joueur_a|joueur_b|suiveur|suivi|choisi_par|cible|id)$'`;
  const restes = [];
  for (const c of colonnes) {
    const [{ n }] = await sql.query(`SELECT count(*)::int AS n FROM "${c.table_name}" WHERE "${c.column_name}"::text = $1`, [idJ]);
    if (n) restes.push(`${c.table_name}.${c.column_name} (${n})`);
  }
  verifier('plus aucune ligne ne désigne le compte supprimé, dans aucune table', !restes.length, restes.join(', '));
  verifier('ses coloriages sont supprimés (et les traces qui les visent)',
    (await sql`SELECT 1 FROM pages WHERE id = ${pageJ.id}`).length === 0
    && (await sql`SELECT 1 FROM vues WHERE cible = ${String(pageJ.id)} UNION ALL SELECT 1 FROM signalements WHERE cible = ${String(pageJ.id)}`).length === 0);
  verifier('ses publications et les signalements qui les visent sont supprimés',
    (await sql`SELECT 1 FROM publications WHERE id = ${pubJ.id} UNION ALL SELECT 1 FROM signalements WHERE genre = 'publication' AND cible = ${String(pubJ.id)}`).length === 0);
  verifier('journal des paiements à son courriel effacé (toutes majuscules)', (await sql`SELECT 1 FROM paiements_evenements WHERE lower(courriel) = ${emailJetable}`).length === 0);
  verifier('clé anti-doublon du paiement gardée, sans lien', (await sql`SELECT user_id FROM paiements_traites WHERE cle = ${marque + '-jetable'}`)[0]?.user_id === null);
  verifier('tentatives de connexion à son courriel effacées', (await sql`SELECT 1 FROM essais_limites WHERE email_h = ${sha(emailJetable)}`).length === 0);
  verifier('son pseudo retiré des sceaux reçus par les autres', (await sql`SELECT detail FROM recompenses WHERE source = ${marque + '-sceau'}`)[0]?.detail === 'de la cheffe');

  console.log('\n11. Communauté : questions et coloriages en cours');
  // test2 est bloqué sur les nouveaux appareils depuis l'attaque simulée de la section 6 : on passe par son appareil connu
  r = await appel('/api/auth/login', { methode: 'POST', json: { email: 'test2@kromadex.test', password: MDP }, ip: '198.51.100.32', cookie: appareil2 });
  const s2b = cookieDe(r, 'cm_session');
  verifier('test2 se reconnecte depuis son appareil connu', r.status === 200 && Boolean(s2b), r.status);
  const publication = (champs, fichiers = []) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(champs)) fd.append(k, v);
    for (const [buf, type, nom] of fichiers) fd.append('images', new Blob([buf], { type }), nom);
    return fd;
  };
  r = await appel('/api/publications', { methode: 'POST', cookie: s1, corps: publication({ genre: 'question', texte: `${marque} Quels crayons pour la peau ?` }) });
  verifier('question publiée', r.status === 200 && r.donnees?.id, r.status);
  const question = r.donnees?.id;
  r = await appel('/api/publications', { methode: 'POST', cookie: s1, corps: publication({ genre: 'question', texte: 'a' }) });
  verifier('question vide refusée (400)', r.status === 400, r.status);
  r = await appel('/api/publications', { methode: 'POST', cookie: s1, corps: publication({ genre: 'en_cours', texte: marque }) });
  verifier('coloriage en cours sans photo refusé (400)', r.status === 400, r.status);
  r = await appel('/api/publications', { methode: 'POST', cookie: s1, corps: publication({ genre: 'en_cours', texte: marque }, [[HTML, 'image/jpeg', 'a.jpg']]) });
  verifier('photo HTML déguisée refusée (415), rien n’est publié', r.status === 415
    && (await sql`SELECT count(*)::int AS n FROM publications WHERE texte = ${marque}`)[0].n === 0, r.status);
  r = await appel('/api/publications', { methode: 'POST', cookie: s1, corps: publication({ genre: 'en_cours', texte: marque }, [[await imagePng(), 'image/png', 'a.png'], [await imagePng(), 'image/png', 'b.png']]) });
  const enCours = r.donnees?.id;
  verifier('coloriage en cours avec 2 photos publié', r.status === 200 && (await sql`SELECT count(*)::int AS n FROM publication_images WHERE publication_id = ${enCours}`)[0].n === 2, r.status);
  r = await appel('/api/publications', { methode: 'POST', cookie: s2b, corps: publication({ genre: 'en_cours', page_id: brouillon.id }) });
  verifier('on ne peut pas publier le coloriage de quelqu’un d’autre (404)', r.status === 404, r.status);
  r = await appel(`/api/publications/${enCours}/image?no=1`);
  verifier('image de publication : refusée sans connexion (404)', r.status === 404, r.status);
  r = await appel(`/api/publications/${enCours}/image?no=1`, { cookie: s2b });
  verifier('image de publication : servie en WebP aux membres connectés', r.status === 200 && r.headers.get('content-type') === 'image/webp', r.status);
  r = await appel('/api/publications?vue=fil', { cookie: s2b });
  verifier('le fil d’actualités contient la question et le coloriage en cours',
    [question, enCours].every((id) => r.donnees?.fil?.some((x) => x.sorte === 'publication' && x.id === id)) && !/"email"/.test(r.texte));
  r = await appel('/api/publications', { methode: 'POST', cookie: s2b, json: { like: question } });
  verifier('J’aime sur une publication', r.status === 200 && r.donnees?.aime === true && r.donnees?.likes === 1, r.status);
  r = await appel('/api/publications/commentaires', { methode: 'POST', cookie: s2b, json: { publicationId: question, texte: 'Les Prismacolor !' } });
  verifier('réponse à une question', r.status === 200, r.status);
  r = await appel('/api/signalements', { methode: 'POST', cookie: s2b, json: { genre: 'publication', cible: question, raison: 'Spam ou publicité' } });
  verifier('une publication peut être signalée', r.status === 200, r.status);
  r = await appel('/api/publications', { methode: 'DELETE', cookie: s2b, json: { id: enCours } });
  verifier('un autre membre ne peut pas retirer la publication (404)', r.status === 404 && (await sql`SELECT 1 FROM publications WHERE id = ${enCours}`).length === 1, r.status);
  r = await appel('/api/publications', { methode: 'DELETE', cookie: s1, json: { id: enCours } });
  verifier('l’autrice retire sa publication, images comprises', r.status === 200 && (await sql`SELECT 1 FROM publication_images WHERE publication_id = ${enCours}`).length === 0, r.status);
  r = await appel('/api/signalements', { methode: 'PUT', cookie: s3, json: { genre: 'publication', cible: String(question), action: 'retirer' } });
  verifier('Sentinelle : « retirer » supprime la publication signalée', r.status === 200 && (await sql`SELECT 1 FROM publications WHERE id = ${question}`).length === 0, r.status);

  console.log('\n12. Coloriages terminés : publier depuis la communauté');
  r = await appel('/api/communaute', { methode: 'POST', cookie: s2b, json: { publier: brouillon.id, type: 'cozy' } });
  verifier('on ne peut pas publier le coloriage de quelqu’un d’autre (404)', r.status === 404 && !(await sql`SELECT publiee FROM pages WHERE id = ${brouillon.id}`)[0].publiee, r.status);
  r = await appel('/api/communaute', { methode: 'POST', cookie: s1, json: { publier: brouillon.id, type: 'inventé' } });
  verifier('type de coloriage inconnu refusé (400)', r.status === 400, r.status);
  r = await appel('/api/communaute', { methode: 'POST', cookie: s1, json: { publier: brouillon.id, type: 'cozy' } });
  verifier('l’autrice publie son coloriage terminé', r.status === 200 && (await sql`SELECT publiee FROM pages WHERE id = ${brouillon.id}`)[0].publiee, r.status);

  console.log('\n13. Nombre de pages modifié dans l’Espace et quêtes du Destin');
  const [livre] = await sql`SELECT id, nom, nb_pages, nb_pages_manuel FROM tome_catalog WHERE nb_pages > 10 AND nom IS NOT NULL ORDER BY id LIMIT 1`;
  livreModifie = livre;
  r = await appel('/api/tomes/admin', { methode: 'PUT', cookie: s3, json: { id: livre.id, nbPages: livre.nb_pages - 4 } });
  verifier('Sentinelle : ne peut pas changer le nombre de pages (403)', r.status === 403, r.status);
  await sql`UPDATE users SET role = 'admin' WHERE id = ${comptes.test3.id}`;
  r = await appel('/api/tomes/admin', { methode: 'PUT', cookie: s3, json: { id: livre.id, nbPages: livre.nb_pages - 4 } });
  await sql`UPDATE users SET role = ${comptes.test3.role} WHERE id = ${comptes.test3.id}`;
  const [apresLivre] = await sql`SELECT nb_pages, nb_pages_manuel FROM tome_catalog WHERE id = ${livre.id}`;
  verifier('Invocatrice : nombre de pages changé tout de suite et protégé de db:tomes', r.status === 200 && apresLivre.nb_pages === livre.nb_pages - 4 && apresLivre.nb_pages_manuel, r.status);

  // Quête sur une page qui n'existe plus (ex. page 49 d'un livre passé à 45 pages) : ramenée à la dernière page
  const [quete] = await sql`INSERT INTO roue_tirages (user_id, tome, page_no, quete_le) VALUES (${comptes.test1.id}, ${livre.nom}, ${String(livre.nb_pages)}, now()) RETURNING id`;
  await appel('/quetes', { cookie: s1 });
  verifier('quête ajustée au nouveau nombre de pages', (await sql`SELECT page_no FROM roue_tirages WHERE id = ${quete.id}`)[0]?.page_no === String(livre.nb_pages - 4));
  r = await appel('/api/roue', { methode: 'DELETE', cookie: s2b, json: { quete: quete.id } });
  verifier('un autre membre ne peut pas abandonner la quête (404)', r.status === 404, r.status);
  r = await appel('/api/roue', { methode: 'DELETE', cookie: s1, json: { quete: quete.id } });
  verifier('abandonner sa quête la supprime', r.status === 200 && (await sql`SELECT 1 FROM roue_tirages WHERE id = ${quete.id}`).length === 0, r.status);

  // Quête accomplie : elle disparaît de la liste (XP donnés)
  const [quete2] = await sql`INSERT INTO roue_tirages (user_id, tome, page_no, quete_le) VALUES (${comptes.test1.id}, ${livre.nom}, '3', now()) RETURNING id`;
  await sql`INSERT INTO pages (user_id, title, tome, page_no, image_b64, image_type) VALUES (${comptes.test1.id}, ${marque + '-destin'}, ${livre.nom}, '3', ${(await imagePng()).toString('base64')}, 'image/png')`;
  r = await appel('/quetes', { cookie: s1 });
  const [faite] = await sql`SELECT termine_le FROM roue_tirages WHERE id = ${quete2.id}`;
  verifier('quête accomplie : terminée, XP donnés et plus affichée', faite?.termine_le && (await sql`SELECT 1 FROM xp_journal WHERE cle = ${'destin:' + quete2.id}`).length === 1
    && !r.texte.includes(`${livre.nom}, page 3`));
  await sql`DELETE FROM xp_journal WHERE cle = ${'destin:' + quete2.id}`;
  await sql`DELETE FROM roue_tirages WHERE id = ${quete2.id}`;

  console.log('\n14. Nouveau coloriage : rester sur la page, mots-clefs, pop-up d’XP');
  await appel('/api/xp', { methode: 'POST', cookie: s1 });
  r = await appel('/api/pages', { methode: 'POST', cookie: s1,
    corps: formulaire({ title: `${marque}-motscles`, tome: 'Tome perso inventé', mots_cles_attente: JSON.stringify(['lapin', 'Lapin', 'renard', 'x']) }, await imagePng(), 'image/png', 'm.png') });
  const nouveauId = r.donnees?.id;
  verifier('l’enregistrement renvoie le coloriage (on reste sur sa page)', r.status === 200 && Boolean(nouveauId), r.status);
  const [avecMots] = nouveauId ? await sql`SELECT mots_cles FROM pages WHERE id = ${nouveauId}` : [{}];
  verifier('mots-clefs ajoutés avant l’enregistrement gardés (sans doublon ni mot trop court)', JSON.stringify(avecMots?.mots_cles) === JSON.stringify(['lapin', 'renard']), JSON.stringify(avecMots?.mots_cles));
  r = await appel('/api/xp', { cookie: s1 });
  verifier('pop-up d’XP : 100 XP gagnés avec le titre de la personne', r.status === 200 && r.donnees?.xp >= 100 && Boolean(r.donnees?.titre), JSON.stringify(r.donnees));
  verifier('pop-up d’XP : la raison est donnée (le coloriage ajouté, avec son nom)',
    (r.donnees?.gains || []).some((g) => g.xp === 100 && g.raison === `ajouté le coloriage « ${marque}-motscles »`), JSON.stringify(r.donnees?.gains));
  await appel('/api/xp', { methode: 'POST', cookie: s1 });
  r = await appel('/api/xp', { cookie: s1 });
  verifier('pop-up fermé : plus rien à montrer', r.donnees?.xp === 0, JSON.stringify(r.donnees));
  r = await appel('/api/xp');
  verifier('pop-up d’XP : rien sans connexion (401)', r.status === 401, r.status);

  // Titre affiché : un titre de niveau déjà atteint est permis, pas un titre de niveau pas encore atteint
  const [{ genre: genre1 }] = await sql`SELECT genre FROM users WHERE id = ${comptes.test1.id}`;
  const premier = genre1 === 'masculin' ? 'Gribouilleur en herbe' : 'Gribouilleuse en herbe';
  r = await appel('/api/user/parametres', { methode: 'POST', cookie: s1, json: { titre: premier } });
  verifier('titre du premier niveau choisi', r.status === 200 && (await sql`SELECT title FROM users WHERE id = ${comptes.test1.id}`)[0].title === premier, r.status);
  r = await appel('/api/user/parametres', { methode: 'POST', cookie: s1, json: { titre: 'Légende des couleurs inventée' } });
  verifier('titre pas encore débloqué refusé (403)', r.status === 403, r.status);
  await appel('/api/user/parametres', { methode: 'POST', cookie: s1, json: { titre: '' } });

  console.log('\n15. Mots-clefs partagés : un seul exemplaire du même mot par page');
  await sql`INSERT INTO user_tomes (user_id, tome_id) VALUES (${String(comptes.test2.id)}, ${livre.id}) ON CONFLICT DO NOTHING`;
  const motTest = `Zébu${Date.now() % 100000}`;
  r = await appel('/api/mots-cles', { methode: 'POST', cookie: s1, json: { tomeId: livre.id, mot: motTest, pageNo: '3' } });
  verifier('test1 ajoute un mot-clef à la page 3', r.status === 200, r.status);
  for (const variante of [motTest.toLowerCase(), `${motTest}s`, motTest.toUpperCase().replace('É', 'E')]) {
    r = await appel('/api/mots-cles', { methode: 'POST', cookie: s2b, json: { tomeId: livre.id, mot: variante, pageNo: '3' } });
    verifier(`test2 : « ${variante} » refusé, c’est le même mot (409)`, r.status === 409 && (r.donnees?.error || '').includes(motTest), `${r.status} ${r.donnees?.error}`);
  }
  r = await appel('/api/mots-cles', { methode: 'POST', cookie: s2b, json: { tomeId: livre.id, mot: motTest, pageNo: '4' } });
  verifier('le même mot reste permis sur une autre page', r.status === 200, r.status);
  r = await appel(`/api/mots-cles?tome=${livre.id}`, { cookie: s2b });
  const page3 = (r.donnees?.mots || []).filter((m) => m.page_no === '3' && m.mot.toLowerCase().startsWith('zébu'));
  verifier('tout membre voit les mots-clefs des autres, une seule fois', page3.length === 1 && page3[0].moi === false, JSON.stringify(page3));
  verifier('personne ne voit qui a ajouté un mot-clef (ni pseudo ni nom)', !/pseudo|"name"/.test(r.texte));
  await sql`UPDATE users SET role = 'admin' WHERE id = ${comptes.test3.id}`;
  r = await appel('/api/mots-cles?gestion=1', { cookie: s3 });
  await sql`UPDATE users SET role = ${comptes.test3.role} WHERE id = ${comptes.test3.id}`;
  verifier('l’Invocatrice voit qui a ajouté chaque mot-clef dans son Espace', (r.donnees?.mots || []).some((m) => m.mot === motTest && (m.pseudo || m.auteur_id)));
  r = await appel(`/api/mots-cles?nom=${encodeURIComponent(livre.nom)}`, { cookie: s2b });
  verifier('nouveau coloriage : les mots-clefs du tome sont retrouvés par son nom', r.donnees?.tome === livre.id && r.donnees.mots.some((m) => m.mot === motTest));
  // Mot-clef signalé : point rouge pour la modération, qui disparaît avec « Il est correct »
  const [motSignale] = await sql`SELECT id FROM mots_cles WHERE tome_id = ${livre.id} AND page_no = '3' AND cle LIKE 'zebu%'`;
  r = await appel('/api/mots-cles', { methode: 'POST', cookie: s2b, json: { signaler: motSignale.id, raison: 'faux' } });
  const motsAvant = (await appel('/api/notifications', { cookie: s3 })).donnees?.mots_cles_signales || 0;
  verifier('mot-clef signalé : point rouge sur Mots-clefs', r.status === 200 && motsAvant >= 1, motsAvant);
  r = await appel('/api/mots-cles', { methode: 'PUT', cookie: s3, json: { id: motSignale.id, garder: true } });
  verifier('« Il est correct » : signalements effacés, point rouge retiré',
    r.status === 200 && ((await appel('/api/notifications', { cookie: s3 })).donnees?.mots_cles_signales || 0) === motsAvant - 1, r.status);
  await sql`DELETE FROM mots_cles WHERE tome_id = ${livre.id} AND cle LIKE 'zebu%' AND cree_le >= ${debut.toISOString()}`;

  console.log('\n16. Missives : modification par l’Invocatrice');
  const [missive] = await sql`INSERT INTO missives (titre, contenu, statut) VALUES (${marque + '-missive'}, 'Texte', 'publiee') RETURNING id`;
  r = await appel('/api/missives', { methode: 'PUT', cookie: s1, json: { id: missive.id, titre: 'Pirate', contenu: 'x' } });
  verifier('un membre ne peut pas modifier une missive (403)', r.status === 403, r.status);
  await sql`UPDATE users SET role = 'admin' WHERE id = ${comptes.test3.id}`;
  r = await appel('/api/missives', { methode: 'PUT', cookie: s3, json: { id: missive.id, titre: `${marque}-missive modifiée`, contenu: 'Nouveau texte' } });
  const rEpingle = await appel('/api/missives', { methode: 'PUT', cookie: s3, json: { id: missive.id, epingleeJusqu: '2099-01-01' } });
  await sql`UPDATE users SET role = ${comptes.test3.role} WHERE id = ${comptes.test3.id}`;
  const [modifiee] = await sql`SELECT titre, contenu, to_char(epinglee_jusqu, 'YYYY-MM-DD') AS jusqu FROM missives WHERE id = ${missive.id}`;
  verifier('l’Invocatrice modifie et épingle la missive', r.status === 200 && rEpingle.status === 200 && modifiee.titre === `${marque}-missive modifiée` && modifiee.contenu === 'Nouveau texte' && modifiee.jusqu === '2099-01-01');
  r = await appel('/api/missives', { cookie: s1 });
  verifier('le fil des missives donne la date d’épinglage', r.donnees?.missives?.find((m) => m.id === missive.id)?.epinglee_jusqu === '2099-01-01');
  await sql`DELETE FROM missives WHERE id = ${missive.id}`;
  await sql`DELETE FROM user_tomes WHERE user_id = ${String(comptes.test2.id)} AND tome_id = ${livre.id}`;
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
    AND (donnees->>'event_id' LIKE ${marque + '%'} OR donnees->>'event' = 'x' OR resultat LIKE 'refusé%' OR lower(courriel) LIKE ${marque + '%'})`;
  await sql`DELETE FROM signalements WHERE cree_le >= ${debut.toISOString()}`;
  await sql`DELETE FROM publications WHERE user_id = ANY(${ids}) AND cree_le >= ${debut.toISOString()}`;
  await sql`DELETE FROM roue_tirages WHERE user_id = ANY(${ids}) AND tire_le >= ${debut.toISOString()}`;
  if (livreModifie) await sql`UPDATE tome_catalog SET nb_pages = ${livreModifie.nb_pages}, nb_pages_manuel = ${livreModifie.nb_pages_manuel} WHERE id = ${livreModifie.id}`;
  await sql`DELETE FROM recompenses WHERE source = ${marque + '-sceau'}`;
  await sql`DELETE FROM tomes_perso WHERE nom = ${marque}`;
  await sql`DELETE FROM users WHERE email = ${marque + '@kromadex.test'}`;
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
