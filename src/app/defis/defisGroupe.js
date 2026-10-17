'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CATEGORIES_DEFI } from '@/lib/defis';
import CarteDefi from './carteDefi';
import TexteErreur from '@/components/TexteErreur';

const dansJours = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const vide = () => ({ id: null, titre: '', description: '', categorie: 'tous', debut: dansJours(0), fin: dansJours(30), objectif: '', multiple: false });

// Défis de groupe : créés par les membres, chacun peut s'y joindre
export default function DefisGroupe({ defis, monId, onChange }) {
  const [form, setForm] = useState(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function enregistrer(e) {
    e.preventDefault();
    setOccupe(true); setErreur('');
    const r = await fetch('/api/defis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, genre: 'groupe' }) });
    setOccupe(false);
    if (r.ok) { setForm(null); onChange(); } else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }

  const champ = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600, minWidth: 0 };
  const date = { width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 6px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {!form ? (
        <button type="button" className="btn" onClick={() => setForm(vide())}
          style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
          <Plus size={18} /> Créer une épreuve de groupe
        </button>
      ) : (
        <form onSubmit={enregistrer} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <b>{form.id ? 'Modifier mon épreuve de groupe' : 'Nouvelle épreuve de groupe'}</b>
          <label style={champ}>Thème
            <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={100} placeholder="ex. Un tome Disney en entier" />
          </label>
          <label style={champ}>Catégorie
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              {CATEGORIES_DEFI.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
            </select>
          </label>
          <label style={champ}>Règles et détails
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
          </label>
          <label style={champ}>Objectif : nombre de coloriages en tout
            <input type="number" inputMode="numeric" min={1} max={10000} value={form.objectif} onChange={(e) => setForm({ ...form, objectif: e.target.value })} placeholder="ex. 50 pour un tome de 50 pages" />
            <small style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>L’épreuve est réussie à 100 % quand le groupe atteint ce nombre : 150 XP chacun. Sinon, 10 XP de participation.</small>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', minHeight: '44px' }}>
            <input type="checkbox" checked={form.multiple} onChange={(e) => setForm({ ...form, multiple: e.target.checked })} style={{ width: '22px', height: '22px', flex: '0 0 auto' }} />
            <span>Plusieurs coloriages par personne (pour remplir un tome ou un live au complet) : 5 XP par coloriage supplémentaire</span>
          </label>
          <label style={champ}>Fin de l'épreuve
            <input type="date" value={form.fin} min={dansJours(0)} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={date} />
          </label>
          <small style={{ color: 'var(--texte-secondaire)' }}>
            L'épreuve commence aujourd'hui. Tu peux créer 1 épreuve de groupe par mois (jusqu’à 5 avec Kromadex+). Créer l’épreuve ne donne pas d’XP.
          </small>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn" disabled={occupe || !form.titre.trim() || !(Number(form.objectif) >= 1)} style={{ flex: 1, minHeight: '44px' }}>{form.id ? 'Enregistrer' : 'Créer l’épreuve'}</button>
            <button type="button" className="btn alt" onClick={() => setForm(null)}>Annuler</button>
          </div>
          {erreur && <small style={{ color: 'var(--danger)' }}><TexteErreur texte={erreur} /></small>}
        </form>
      )}

      {!defis.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucune épreuve de groupe en cours. Lance la première !</p>}
      {defis.map((d) => (
        <CarteDefi key={d.id} defi={d} monId={monId} onChange={onChange}
          onModifier={(x) => { setForm({ id: x.id, titre: x.titre, description: x.description, categorie: x.categorie, debut: x.debut, fin: x.fin, objectif: x.objectif || '', multiple: !!x.multiple }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      ))}
    </div>
  );
}
