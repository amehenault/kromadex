const clamp = (v, a, b) => Math.min(b, Math.max(a, parseInt(v) || 0));
const txt = (v, n) => String(v ?? '').trim().slice(0, n);
export const isId = (s) => /^[0-9a-f-]{36}$/i.test(s);

export async function readForm(req) {
  const f = await req.formData();
  let codes = [];
  try { codes = JSON.parse(f.get('codes') || '[]'); } catch {}
  codes = (Array.isArray(codes) ? codes : []).slice(0, 60).map((c) => ({
    sym: txt(c.sym, 3), pencil: txt(c.pencil, 10),
    color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#cccccc',
  }));
  const data = {
    title: txt(f.get('title'), 120), tome: txt(f.get('tome'), 60),
    page_no: txt(f.get('page_no'), 10), category: txt(f.get('category'), 60),
    difficulty: clamp(f.get('difficulty'), 0, 5), rating: clamp(f.get('rating'), 0, 5), codes,
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
