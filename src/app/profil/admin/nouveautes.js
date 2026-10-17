'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { CATEGORIES_NOUVEAUTE } from '@/lib/nouveautes';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';

const vide = () => ({ id: null, categorie: 'nouvelles', titre: '', resume: '', contenu: '' });
const nomCategorie = (v) => CATEGORIES_NOUVEAUTE.find((c) => c.valeur === v)?.label || v;

// Écrire les articles de la page Nouveautés
export default function Nouveautes() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(vide);
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/nouveautes');
    if (res.ok) setArticles((await res.json()).articles || []);
  }
  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/nouveautes', 'POST', form);
    setMessage(r.ok ? 'Article publié' : r.error);
    if (r.ok) { setForm(vide()); charger(); }
  }

  async function supprimer(a) {
    if (!confirm(`Supprimer l'article « ${a.titre} » ?`)) return;
    await envoyer('/api/nouveautes', 'DELETE', { id: a.id });
    charger();
  }

  return (
    <div style={colonne}>
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? "Modifier l'article" : 'Nouvel article'}</b>
        <label style={champ}>Onglet
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES_NOUVEAUTE.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
          </select>
        </label>
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={140} placeholder="ex. Nouveaux livres Coco Wyo" />
        </label>
        <label style={champ}>Résumé (affiché dans la liste)
          <textarea rows={2} value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} maxLength={400} />
        </label>
        <label style={champ}>Texte complet
          <textarea rows={6} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} maxLength={8000} />
        </label>
        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.titre.trim()} style={{ flex: 1, minHeight: '44px' }}>{form.id ? 'Enregistrer' : 'Publier'}</button>
          {form.id && <button type="button" className="btn alt" onClick={() => setForm(vide())}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      <div className="carte" style={colonne}>
        <b>Articles publiés</b>
        {!articles.length && <p style={aide}>Aucun article pour le moment.</p>}
        {articles.map((a) => (
          <div key={a.id} style={ligneCarte}>
            <small style={aide}>{nomCategorie(a.categorie)} · {new Date(a.publie_le).toLocaleDateString('fr-CA')}</small>
            <b style={{ overflowWrap: 'anywhere' }}>{a.titre}</b>
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => { setForm({ id: a.id, categorie: a.categorie, titre: a.titre, resume: a.resume, contenu: a.contenu }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Modifier
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(a)}><Trash2 size={14} /> Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
