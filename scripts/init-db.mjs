import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
for (const s of readFileSync('db/schema.sql', 'utf8').split(';').map(x => x.trim()).filter(Boolean)) await sql.query(s);
console.log('Base de données prête.');
