// Serveur local branché sur la base de TEST : npm run start:test
// NODE_ENV=test : Next ne lit PAS .env.local (clés de production : Resend, notifications, base de production),
// seulement .env.test.local. Aucun courriel ni notification ne peut partir, et la base de production n'est pas touchée.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

if (!existsSync('.env.test.local')) { console.error('Fichier .env.test.local manquant (voir scripts/preparer-base-test.mjs).'); process.exit(1); }
const test = parseEnv(readFileSync('.env.test.local', 'utf8'));
const prod = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
const hote = (u) => { try { return new URL(u).host; } catch { return ''; } };
if (!test.DATABASE_URL || hote(test.DATABASE_URL) === hote(prod.DATABASE_URL)) {
  console.error('REFUS : .env.test.local doit viser la branche Neon de test, pas la production.');
  process.exit(1);
}
const enfant = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3123'], {
  stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' },
});
enfant.on('exit', (code) => process.exit(code ?? 0));
