'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';

const vide = () => ({ id: null, titre: '', debut: '', fin: '', cases: Array.from({ length: 25 }, (_, i) => (i === 12 ? 'Libre' : '')) });

// Créer les bingos : grille 5 x 5, une consigne par case
export default function Bingos() {
  const [bingos, setBingos] = useState([]);
  const [form, setForm] = useState(vide);
  const [caseActive, setCaseActive] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/bingos');
    if (res.ok) setBingos((await res.json()).bingos || []);
  }
  useEffect(() => { charger(); }, []);

  const remplies = form.cases.filter((c) => c.trim()).length;

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/bingos', 'POST', form);
    setMessage(r.ok ? 'Bingo enregistré ✓' : r.error);
    if (r.ok) { setForm(vide()); setCaseActive(null); charger(); }
  }

  async function supprimer(b) {
    if (!confirm(`Supprimer le bingo « ${b.titre} » ?`)) return;
    await envoyer('/api/bingos', 'DELETE', { id: b.id });
    charger();
  }

  const changerCase = (i, v) => setForm({ ...form, cases: form.cases.map((c, j) => (j === i ? v : c)) });

  return (
    <div style={colonne}>
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? 'Modifier le bingo' : 'Nouveau bingo'}</b>
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Bingo d'automne" maxLength={100} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début
            <input type="date" value={form.debut || ''} onChange={(e) => setForm({ ...form, debut: e.target.value })} style={dateStyle} />
          </label>
          <label style={champ}>Fin
            <input type="date" value={form.fin || ''} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={dateStyle} />
          </label>
        </div>

        <small style={aide}>Touche une case pour écrire sa consigne ({remplies} / 25 remplies).</small>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '4px' }}>
          {form.cases.map((c, i) => (
            <button key={i} type="button" onClick={() => setCaseActive(i)}
              style={{
                aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', fontSize: '0.62rem', lineHeight: 1.1, padding: '2px',
                overflow: 'hidden', cursor: 'pointer', wordBreak: 'break-word',
                border: caseActive === i ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
                background: c.trim() ? 'var(--carte)' : 'var(--fond-carte)', color: 'var(--texte-principal)',
              }}>
              {c || i + 1}
            </button>
          ))}
        </div>
        {caseActive !== null && (
          <label style={champ}>Case {caseActive + 1}
            <input autoFocus value={form.cases[caseActive]} maxLength={80}
              onChange={(e) => changerCase(caseActive, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setCaseActive(caseActive < 24 ? caseActive + 1 : null); } }}
              placeholder="ex. Une page avec du violet" />
          </label>
        )}

        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.titre.trim() || remplies < 25} style={{ flex: 1, minHeight: '44px' }}>Enregistrer le bingo</button>
          {form.id && <button type="button" className="btn alt" onClick={() => { setForm(vide()); setCaseActive(null); }}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      <div className="carte" style={colonne}>
        <b>Bingos créés</b>
        {bingos.map((b) => (
          <div key={b.id} style={ligneCarte}>
            <b>{b.titre}</b>
            {(b.debut || b.fin) && <small style={aide}>{b.debut || '?'} au {b.fin || '?'}</small>}
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => { setForm({ id: b.id, titre: b.titre, debut: b.debut || '', fin: b.fin || '', cases: b.cases }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Modifier
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(b)}><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        ))}
        {!bingos.length && <p style={aide}>Aucun bingo pour le moment.</p>}
      </div>
    </div>
  );
}
