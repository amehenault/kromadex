// Prépare une branche Neon de TEST (jamais la production) :
//   npm run db:preparer-test
//
// Prérequis :
//  1. Dans Neon : Branches > New branch, à partir de « main », option « Schema only » (structure sans données).
//  2. Copier la chaîne de connexion de cette branche dans .env.test.local (fichier ignoré par git) :
//       DATABASE_URL=postgresql://...   (branche de test)
//       THRIVECART_SECRET=secret-test-local
//       THRIVECART_MODE=live
//
// Ce que fait le script :
//  - LIT (lecture seule) le catalogue public de la production : tomes et livres, coffrets de crayons officiels,
//    couleurs, titres. Aucune donnée de membre n'est lue ni copiée.
//  - Écrit uniquement dans la branche de test : ce catalogue, quatre comptes de test et une table « marqueur »
//    qui permet aux scripts de test de vérifier qu'ils visent bien la base de test.
//
// Sécurités : refuse si la cible est la même base que la production, ou si la cible contient déjà des membres
// sans être marquée comme base de test.
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomBytes, scryptSync } from 'node:crypto';

const urlProd = parseEnv(readFileSync('.env.local', 'utf8')).DATABASE_URL;
const urlTest = process.env.DATABASE_URL; // chargée depuis .env.test.local
const hote = (u) => { try { return new URL(u).host; } catch { return ''; } };
if (!urlProd || !urlTest) { console.error('DATABASE_URL manquante dans .env.local ou .env.test.local.'); process.exit(1); }
if (hote(urlProd) === hote(urlTest)) { console.error('REFUS : la base de test est la même que la production.'); process.exit(1); }

const prod = neon(urlProd);
const test = neon(urlTest);

// Garde-fou : la cible doit être vide de membres, ou déjà marquée comme base de test
const [marquee] = await test`SELECT 1 FROM information_schema.tables WHERE table_name = 'environnement_test'`;
const [{ n: membres }] = await test`SELECT count(*)::int AS n FROM users`;
if (!marquee && membres > 0) {
  console.error(`REFUS : la cible contient ${membres} membre(s) et n'est pas marquée comme base de test.`);
  console.error('Crée la branche avec l’option « Schema only » pour qu’aucune donnée de membre ne soit copiée.');
  process.exit(1);
}
await test`CREATE TABLE IF NOT EXISTS environnement_test (nom text PRIMARY KEY, cree_le timestamptz NOT NULL DEFAULT now())`;
await test`INSERT INTO environnement_test (nom) VALUES ('kromadex-test') ON CONFLICT DO NOTHING`;

// Lecture seule de la production : une transaction READ ONLY refuse toute écriture
const lire = async (requete) => (await prod.transaction([requete], { readOnly: true }))[0];

async function copier(table, lignes) {
  for (let i = 0; i < lignes.length; i += 1000) {
    const lot = JSON.stringify(lignes.slice(i, i + 1000));
    await test.query(`INSERT INTO ${table} SELECT * FROM json_populate_recordset(null::${table}, $1::json) ON CONFLICT DO NOTHING`, [lot]);
  }
  await test.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT max(id) FROM ${table}), 1))`).catch(() => {});
  console.log(`  ${table} : ${lignes.length} ligne(s)`);
}

console.log('Copie du catalogue public :');
await copier('tome_catalog', await lire(prod`SELECT * FROM tome_catalog`));
// Seulement les coffrets officiels (ceux créés par des membres restent en production)
const coffrets = await lire(prod`SELECT * FROM marker_brands WHERE created_by IS NULL`);
await copier('marker_brands', coffrets);
await copier('marker_colors', await lire(prod`SELECT * FROM marker_colors WHERE brand_id = ANY(${coffrets.map((c) => c.id)})`));
await copier('system_titles', await lire(prod`SELECT * FROM system_titles`));

// Comptes de test (même format de mot de passe que src/lib/auth.js)
const empreinte = (mdp) => { const sel = randomBytes(16); return `${sel.toString('hex')}:${scryptSync(mdp, sel, 64).toString('hex')}`; };
const comptes = [
  ['test1@kromadex.test', 'testeur1', 'coloriste'],
  ['test2@kromadex.test', 'testeur2', 'coloriste'],
  ['test3@kromadex.test', 'testeur3', 'modo'],
  ['admin@kromadex.test', 'invocatrice-test', 'admin'],
];
console.log('Comptes de test (mot de passe mdp1234!) :');
for (const [email, pseudo, role] of comptes) {
  await test`INSERT INTO users (email, password_hash, pseudo, role, genre, pays, types_pratiques)
    VALUES (${email}, ${empreinte('mdp1234!')}, ${pseudo}, ${role}, 'feminin', 'ca-qc', ${['mystere', 'cozy']})
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role`;
  console.log(`  ${email} (${role})`);
}
console.log('Base de test prête.');
