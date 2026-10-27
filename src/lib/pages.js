const clamp = (v, a, b) => Math.min(b, Math.max(a, parseInt(v) || 0));
const txt = (v, n) => String(v ?? '').trim().slice(0, n);
export const isId = (s) => /^[0-9a-f-]{36}$/i.test(s);

export async function readForm(req) {
  const f = await req.formData();
  let groupes = [];
  try { groupes = JSON.parse(f.get('codes') || '[]'); } catch {}
  groupes = (Array.isArray(groupes) ? groupes : []).slice(0, 40).map((g) => ({
    id: txt(g.id, 40), 
    name: txt(g.name, 60),
    rows: (Array.isArray(g.rows) ? g.rows : []).slice(0, 80).map((r) => ({ 
      id: txt(r.id, 40), 
      sym: txt(r.sym, 30), 
      num: txt(r.num, 60)
    })),
  }));
  const data = {
    title: txt(f.get('title'), 120), 
    tome: txt(f.get('tome'), 60),
    page_no: txt(f.get('page_no'), 10), 
    category: '',
    difficulty: clamp(f.get('difficulty'), 0, 5), 
    rating: clamp(f.get('rating'), 0, 5), 
    codes: groupes,
  };
  const img = f.get('image');
  let image = null;
  if (img && typeof img === 'object' && img.size) {
    if (img.size > 1_500_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(img.type))
      throw new Error('Image invalide (JPG, PNG ou WebP, 1,5 Mo maximum).');
    image = { b64: Buffer.from(await img.arrayBuffer()).toString('base64'), type: img.type };
  }
  return { data, image };
}

const TYPES = ['mystere', 'cozy', 'autre'];
export function lirePublication(f) {
  const type = String(f.get('type_coloriage') || '');
  const publiee = f.get('publiee') === '1' && TYPES.includes(type);
  return { publiee, type: TYPES.includes(type) ? type : '' };
}

export async function lirePalette(f, userId) {
  const { sql } = await import('@/lib/db');
  const id = parseInt(f.get('palette_id'), 10);
  if (!id) return null;
  const [p] = await sql`SELECT id FROM palettes WHERE id = ${id} AND (user_id = ${userId} OR partagee)`;
  return p ? p.id : null;
}
