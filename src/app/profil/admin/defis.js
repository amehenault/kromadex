'use client';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';

const nomMois = (m) => new Date(`${m}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

// Défis mensuels : l'admin gère tous les mois, la modo crée le défi d'un mois en cours ou à venir,
// la cheffe choisit celui du mois prochain
export default function Defis({ role }) {
  const [donnees, setDonnees] = useState({ defis: [], moisActuel: '', moisProchain: '' });
  const [form, setForm] = useState({ mois: '', titre: '', description: '' });
  const [message, setMessage] = useState('');
  const estAdmin = role === 'admin';
  const choisitMois = estAdmin || role === 'modo';

  async function charger() {
    const res = await fetch('/api/defis');
    if (!res.ok) return;
    const d = await res.json();
    setDonnees(d);
    // Formulaire prérempli avec le défi du mois prochain s'il existe
    const prochain = d.defis.find((x) => x.mois === d.moisProchain);
    setForm((f) => (f.mois ? f : { mois: d.moisProchain, titre: prochain?.titre || '', description: prochain?.description || '' }));
  }
  useEffect(() => { charger(); }, []);

  function choisirMois(mois) {
    const existant = donnees.defis.find((x) => x.mois === mois);
    setForm({ mois, titre: existant?.titre || '', description: existant?.description || '' });
  }

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/defis', 'POST', form);
    setMessage(r.ok ? 'Défi enregistré ✓' : r.error);
    if (r.ok) charger();
  }

  async function supprimer(d) {
    if (!confirm(`Supprimer le défi « ${d.titre} » ?`)) return;
    await envoyer('/api/defis', 'DELETE', { id: d.id });
    charger();
  }

  const actuel = donnees.defis.find((x) => x.mois === donnees.moisActuel);

  return (
    <div style={colonne}>
      <div className="carte" style={colonne}>
        <small style={{ ...aide, textTransform: 'uppercase', fontWeight: 700 }}>Défi en cours</small>
        {actuel ? (
          <>
            <b style={{ fontSize: '1.1rem' }}>{actuel.titre}</b>
            {actuel.description && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{actuel.description}</p>}
            <small style={aide}>{nomMois(actuel.mois)}{actuel.choisi_par ? ` · choisi par @${actuel.choisi_par}` : ''}</small>
          </>
        ) : <p style={aide}>Aucun défi pour ce mois-ci.</p>}
      </div>

      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{choisitMois ? 'Créer ou modifier un défi' : `Choisis le défi de ${donnees.moisProchain ? nomMois(donnees.moisProchain) : 'du mois prochain'}`}</b>
        {choisitMois && (
          <label style={champ}>Mois
            <input type="month" min={estAdmin ? undefined : donnees.moisActuel.slice(0, 7)} value={form.mois.slice(0, 7)} onChange={(e) => choisirMois(`${e.target.value}-01`)} />
          </label>
        )}
        <label style={champ}>Thème du défi
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Que des tons pastel" maxLength={100} />
        </label>
        <label style={champ}>Règles et détails
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
        </label>
        <button type="submit" className="btn" disabled={!form.titre.trim() || !form.mois} style={{ minHeight: '44px' }}>Enregistrer le défi</button>
        {message && <small>{message}</small>}
      </form>

      {estAdmin && donnees.defis.length > 0 && (
        <div className="carte" style={colonne}>
          <b>Tous les défis</b>
          {donnees.defis.map((d) => (
            <div key={d.id} style={ligneCarte}>
              <small style={{ ...aide, textTransform: 'capitalize' }}>{nomMois(d.mois)}</small>
              <b>{d.titre}</b>
              <div style={actions}>
                <button type="button" className="btn alt" style={petitBtn} onClick={() => choisirMois(d.mois)}>Modifier</button>
                <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(d)}><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
