// Remplit la clé de comparaison des mots-clefs qui n'en ont pas encore (après la migration 2026-10-22-mots-cles-cle.sql).
//   node --env-file=.env.local scripts/mots-cles-cles.mjs
// Ne supprime rien : un doublon éventuel est seulement affiché, pour être réglé à la main dans l'Espace (onglet Mots-clefs).
import { neon } from '@neondatabase/serverless';
import { cleMot } from '../src/lib/cleMot.js';
const sql = neon(process.env.DATABASE_URL);
let n = 0;
for (const m of await sql`SELECT id, tome_id, page_no, mot FROM mots_cles WHERE cle IS NULL ORDER BY id`) {
  try { await sql`UPDATE mots_cles SET cle = ${cleMot(m.mot)} WHERE id = ${m.id}`; n++; }
  catch { console.log(`Doublon à régler : « ${m.mot} » (id ${m.id}, tome ${m.tome_id}, page ${m.page_no || 'tout le livre'})`); }
}
console.log(`${n} clé(s) de mots-clefs remplie(s).`);
