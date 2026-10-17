'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GENRES } from '@/lib/titres';
import { PAYS } from '@/lib/pays';

// Pseudo, nom, biographie et genre
export default function APropos() {
  const router = useRouter();
  const [f, setF] = useState(null);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [modifie, setModifie] = useState(false);

  useEffect(() => {
    fetch('/api/user/apropos').then((r) => (r.ok ? r.json() : null)).then((d) => d && setF(d));
  }, []);

  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setModifie(true); setMessage(''); };

  async function enregistrer() {
    setOccupe(true); setMessage('');
    const res = await fetch('/api/user/apropos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await res.json().catch(() => ({}));
    setOccupe(false);
    if (res.ok) { setModifie(false); router.refresh(); }
    setMessage(res.ok ? 'Profil enregistré' : d.error || 'Erreur, réessaie.');
  }

  if (!f) return null;
  const champ = { display: 'flex', flexDirection: 'column', gap: '4px' };

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)', marginBottom: 'var(--espace-3)' }}>
      <h3 style={{ margin: 0 }}>À propos de moi</h3>
      <label style={champ}>Pseudo
        <input value={f.pseudo} onChange={(e) => set('pseudo', e.target.value)} maxLength={30} placeholder="ex. amelacreative" autoComplete="nickname" />
      </label>
      <label style={champ}>Nom affiché
        <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={60} autoComplete="name" />
      </label>
      <label style={champ}>Biographie
        <textarea rows={3} value={f.bio} onChange={(e) => set('bio', e.target.value)} maxLength={500} placeholder="Ce que tu aimes colorier, tes crayons préférés…" />
      </label>
      <label style={champ}>Genre
        <select value={f.genre} onChange={(e) => set('genre', e.target.value)}>
          {GENRES.map((g) => <option key={g.valeur} value={g.valeur}>{g.label}</option>)}
        </select>
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Sert seulement à accorder ton titre. Non-binaire et Autre utilisent la forme masculine.
        </small>
      </label>
      <label style={champ}>Pays ou région
        <select value={f.pays} onChange={(e) => set('pays', e.target.value)}>
          {PAYS.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
        </select>
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Sert à afficher les heures dans ton fuseau horaire (fin des épreuves, des bingos, des combats…).
        </small>
      </label>
      <button type="button" className="btn btn-corail" disabled={!modifie || occupe} onClick={enregistrer} style={{ minHeight: '46px', fontWeight: 'bold' }}>
        {occupe ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      {message && <small style={{ color: 'var(--texte-secondaire)', textAlign: 'center' }}>{message}</small>}
    </div>
  );
}
