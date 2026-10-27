import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
const tomes = JSON.parse(readFileSync('db/tomes.json', 'utf8'));
await sql.transaction(tomes.map((t) => sql`
  insert into tome_catalog (ean, nom, autre_nom, titre, type, editeur, collection, nb_pages, couverture, url)
  values (${t.ean}, ${t.nom}, ${t.autre_nom || ''}, ${t.titre}, ${t.type}, ${t.editeur}, ${t.collection}, ${t.nb_pages}, ${t.couverture}, ${t.url})
  on conflict (ean) do update set nom = excluded.nom, autre_nom = excluded.autre_nom, titre = excluded.titre, type = excluded.type, editeur = excluded.editeur,
    collection = excluded.collection, couverture = excluded.couverture, url = excluded.url,
    nb_pages = CASE WHEN tome_catalog.nb_pages_manuel THEN tome_catalog.nb_pages ELSE excluded.nb_pages END`));
console.log(`${tomes.length} tomes dans le catalogue.`);
