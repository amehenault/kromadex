'use client';
import { useEffect, useState } from 'react';
import { Trash2, CalendarClock } from 'lucide-react';
import { NB_CASES, CATEGORIES_BINGO, nomCategorieBingo } from '@/lib/bingos';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';

const vide = () => ({
  id: null, titre: '', categorie: 'les_deux', debut: '', fin: '',
  cases: Array(NB_CASES).fill(''), conditions: Array(NB_CASES).fill(''),
});
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

// Créer et programmer les bingos : grille de 3 x 3, une tâche courte et sa condition par case
export default function Bingos() {
  const [bingos, setBingos] = useState([]);
  const [form, setForm] = useState(vide);
  const [caseActive, setCaseActive] = useState(0);
  const [message, setMessage] = useState('');
  // Brouillon automatique dès qu'on commence à remplir le bingo
  const brouillon = useBrouillon('bingo', form, Boolean(form.titre.trim() || form.cases.some((c) => c.trim()) || form.conditions.some((c) => c.trim())));

  async function charger() {
    const res = await fetch('/api/bingos?gestion=1');
    if (res.ok) setBingos((await res.json()).bingos || []);
  }
  useEffect(() => { charger(); }, []);

  const remplies = form.cases.filter((c) => c.trim()).length;
  const changer = (cle, i, v) => setForm({ ...form, [cle]: form[cle].map((x, j) => (j === i ? v : x)) });

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/bingos', 'POST', form);
    setMessage(r.ok ? 'Bingo enregistré' : r.error);
    if (r.ok) { setForm(vide()); setCaseActive(0); brouillon.effacer(); charger(); }
  }

  async function supprimer(b) {
    if (!confirm(`Supprimer le bingo « ${b.titre} » ?`)) return;
    await envoyer('/api/bingos', 'DELETE', { id: b.id });
    charger();
  }

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="de bingo" brouillon={brouillon} onReprendre={(d) => d && setForm({ ...vide(), ...d })} />
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? 'Modifier le bingo' : 'Nouveau bingo'}</b>
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Bingo d'automne" maxLength={100} />
        </label>
        <label style={champ}>Pour qui
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES_BINGO.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début
            <input type="date" value={form.debut || ''} onChange={(e) => setForm({ ...form, debut: e.target.value })} style={dateStyle} />
          </label>
          <label style={champ}>Fin (facultatif)
            <input type="date" value={form.fin || ''} min={form.debut || undefined} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={dateStyle} />
          </label>
        </div>
        <p style={aide}>
          Deux bingos par mois au maximum. Avec une date de début à venir, le bingo est programmé : il apparaît aux membres ce jour-là. Sans date de fin, il se termine la veille du dernier jour du mois : les cases validées rapportent leurs XP le dernier jour.
        </p>

        <small style={aide}>Touche une case pour écrire sa tâche et sa condition ({remplies} / {NB_CASES}).</small>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {form.cases.map((c, i) => (
            <button key={i} type="button" onClick={() => setCaseActive(i)}
              style={{
                aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', fontSize: '0.8rem', lineHeight: 1.2, padding: '4px',
                overflow: 'hidden', cursor: 'pointer', wordBreak: 'break-word', fontWeight: 600,
                border: caseActive === i ? '3px solid var(--btn)' : '1px solid var(--bordure-carte)',
                background: c.trim() ? 'var(--accent-doux)' : 'var(--fond-carte)', color: 'var(--texte-principal)',
              }}>
              {c || i + 1}
            </button>
          ))}
        </div>
        <label style={champ}>Case {caseActive + 1} : tâche (affichée dans la case)
          <input value={form.cases[caseActive]} maxLength={60} onChange={(e) => changer('cases', caseActive, e.target.value)} placeholder="ex. Tons pastel" />
        </label>
        <label style={champ}>Condition (affichée quand on touche la case)
          <textarea rows={3} value={form.conditions[caseActive]} maxLength={300} onChange={(e) => changer('conditions', caseActive, e.target.value)}
            placeholder="ex. Colorie une page entière avec au moins 5 couleurs pastel" />
        </label>

        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.titre.trim() || remplies < NB_CASES || !form.debut} style={{ flex: 1, minHeight: '44px' }}>
            Enregistrer le bingo
          </button>
          {form.id && <button type="button" className="btn alt" onClick={() => { setForm(vide()); setCaseActive(0); }}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      <div className="carte" style={colonne}>
        <b>Bingos créés</b>
        {bingos.map((b) => (
          <div key={b.id} style={ligneCarte}>
            <b>{b.titre}</b>
            <small style={aide}>{nomCategorieBingo(b.categorie)}</small>
            <small style={{ ...aide, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {b.programme && <CalendarClock size={14} aria-hidden="true" />}
              {b.programme ? 'Programmé : ' : ''}{b.debut ? jour(b.debut) : '?'}{b.fin ? ` au ${jour(b.fin)}` : ' jusqu’à la veille du dernier jour du mois'}
            </small>
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => {
                  setForm({
                    id: b.id, titre: b.titre, categorie: b.categorie, debut: b.debut || '', fin: b.fin || '',
                    cases: Array.from({ length: NB_CASES }, (_, i) => b.cases[i] || ''),
                    conditions: Array.from({ length: NB_CASES }, (_, i) => (b.conditions || [])[i] || ''),
                  });
                  setCaseActive(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                Modifier
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(b)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
            </div>
          </div>
        ))}
        {!bingos.length && <p style={aide}>Aucun bingo pour le moment.</p>}
      </div>
    </div>
  );
}
