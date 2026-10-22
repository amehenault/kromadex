// Export des données d'un membre (demande d'accès ou de portabilité, voir docs/confidentialite.md).
//   node --env-file=.env.local scripts/export-membre.mjs courriel@exemple.com
// Écrit dans exports-membres/<date>-<id>/ : donnees.json (toutes les lignes qui la concernent, table par table)
// et ses images (coloriages, photo de profil, couvertures). Le dossier est ignoré par git : à envoyer à la personne,
// puis à supprimer. Lecture seule : rien n'est modifié dans la base.
import { neon } from '@neondatabase/serverless';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const courriel = String(process.argv[2] || '').trim().toLowerCase();
if (!courriel) { console.error('Indique le courriel du membre.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

const [u] = await sql`SELECT id FROM users WHERE lower(email) = ${courriel}`;
if (!u) { console.error('Aucun compte avec ce courriel.'); process.exit(1); }
const id = String(u.id);

// Jamais exportés : secrets et empreintes techniques (mot de passe, jetons de session, de réinitialisation, d'appareil)
const SECRETS = new Set(['password_hash', 'token_hash', 'jeton_hash', 'cles']);
// Images : écrites en fichiers à part plutôt que dans le JSON
const IMAGES = new Set(['image_b64', 'avatar_b64']);

// Toutes les colonnes qui désignent un compte, dans toutes les tables (même logique que le test de suppression)
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
// Journal des paiements des 30 derniers jours, retrouvé aussi par le courriel
const paiements = await sql`SELECT recu_le, evenement, resultat, donnees FROM paiements_evenements WHERE user_id = ${id} OR lower(courriel) = ${courriel}`;
if (paiements.length) donnees.tables['paiements_evenements (courriel)'] = paiements;

writeFileSync(join(dossier, 'donnees.json'), JSON.stringify(donnees, null, 2));
console.log(`Export écrit dans ${dossier} : ${Object.keys(donnees.tables).length} tables, ${nbImages} image(s).`);
console.log('À envoyer à la personne par un moyen sûr, puis à supprimer de cet ordinateur.');
