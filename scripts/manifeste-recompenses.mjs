// Liste de toutes les images de récompenses du jeu, pour l'onglet Récompenses de l'Espace de l'Invocatrice.
// Lancé automatiquement avant chaque compilation (npm run build) : les fichiers de public/ ne sont pas lisibles
// par le serveur une fois en ligne, la liste est donc écrite d'avance dans src/lib/manifesteRecompenses.json.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PUBLIC = 'public';
const DOSSIERS = ['recompenses-activites', 'pionniers', 'inventaire'];
const EXTENSIONS = /\.(svg|png|webp|jpe?g)$/i;

// Type affiché (et filtre) d'après le dossier et le nom du fichier
function typeDe(chemin) {
  const c = chemin.toLowerCase();
  if (c.startsWith('pionniers/')) return 'Pionnières et Pionniers';
  if (c.startsWith('inventaire/')) return 'Inventaire';
  if (c.includes('/epreuve/chef/')) return 'Épreuve des chef.fes';
  if (c.includes('/epreuve/mensuelles/')) return 'Épreuve mensuelle';
  if (c.includes('/epreuve/sentinelles/')) return 'Épreuve des Sentinelles';
  if (c.includes('/epreuve/groupe/')) return 'Épreuve de groupe';
  if (c.includes('/bingo/')) return 'Bingo';
  if (c.includes('/expedition/')) return 'Expédition';
  if (c.includes('/combat/')) {
    if (c.includes('duel') || c.includes('epee')) return 'Duel';
    if (c.includes('joute')) return 'Joute';
    if (c.includes('tournoi') || c.includes('insigne')) return 'Tournoi du royaume';
    return 'Combat';
  }
  if (c.includes('blason') || c.includes('epopee')) return 'Épopée';
  if (c.includes('orbe') || c.includes('prophetie')) return 'Prophétie';
  return 'Autres';
}

// Dimensions : attributs width/height ou viewBox d'un SVG, en-tête d'un PNG
function dimensions(fichier, buf) {
  if (/\.svg$/i.test(fichier)) {
    const t = buf.toString('utf8', 0, Math.min(buf.length, 4000));
    const vb = t.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (vb) return { largeur: Math.round(Number(vb[1])), hauteur: Math.round(Number(vb[2])) };
    const w = t.match(/\swidth="([\d.]+)/i); const h = t.match(/\sheight="([\d.]+)/i);
    return w && h ? { largeur: Math.round(Number(w[1])), hauteur: Math.round(Number(h[1])) } : {};
  }
  if (/\.png$/i.test(fichier) && buf.length > 24) return { largeur: buf.readUInt32BE(16), hauteur: buf.readUInt32BE(20) };
  return {};
}

function parcourir(dossier, liste = []) {
  let entrees = [];
  try { entrees = readdirSync(dossier, { withFileTypes: true }); } catch { return liste; }
  for (const e of entrees) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) parcourir(chemin, liste);
    else if (EXTENSIONS.test(e.name)) liste.push(chemin);
  }
  return liste;
}

const images = DOSSIERS.flatMap((d) => parcourir(join(PUBLIC, d))).map((f) => {
  const rel = relative(PUBLIC, f).split(sep).join('/');
  const buf = readFileSync(f);
  return { chemin: `/${rel}`, fichier: rel.split('/').pop(), type: typeDe(rel), octets: statSync(f).size, ...dimensions(f, buf) };
}).sort((a, b) => a.type.localeCompare(b.type, 'fr') || a.fichier.localeCompare(b.fichier, 'fr', { numeric: true }));

writeFileSync('src/lib/manifesteRecompenses.json', `${JSON.stringify(images, null, 2)}\n`);
console.log(`${images.length} images de récompenses listées.`);
