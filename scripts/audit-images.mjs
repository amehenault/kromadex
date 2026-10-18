// Inventaire des images déjà enregistrées (LECTURE SEULE, rien n'est modifié ni supprimé).
//   node --env-file=.env.local scripts/audit-images.mjs
// Classe chaque image d'après ses premiers octets : jpeg, png, webp, ou « suspecte » (pas une vraie image).
// Depuis la correction de sécurité, une image suspecte n'est plus jamais servie par l'appli (réponse 404),
// mais elle reste dans la base : la liste permet de décider ensuite quoi en faire.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function formatReel(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

const sources = {
  coloriages: sql`SELECT id::text, substr(image_b64, 1, 24) AS debut, image_type AS type, octet_length(image_b64) AS taille FROM pages WHERE image_b64 IS NOT NULL`,
  couvertures: sql`SELECT user_id || ' / ' || tome_name AS id, substr(image_b64, 1, 24) AS debut, image_type AS type, octet_length(image_b64) AS taille FROM tome_covers WHERE image_b64 IS NOT NULL`,
  avatars: sql`SELECT id::text, substr(avatar_b64, 1, 24) AS debut, avatar_type AS type, octet_length(avatar_b64) AS taille FROM users WHERE avatar_b64 IS NOT NULL`,
};

for (const [nom, requete] of Object.entries(sources)) {
  const lignes = await requete;
  const compte = {};
  const suspectes = [];
  let lourdes = 0;
  for (const l of lignes) {
    const f = formatReel(Buffer.from(l.debut, 'base64')) || 'suspecte';
    compte[f] = (compte[f] || 0) + 1;
    if (f === 'suspecte') suspectes.push(`${l.id} (type annoncé : ${l.type || 'aucun'})`);
    if (l.taille > 5_600_000) lourdes++; // environ 4 Mo une fois décodée
  }
  console.log(`\n${nom} : ${lignes.length} image(s)`, compte, lourdes ? `, ${lourdes} de plus de 4 Mo` : '');
  for (const s of suspectes) console.log(`  suspecte : ${s}`);
}
