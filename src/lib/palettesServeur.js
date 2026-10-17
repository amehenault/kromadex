import { sql } from '@/lib/db';
import { crayonLePlusProche } from '@/lib/palettes';

// Pour chaque palette, le crayon le plus proche de chaque couleur, choisi seulement dans les packs de la palette
// (codes : [{ hex, code, nom }] ; vide si la palette est « sans pack précis »)
export async function ajouterCodes(palettes) {
  const ids = [...new Set(palettes.flatMap((p) => p.packs || []))];
  const crayons = ids.length
    ? await sql`SELECT color_code AS code, color_name AS nom, upper(hex_value) AS hex, brand_id AS pack
        FROM marker_colors WHERE brand_id = ANY(${ids}) AND hex_value ~* '^#[0-9a-f]{6}$'`
    : [];
  return palettes.map((p) => {
    const dispo = crayons.filter((c) => (p.packs || []).includes(c.pack));
    // Un seul cercle par crayon, même si deux couleurs mènent au même code
    const vus = new Set();
    const codes = dispo.length
      ? p.couleurs.map((hex) => crayonLePlusProche(hex, dispo))
          .filter((c) => { const cle = `${c.pack}:${c.code || c.nom}`; if (vus.has(cle)) return false; vus.add(cle); return true; })
          .map((c) => ({ hex: c.hex, code: c.code || '', nom: c.nom || '' }))
      : [];
    return { ...p, codes };
  });
}
