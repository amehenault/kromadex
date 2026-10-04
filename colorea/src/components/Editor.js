'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function reduire(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 1400 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
}

function Points({ valeur, onChange, label }) {
  return (
    <div className="points" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} aria-label={`${label} ${i}`} onClick={() => onChange(i === valeur ? 0 : i)}>{i <= valeur ? '●' : '○'}</button>
      ))}
    </div>
  );
}

export default function Editor({ page, categories }) {
  const r = useRouter();
  const [f, setF] = useState({ title: page?.title ?? '', tome: page?.tome ?? '', page_no: page?.page_no ?? '', category: page?.category ?? '', difficulty: page?.difficulty ?? 0, rating: page?.rating ?? 0 });
  const [codes, setCodes] = useState(page?.codes ?? []);
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(page?.has_image ? `/api/pages/${page.id}/image` : null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setCode = (i, k, v) => setCodes((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)));

  async function choisir(e) {
    const x = e.target.files[0]; if (!x) return;
    const b = await reduire(x); setImage(b); setApercu(URL.createObjectURL(b));
  }
  async function enregistrer() {
    setBusy(true); setErreur('');
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append('codes', JSON.stringify(codes));
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
      <div className="feuille">
        <div className="gauche">
          <div className="cadre-image">{apercu ? <img src={apercu} alt="" /> : <span>Ajoute ton image</span>}</div>
          <label className="btn alt">Choisir une photo<input type="file" accept="image/*" hidden onChange={choisir} /></label>
        </div>
        <div>
          <label>Thème ou personnage<input value={f.title} onChange={(e) => set('title', e.target.value)} /></label>
          <div className="deux">
            <label>Tome<input value={f.tome} onChange={(e) => set('tome', e.target.value)} /></label>
            <label>Page<input inputMode="numeric" value={f.page_no} onChange={(e) => set('page_no', e.target.value)} /></label>
          </div>
          <label>Sous-catégorie
            <input list="cats" value={f.category} onChange={(e) => set('category', e.target.value)} />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label>Difficulté<Points label="Difficulté" valeur={f.difficulty} onChange={(v) => set('difficulty', v)} /></label>
          <label>Note finale<Points label="Note finale" valeur={f.rating} onChange={(v) => set('rating', v)} /></label>
        </div>
      </div>
      <div className="carte">
        <h3>Codes couleurs</h3>
        {codes.map((c, i) => (
          <div className="code" key={i}>
            <input className="symbole" maxLength={3} placeholder="A" value={c.sym} onChange={(e) => setCode(i, 'sym', e.target.value)} />
            <input placeholder="Crayon numéro" value={c.pencil} onChange={(e) => setCode(i, 'pencil', e.target.value)} />
            <input type="color" value={c.color || '#cccccc'} onChange={(e) => setCode(i, 'color', e.target.value)} />
            <button className="retirer" aria-label="Retirer" onClick={() => setCodes(codes.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="btn alt" onClick={() => setCodes([...codes, { sym: '', pencil: '', color: '#cccccc' }])}>+ Ajouter un code</button>
      </div>
    </>
  );
}
