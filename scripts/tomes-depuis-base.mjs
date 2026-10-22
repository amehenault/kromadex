// Recopie dans db/tomes.json les nombres de pages changés dans l'Espace de l'Invocatrice (onglet Tomes et livres).
//   npm run tomes:recuperer
// Facultatif : l'appli fonctionne sans. Sert seulement à garder db/tomes.json à jour (lecture seule dans la base).
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
const tomes = JSON.parse(readFileSync('db/tomes.json', 'utf8'));
const changes = Object.fromEntries((await sql`SELECT ean, nb_pages FROM tome_catalog WHERE nb_pages_manuel`).map((t) => [t.ean, t.nb_pages]));
let n = 0;
for (const t of tomes) {
  if (t.ean in changes && t.nb_pages !== changes[t.ean]) { console.log(`${t.nom} : ${t.nb_pages} → ${changes[t.ean]}`); t.nb_pages = changes[t.ean]; n++; }
}
writeFileSync('db/tomes.json', JSON.stringify(tomes, null, 2) + '\n');
console.log(`${n} nombre(s) de pages recopié(s) dans db/tomes.json.`);
