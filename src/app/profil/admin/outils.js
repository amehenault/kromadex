export async function envoyer(url, method, corps) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const d = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, ...d } : { ok: false, error: d.error || 'Erreur' };
}

export const colonne = { display: 'flex', flexDirection: 'column', gap: '8px' };
export const ligneCarte = {
  padding: '10px 12px', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-m)',
  border: '1px solid var(--bordure-carte)', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0,
};
export const champ = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600, minWidth: 0 };
export const dateStyle = { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 6px' };
export const actions = { display: 'flex', gap: '8px', flexWrap: 'wrap' };
export const petitBtn = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };
export const aide = { color: 'var(--texte-secondaire)', margin: 0, fontSize: '0.85rem' };
