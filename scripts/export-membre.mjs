import { neon } from '@neondatabase/serverless';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const courriel = String(process.argv[2] || '').trim().toLowerCase();
if (!courriel) { console.error('Indique le courriel du membre.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

const [u] = await sql`SELECT id FROM users WHERE lower(email) = ${courriel}`;
if (!u) { console.error('Aucun compte avec ce courriel.'); process.exit(1); }
const id = String(u.id);

const SECRETS = new Set(['password_hash', 'token_hash', 'jeton_hash', 'cles']);
const IMAGES = new Set(['image_b64', 'avatar_b64']);

const colonnes = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
  AND data_type IN ('uuid', 'text') AND column_name ~ '^(user_id|auteur|createur|invite|adversaire|joueur_a|joueur_b|suiveur|suivi|choisi_par|gagnant)$'
  ORDER BY table_name, column_name`;

const dossier = join('exports-membres', `${new Date().toISOString().slice(0, 10)}-${id}`);
mkdirSync(join(dossier, 'images'), { recursive: true });
const donnees = { exporte_le: new Date().toISOString(), compte: null, tables: {} };
let nbImages = 0;

function nettoyer(table, ligne) {
  const propre = {};
  for (const [k, v] of Object.entries(ligne)) {
    if (SECRETS.has(k)) continue;
    if (IMAGES.has(k)) {
      if (v) {
        const nom = `${table}-${ligne.id || ligne.tome_name || id}.webp`.replace(/[^\w.-]/g, '_');
        writeFileSync(join(dossier, 'images', nom), Buffer.from(v, 'base64'));
        propre[k] = `images/${nom}`;
        nbImages++;
      }
      continue;
    }
    propre[k] = v;
  }
  return propre;
}

const [compte] = await sql`SELECT * FROM users WHERE id = ${id}`;
donnees.compte = nettoyer('users', compte);
for (const c of colonnes) {
  if (c.table_name === 'users') continue;
  const lignes = await sql.query(`SELECT * FROM "${c.table_name}" WHERE "${c.column_name}"::text = $1`, [id]);
  if (lignes.length) donnees.tables[`${c.table_name} (${c.column_name})`] = lignes.map((l) => nettoyer(c.table_name, l));
}
const paiements = await sql`SELECT recu_le, evenement, resultat, donnees FROM paiements_evenements WHERE user_id = ${id} OR lower(courriel) = ${courriel}`;
if (paiements.length) donnees.tables['paiements_evenements (courriel)'] = paiements;

writeFileSync(join(dossier, 'donnees.json'), JSON.stringify(donnees, null, 2));
console.log(`Export écrit dans ${dossier} : ${Object.keys(donnees.tables).length} tables, ${nbImages} image(s).`);
console.log('À envoyer à la personne par un moyen sûr, puis à supprimer de cet ordinateur.');
