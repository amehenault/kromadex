import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
// Catalogue des tomes (db/tomes.json) : insertion ou mise à jour par EAN
const tomes = JSON.parse(readFileSync('db/tomes.json', 'utf8'));
await sql.transaction(tomes.map((t) => sql`
  insert into tome_catalog (ean, nom, titre, type, editeur, collection, nb_pages, couverture, url)
  values (${t.ean}, ${t.nom}, ${t.titre}, ${t.type}, ${t.editeur}, ${t.collection}, ${t.nb_pages}, ${t.couverture}, ${t.url})
  on conflict (ean) do update set nom = excluded.nom, titre = excluded.titre, type = excluded.type, editeur = excluded.editeur,
    collection = excluded.collection, couverture = excluded.couverture, url = excluded.url,
    -- Un nombre de pages changé dans l'Espace de l'Invocatrice est gardé (tomes.json ne l'écrase pas)
    nb_pages = CASE WHEN tome_catalog.nb_pages_manuel THEN tome_catalog.nb_pages ELSE excluded.nb_pages END`));
console.log(`${tomes.length} tomes dans le catalogue.`);
