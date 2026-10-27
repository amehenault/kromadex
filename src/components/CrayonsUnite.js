'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ChoixCouleur from './ChoixCouleur';
import TexteErreur from './TexteErreur';

const envoyer = (method, corps) => fetch('/api/crayons-unite', {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
}).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

export default function CrayonsUnite() {
  const [crayons, setCrayons] = useState([]);
  const [form, setForm] = useState({ marque: '', code: '', hex: '#CCCCCC' });
  const [couleur, setCouleur] = useState(false);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    fetch('/api/crayons-unite').then((r) => (r.ok ? r.json() : { crayons: [] })).then((d) => setCrayons(d.crayons || [])).catch(() => {});
  }, []);

  async function ajouter(e) {
    e.preventDefault();
    setErreur(''); setOccupe(true);
    const r = await envoyer('POST', form);
    setOccupe(false);
    if (!r.ok) { setErreur(r.error || 'Erreur, réessaie.'); return; }
    setCrayons((l) => [...l, r.crayon].sort((a, b) => a.marque.localeCompare(b.marque, 'fr') || String(a.code).localeCompare(String(b.code), 'fr', { numeric: true })));
    setForm((f) => ({ ...f, code: '' }));
  }
  async function retirer(c) {
    if (!confirm(`Retirer le crayon ${c.code} (${c.marque}) ?`)) return;
    const r = await envoyer('DELETE', { id: c.id });
    if (r.ok) setCrayons((l) => l.filter((x) => x.id !== c.id));
  }

  return (
    <div className="carte" style={{ marginBottom: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)' }}>
      <h3 style={{ margin: 0 }}>Crayons à l’unité</h3>
      <small style={{ color: 'var(--texte-secondaire)' }}>
        Un crayon qui n’est dans aucun coffret ? Écris sa marque et son code, puis choisis la couleur de sa pastille.
        Tu le retrouveras dans « Crayons à l’unité » en choisissant un code couleur.
      </small>

      <form onSubmit={ajouter} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '0.85rem', minWidth: 0 }}>Marque
          <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} maxLength={60} placeholder="ex: Ohuhu" style={{ margin: 0 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '0.85rem', minWidth: 0 }}>Code de la couleur
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={40} placeholder="ex: BG-135" style={{ margin: 0 }} />
        </label>
        <button type="button" className="btn alt" onClick={() => setCouleur(true)} aria-label={`Couleur de la pastille : ${form.hex}. Changer`}
          style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: 0, whiteSpace: 'nowrap', wordBreak: 'normal', overflowWrap: 'normal' }}>
          <span aria-hidden="true" style={{ width: 24, height: 24, flex: '0 0 auto', borderRadius: '50%', background: form.hex, border: '1px solid rgba(0,0,0,0.15)' }} />
          <span>Pastille</span>
        </button>
        <button type="submit" className="btn" disabled={occupe || !form.marque.trim() || !form.code.trim()}
          style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, minWidth: 0 }}>
          <Plus size={18} aria-hidden="true" /> Ajouter
        </button>
      </form>
      {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}

      {crayons.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '8px' }}>
          {crayons.map((c) => (
            <div key={c.id} style={{
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px 8px',
              minWidth: 0, textAlign: 'center', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)',
            }}>
              <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '50%', background: c.hex || '#808080', border: '1px solid rgba(0,0,0,0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }} />
              <b style={{ fontSize: '0.9rem', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{c.code}</b>
              <small style={{ fontSize: '0.7rem', color: 'var(--texte-secondaire)', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{c.marque}</small>
              <button type="button" onClick={() => retirer(c)} aria-label={`Retirer ${c.code} ${c.marque}`}
                style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 0, right: 0, width: 36, height: 36, display: 'grid', placeItems: 'center', color: 'var(--danger)' }}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucun crayon à l’unité pour l’instant.</p>
      )}

      {couleur && (
        <ChoixCouleur valeur={form.hex} onFermer={() => setCouleur(false)}
          onChoisir={(hex) => { setForm({ ...form, hex }); setCouleur(false); }} />
      )}
    </div>
  );
}
