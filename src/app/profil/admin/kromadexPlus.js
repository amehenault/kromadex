'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Gift, Trash2, Pencil, X } from 'lucide-react';
import Pseudo from '@/components/Pseudo';
import { jourQuebec } from '@/lib/temps';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';

const jourLong = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Kromadex+ offert : rechercher un membre, lui offrir Kromadex+ (avec ou sans date limite, et une raison pour soi),
// et voir uniquement les membres à qui il est offert, pour modifier ou retirer
export default function KromadexPlus() {
  const [offerts, setOfferts] = useState([]);
  const [membres, setMembres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState(null); // { userId, nom, jusqu, raison, modification }
  const [message, setMessage] = useState('');

  async function charger() {
    const [a, b] = await Promise.all([fetch('/api/abonnement'), fetch('/api/roles')]);
    if (a.ok) setOfferts((await a.json()).membres || []);
    if (b.ok) setMembres((await b.json()).users || []);
  }
  useEffect(() => { charger(); }, []);

  // Suggestions de la recherche : membres sans Kromadex+ offert (l'Invocatrice exclue)
  const suggestions = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (q.length < 2) return [];
    const deja = new Set(offerts.map((o) => String(o.id)));
    return membres.filter((u) => u.role !== 'admin' && !deja.has(String(u.id))
      && [u.pseudo, u.name, u.email].some((x) => (x || '').toLowerCase().includes(q))).slice(0, 8);
  }, [recherche, membres, offerts]);

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/abonnement', 'PUT', { userId: form.userId, jusqu: form.jusqu || null, raison: form.raison });
    setMessage(r.ok ? (form.modification ? 'Modifié' : 'Kromadex+ offert') : r.error);
    if (r.ok) { setForm(null); setRecherche(''); charger(); }
  }
  async function retirer(o) {
    if (!confirm(`Retirer Kromadex+ offert à ${o.pseudo ? `@${o.pseudo}` : o.name || o.email} ?`)) return;
    const r = await envoyer('/api/abonnement', 'DELETE', { userId: o.id });
    setMessage(r.ok ? 'Kromadex+ retiré' : r.error);
    charger();
  }

  return (
    <div style={colonne}>
      {/* Offrir à quelqu'un */}
      <div className="carte" style={colonne}>
        <b>Offrir Kromadex+</b>
        {!form ? (
          <>
            <div style={{ position: 'relative' }}>
              <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
              <input placeholder="Rechercher un membre (pseudo, nom ou courriel)" value={recherche} onChange={(e) => setRecherche(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }} aria-label="Rechercher un membre" />
            </div>
            {suggestions.map((u) => (
              <button key={u.id} type="button" className="btn alt" onClick={() => setForm({ userId: u.id, nom: u, jusqu: '', raison: '' })}
                style={{ justifyContent: 'flex-start', minHeight: '48px', gap: '8px' }}>
                <Gift size={16} aria-hidden="true" /> <Pseudo x={u} /> {u.name && u.pseudo ? <small style={aide}>{u.name}</small> : null}
              </button>
            ))}
            {recherche.trim().length >= 2 && !suggestions.length && <small style={aide}>Aucun membre trouvé (ou Kromadex+ lui est déjà offert).</small>}
          </>
        ) : (
          <form onSubmit={enregistrer} style={colonne}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span>{form.modification ? 'Modifier pour' : 'Pour'} <Pseudo x={form.nom} /></span>
              <button type="button" className="btn alt" aria-label="Annuler" onClick={() => setForm(null)} style={{ minWidth: '44px', minHeight: '44px', padding: 0 }}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <label style={champ}>Valable jusqu’au (facultatif)
              <input type="date" value={form.jusqu} min={jourQuebec()} onChange={(e) => setForm({ ...form, jusqu: e.target.value })} style={dateStyle} />
              <small style={aide}>Laisse vide pour offrir Kromadex+ sans date de fin.</small>
            </label>
            <label style={champ}>Raison (note pour toi seulement)
              <textarea rows={2} maxLength={300} value={form.raison} onChange={(e) => setForm({ ...form, raison: e.target.value })}
                placeholder="ex. Gagnante du concours d’octobre, bêta-testrice…" />
            </label>
            <button type="submit" className="btn" style={{ minHeight: '48px', fontWeight: 700 }}>
              <Gift size={16} aria-hidden="true" /> {form.modification ? 'Enregistrer' : 'Offrir Kromadex+'}
            </button>
          </form>
        )}
        {message && <small>{message}</small>}
      </div>

      {/* Uniquement les membres à qui Kromadex+ est offert */}
      <div className="carte" style={colonne}>
        <b>Kromadex+ offert ({offerts.length})</b>
        {offerts.map((o) => (
          <div key={o.id} style={{ ...ligneCarte, opacity: o.expire ? 0.7 : 1 }}>
            <Pseudo x={o} />
            <small style={{ fontWeight: 600 }}>
              {o.expire ? `Terminé le ${jourLong(o.jusqu)}` : o.jusqu ? `Valable jusqu’au ${jourLong(o.jusqu)}` : 'Sans date de fin'}
              {o.depuis ? ` · offert le ${new Date(o.depuis).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
            </small>
            {o.raison && <small style={{ ...aide, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Raison : {o.raison}</small>}
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => setForm({ userId: o.id, nom: o, jusqu: o.expire ? '' : o.jusqu || '', raison: o.raison || '', modification: true })}>
                <Pencil size={14} aria-hidden="true" /> Modifier
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => retirer(o)}>
                <Trash2 size={14} aria-hidden="true" /> Retirer
              </button>
            </div>
          </div>
        ))}
        {!offerts.length && <p style={aide}>Tu n’as encore offert Kromadex+ à personne.</p>}
      </div>
    </div>
  );
}
