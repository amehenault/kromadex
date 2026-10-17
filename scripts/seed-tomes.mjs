import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
// Catalogue des tomes (db/tomes.json) : insertion ou mise à jour par EAN
const tomes = JSON.parse(readFileSync('db/tomes.json', 'utf8'));
await sql.transaction(tomes.map((t) => sql`
  insert into tome_catalog (ean, nom, titre, type, editeur, collection, nb_pages, couverture, url)
  values (${t.ean}, ${t.nom}, ${t.titre}, ${t.type}, ${t.editeur}, ${t.collection}, ${t.nb_pages}, ${t.couverture}, ${t.url})
  on conflict (ean) do update set nom = excluded.nom, titre = excluded.titre, type = excluded.type, editeur = excluded.editeur,
    collection = excluded.collection, nb_pages = excluded.nb_pages, couverture = excluded.couverture, url = excluded.url`));
console.log(`${tomes.length} tomes dans le catalogue.`);
