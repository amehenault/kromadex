'use client';
import { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide } from './outils';

export default function Titres() {
  const [titres, setTitres] = useState([]);
  const [nom, setNom] = useState('');
  const [condition, setCondition] = useState('');
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/roles');
    if (res.ok) setTitres((await res.json()).titles || []);
  }
  useEffect(() => { charger(); }, []);

  async function creer(e) {
    e.preventDefault();
    const r = await envoyer('/api/roles', 'POST', { name: nom, description: condition });
    setMessage(r.ok ? 'Titre enregistré' : r.error);
    if (r.ok) { setNom(''); setCondition(''); charger(); }
  }

  return (
    <div style={colonne}>
      <form onSubmit={creer} className="carte" style={colonne}>
        <b>Nouveau titre</b>
        <label style={champ}>Nom du titre
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. Maîtresse des nuances" maxLength={60} />
        </label>
        <label style={champ}>Condition pour l'obtenir
          <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="ex. Avoir colorié 50 pages" maxLength={200} />
        </label>
        <button type="submit" className="btn" disabled={!nom.trim()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <Plus size={16} /> Créer le titre
        </button>
        {message && <small>{message}</small>}
        <p style={aide}>Un titre qui existe déjà garde son nom et sa condition est mise à jour.</p>
      </form>

      <div className="carte" style={colonne}>
        <b>Titres existants ({titres.length})</b>
        {titres.map((t) => (
          <div key={t.id} style={ligneCarte}>
            <b style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> {t.name}</b>
            <small style={aide}>{t.description || 'Aucune condition définie'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
