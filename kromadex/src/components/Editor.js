'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SymbolPicker from './SymbolPicker';

const NOUVEAU = '__nouveau__';
const uid = () => crypto.randomUUID();
const groupeVide = () => ({ id: uid(), name: '', rows: [] });

// La ligne suivante propose automatiquement A puis B, ou 1 puis 2
const suivant = (v) => {
  if (/^[A-Y]$/.test(v || '')) return String.fromCharCode(v.charCodeAt(0) + 1);
  if (/^[1-8]$/.test(v || '')) return String(+v + 1);
  return v === '9' ? '0' : '';
};

// Remet en ordre les anciens coloriages (liste plate de codes) et ajoute les identifiants
function normaliser(codes) {
  if (!Array.isArray(codes) || !codes.length) return [groupeVide()];
  if (!codes[0].rows) return [{ id: uid(), name: '', rows: codes.map((c) => ({ id: uid(), sym: c.sym || '', num: c.pencil || '' })) }];
  return codes.map((g) => ({ id: g.id || uid(), name: g.name || '', rows: (g.rows || []).map((r) => ({ id: r.id || uid(), sym: r.sym || '', num: r.num || '' })) }));
}

async function reduire(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 1400 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
}

// 2 colonnes sur mobile, 3 sur ordinateur
function useColonnes() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const maj = () => setN(mq.matches ? 3 : 2);
    maj(); mq.addEventListener('change', maj);
    return () => mq.removeEventListener('change', maj);
  }, []);
  return n;
}

function Groupe({ g, maj, retirer }) {
  const setRow = (id, k, v) => maj({ ...g, rows: g.rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  const ajouter = () => maj({ ...g, rows: [...g.rows, { id: uid(), sym: suivant(g.rows.at(-1)?.sym), num: '' }] });
  return (
    <section className="groupe">
      <div className="groupe-tete">
        <input placeholder="Sous-catégorie" aria-label="Nom de la sous-catégorie" value={g.name} onChange={(e) => maj({ ...g, name: e.target.value })} />
        <button type="button" className="retirer" aria-label="Retirer la sous-catégorie" onClick={retirer}>✕</button>
      </div>
      {g.rows.map((r) => (
        <div className="ligne" key={r.id}>
          <SymbolPicker value={r.sym} onChange={(v) => setRow(r.id, 'sym', v)} />
          <input inputMode="numeric" placeholder="#" aria-label="Numéro de crayon" value={r.num} onChange={(e) => setRow(r.id, 'num', e.target.value)} />
          <button type="button" className="retirer" aria-label="Retirer la ligne" onClick={() => maj({ ...g, rows: g.rows.filter((x) => x.id !== r.id) })}>✕</button>
        </div>
      ))}
      <button type="button" className="plus" aria-label="Ajouter une ligne" onClick={ajouter}>+</button>
    </section>
  );
}

export default function Editor({ page, tomes: tomesInitiaux }) {
  const r = useRouter();
  const n = useColonnes();
  const [f, setF] = useState({ title: page?.title ?? '', tome: page?.tome ?? '', page_no: page?.page_no ?? '' });
  const [tomes, setTomes] = useState(tomesInitiaux);
  const [ecritTome, setEcritTome] = useState(false);
  const [groupes, setGroupes] = useState(() => normaliser(page?.codes));
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(page?.has_image ? `/api/pages/${page.id}/image` : null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const choisirTome = (v) => { if (v === NOUVEAU) { set('tome', ''); setEcritTome(true); } else set('tome', v); };
  const validerTome = () => {
    const t = f.tome.trim();
    if (t) setTomes((l) => (l.includes(t) ? l : [...l, t].sort()));
    set('tome', t); setEcritTome(false);
  };
  async function choisir(e) {
    const x = e.target.files[0]; if (!x) return;
    const b = await reduire(x); setImage(b); setApercu(URL.createObjectURL(b));
  }
  const majGroupe = (g) => setGroupes((l) => l.map((x) => (x.id === g.id ? g : x)));
  const retirerGroupe = (g) => {
    if (g.rows.length && !confirm('Retirer cette sous-catégorie et ses codes?')) return;
    setGroupes((l) => l.filter((x) => x.id !== g.id));
  };

  async function enregistrer() {
    setBusy(true); setErreur('');
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append('codes', JSON.stringify(groupes));
    if (image) fd.append('image', image, 'image.jpg');
    const res = await fetch(page ? `/api/pages/${page.id}` : '/api/pages', { method: page ? 'PUT' : 'POST', body: fd });
    if (res.ok) { r.push('/'); r.refresh(); return; }
    setErreur((await res.json().catch(() => ({}))).error || 'Enregistrement impossible.');
    setBusy(false);
  }
  async function supprimer() {
    if (!confirm('Supprimer ce coloriage pour toujours?')) return;
    await fetch(`/api/pages/${page.id}`, { method: 'DELETE' });
    r.push('/'); r.refresh();
  }

  return (
    <>
      <div className="barre">
        <button className="btn alt" onClick={() => r.push('/')}>Retour</button>
        {page && <button className="btn danger" onClick={supprimer}>Supprimer</button>}
        <button className="btn" onClick={enregistrer} disabled={busy}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
      <p className="erreur">{erreur}</p>

      <div className="haut">
        <div className="gauche">
          <div className="cadre-image">{apercu ? <img src={apercu} alt="" /> : <span>Ajoute ton image</span>}</div>
          <label className="btn alt">Choisir une photo<input type="file" accept="image/*" hidden onChange={choisir} /></label>
        </div>
        <div className="droite">
          <div className="deux">
            <div>
              {ecritTome ? (
                <>
                  <label htmlFor="nom-tome">Nom du tome</label>
                  <div className="tome-nouveau">
                    <input id="nom-tome" autoFocus value={f.tome} onChange={(e) => set('tome', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && validerTome()} />
                    <button type="button" className="btn" onClick={validerTome}>OK</button>
                  </div>
                </>
              ) : (
                <label>Tome
                  <select value={f.tome} onChange={(e) => choisirTome(e.target.value)}>
                    <option value="">Choisir</option>
                    {f.tome && !tomes.includes(f.tome) && <option>{f.tome}</option>}
                    {tomes.map((t) => <option key={t}>{t}</option>)}
                    <option value={NOUVEAU}>+ Nouveau tome</option>
                  </select>
                </label>
              )}
            </div>
            <label>Page<input inputMode="numeric" value={f.page_no} onChange={(e) => set('page_no', e.target.value)} /></label>
          </div>
        </div>
      </div>

      <h3 className="titre-codes">Codes couleurs</h3>
      <div className="colonnes">
        {Array.from({ length: n }, (_, c) => (
          <div className="colonne" key={c}>
            {groupes.filter((_, i) => i % n === c).map((g) => <Groupe key={g.id} g={g} maj={majGroupe} retirer={() => retirerGroupe(g)} />)}
            {c === groupes.length % n && <button type="button" className="btn alt ajout-groupe" onClick={() => setGroupes((l) => [...l, groupeVide()])}>+ Sous-catégorie</button>}
          </div>
        ))}
      </div>
    </>
  );
}
