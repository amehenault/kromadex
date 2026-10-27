import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const fichier = process.argv[2];
if (!fichier) { console.error('Indique le fichier de migration.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const instructions = readFileSync(fichier, 'utf8').split(';')
  .map((x) => x.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim()).filter(Boolean);
for (const s of instructions) await sql.query(s);
console.log(`${instructions.length} instructions appliquées depuis ${fichier}.`);
