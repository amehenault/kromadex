import { sql } from '@/lib/db';
import { crayonsPourCouleurs } from '@/lib/palettes';

export async function ajouterCodes(palettes) {
  const ids = [...new Set(palettes.flatMap((p) => p.packs || []))];
  const crayons = ids.length
    ? await sql`SELECT color_code AS code, color_name AS nom, upper(hex_value) AS hex, brand_id AS pack
        FROM marker_colors WHERE brand_id = ANY(${ids}) AND hex_value ~* '^#[0-9a-f]{6}$'`
    : [];
  return palettes.map((p) => {
    const dispo = crayons.filter((c) => (p.packs || []).includes(c.pack));
    const codes = crayonsPourCouleurs(p.couleurs, dispo);
    return { ...p, codes };
  });
}
