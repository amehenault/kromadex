import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomBytes, scryptSync } from 'node:crypto';

const urlProd = parseEnv(readFileSync('.env.local', 'utf8')).DATABASE_URL;
const urlTest = process.env.DATABASE_URL;
const hote = (u) => { try { return new URL(u).host; } catch { return ''; } };
if (!urlProd || !urlTest) { console.error('DATABASE_URL manquante dans .env.local ou .env.test.local.'); process.exit(1); }
if (hote(urlProd) === hote(urlTest)) { console.error('REFUS : la base de test est la même que la production.'); process.exit(1); }

const prod = neon(urlProd);
const test = neon(urlTest);

const [marquee] = await test`SELECT 1 FROM information_schema.tables WHERE table_name = 'environnement_test'`;
const [{ n: membres }] = await test`SELECT count(*)::int AS n FROM users`;
if (!marquee && membres > 0) {
  console.error(`REFUS : la cible contient ${membres} membre(s) et n'est pas marquée comme base de test.`);
  console.error('Crée la branche avec l’option « Schema only » pour qu’aucune donnée de membre ne soit copiée.');
  process.exit(1);
}
await test`CREATE TABLE IF NOT EXISTS environnement_test (nom text PRIMARY KEY, cree_le timestamptz NOT NULL DEFAULT now())`;
await test`INSERT INTO environnement_test (nom) VALUES ('kromadex-test') ON CONFLICT DO NOTHING`;

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
const coffrets = await lire(prod`SELECT * FROM marker_brands WHERE created_by IS NULL`);
await copier('marker_brands', coffrets);
await copier('marker_colors', await lire(prod`SELECT * FROM marker_colors WHERE brand_id = ANY(${coffrets.map((c) => c.id)})`));
await copier('system_titles', await lire(prod`SELECT * FROM system_titles`));

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
