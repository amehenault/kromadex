'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';

const FETES = ['Nouvel An', 'Saint-Valentin', 'Pâques', 'Fête des mères', 'Fête des pères', 'Saint-Jean', 'Halloween', 'Noël'];
const vide = () => ({ id: null, fete: '', titre: '', description: '', etapes: [''], xp: 100, debut: '', fin: '', active: true });

// Parcours de quêtes : une quête par fête, avec ses étapes, ses XP et ses dates
export default function Quetes() {
  const [quetes, setQuetes] = useState([]);
  const [form, setForm] = useState(vide);
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/quetes');
    if (res.ok) setQuetes((await res.json()).quetes || []);
  }
  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/quetes', 'POST', form);
    setMessage(r.ok ? 'Quête enregistrée' : r.error);
    if (r.ok) { setForm(vide()); charger(); }
  }

  async function supprimer(q) {
    if (!confirm(`Supprimer la quête « ${q.titre} » ?`)) return;
    await envoyer('/api/quetes', 'DELETE', { id: q.id });
    charger();
  }

  const changerEtape = (i, v) => setForm({ ...form, etapes: form.etapes.map((x, j) => (j === i ? v : x)) });
  const fetesPrises = new Set(quetes.filter((q) => q.id !== form.id).map((q) => q.fete));

  return (
    <div style={colonne}>
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? 'Paramétrer la quête' : 'Nouvelle quête de fête'}</b>
        <label style={champ}>Fête
          <input list="fetes" value={form.fete} onChange={(e) => setForm({ ...form, fete: e.target.value })} placeholder="ex. Noël" maxLength={60} />
          <datalist id="fetes">{FETES.filter((f) => !fetesPrises.has(f)).map((f) => <option key={f} value={f} />)}</datalist>
        </label>
        {fetesPrises.has(form.fete) && <small style={{ color: 'var(--danger)' }}>Il existe déjà une quête pour cette fête.</small>}
        <label style={champ}>Nom de la quête
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Le village enneigé" maxLength={100} />
        </label>
        <label style={champ}>Description
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
        </label>

        <b style={{ fontSize: '0.9rem' }}>Étapes du parcours</b>
        {form.etapes.map((et, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <small style={{ width: '18px', fontWeight: 700 }}>{i + 1}.</small>
            <input value={et} onChange={(e) => changerEtape(i, e.target.value)} placeholder="ex. Colorier une page avec du rouge" maxLength={120} style={{ flex: 1, minWidth: 0 }} />
            {form.etapes.length > 1 && (
              <button type="button" className="btn alt" aria-label="Retirer l'étape" style={{ ...petitBtn, padding: '0 10px' }}
                onClick={() => setForm({ ...form, etapes: form.etapes.filter((_, j) => j !== i) })}><X size={14} /></button>
            )}
          </div>
        ))}
        {form.etapes.length < 20 && (
          <button type="button" className="btn alt" style={{ ...petitBtn, alignSelf: 'flex-start' }} onClick={() => setForm({ ...form, etapes: [...form.etapes, ''] })}>
            <Plus size={14} /> Ajouter une étape
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début
            <input type="date" value={form.debut || ''} onChange={(e) => setForm({ ...form, debut: e.target.value })} style={dateStyle} />
          </label>
          <label style={champ}>Fin
            <input type="date" value={form.fin || ''} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={dateStyle} />
          </label>
        </div>
        <label style={champ}>XP gagnés à la fin
          <input type="number" inputMode="numeric" min={0} max={5000} value={form.xp} onChange={(e) => setForm({ ...form, xp: e.target.value })} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 'auto' }} />
          Quête active
        </label>

        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.fete.trim() || !form.titre.trim() || fetesPrises.has(form.fete)} style={{ flex: 1, minHeight: '44px' }}>
            Enregistrer la quête
          </button>
          {form.id && <button type="button" className="btn alt" onClick={() => setForm(vide())}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      <div className="carte" style={colonne}>
        <b>Parcours de l'année</b>
        {quetes.map((q) => (
          <div key={q.id} style={{ ...ligneCarte, opacity: q.active ? 1 : 0.6 }}>
            <small style={{ ...aide, textTransform: 'uppercase', fontWeight: 700 }}>{q.fete}{q.active ? '' : ' · inactive'}</small>
            <b>{q.titre}</b>
            <small style={aide}>
              {q.etapes.length} étape{q.etapes.length > 1 ? 's' : ''} · {q.xp} XP{q.debut || q.fin ? ` · ${q.debut || '?'} au ${q.fin || '?'}` : ''}
            </small>
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => { setForm({ ...q, etapes: q.etapes.length ? q.etapes : [''], debut: q.debut || '', fin: q.fin || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Paramétrer
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(q)}><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        ))}
        {!quetes.length && <p style={aide}>Aucune quête pour le moment.</p>}
      </div>
    </div>
  );
}
