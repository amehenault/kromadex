'use client';
import { useEffect, useState } from 'react';
import { Send, Trash2, Check, X, Pin } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { jourQuebec, ajouterJours } from '@/lib/temps';
import Pseudo from '@/components/Pseudo';

const STATUT = { publiee: 'Publiée', en_attente: "En attente de l'admin", refusee: 'Refusée' };
const jourLong = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' });

// Écrire des missives : l'admin publie directement, la modo envoie à l'admin pour approbation
export default function Missives({ role }) {
  const [missives, setMissives] = useState([]);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [commentaires, setCommentaires] = useState(true);
  // Épinglage sur l'accueil jusqu'à une date d'échéance (incluse), une semaine par défaut
  const [epingler, setEpingler] = useState(false);
  const [echeance, setEcheance] = useState(() => ajouterJours(jourQuebec(), 7));
  const [message, setMessage] = useState('');
  const estAdmin = role === 'admin';

  async function charger() {
    const res = await fetch('/api/missives?gestion=1');
    if (res.ok) setMissives((await res.json()).missives || []);
  }
  useEffect(() => { charger(); }, []);

  async function publier(e) {
    e.preventDefault();
    const r = await envoyer('/api/missives', 'POST', { titre, contenu, commentaires, epingleeJusqu: epingler ? echeance : null });
    setMessage(r.ok ? (r.statut === 'publiee' ? 'Missive envoyée' : "Missive envoyée à l'admin pour approbation") : r.error);
    if (r.ok) { setTitre(''); setContenu(''); setEpingler(false); charger(); }
  }

  async function decider(m, statut) {
    await envoyer('/api/missives', 'PUT', { id: m.id, statut });
    charger();
  }

  async function changerEpingle(m, date) {
    await envoyer('/api/missives', 'PUT', { id: m.id, epingleeJusqu: date });
    charger();
  }

  async function supprimer(m) {
    if (!confirm(`Supprimer la missive « ${m.titre} » ?`)) return;
    await envoyer('/api/missives', 'DELETE', { id: m.id });
    charger();
  }

  const enAttente = missives.filter((m) => m.statut === 'en_attente');

  return (
    <div style={colonne}>
      <form onSubmit={publier} className="carte" style={colonne}>
        <b>Nouvelle missive</b>
        <p style={aide}>
          {estAdmin
            ? "Elle s'ajoute aux Missives, avec une pastille pour chaque membre tant qu'elle n'est pas lue. Épinglée, elle s'affiche aussi en entier sur l'accueil jusqu'à la date choisie."
            : "L'admin la relit et l'approuve avant qu'elle s'affiche sur l'accueil des membres."}
        </p>
        <label style={champ}>Titre
          <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} placeholder="ex. L'épreuve d'octobre est lancée !" />
        </label>
        <label style={champ}>Message
          <textarea rows={6} value={contenu} onChange={(e) => setContenu(e.target.value)} maxLength={4000} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={commentaires} onChange={(e) => setCommentaires(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0 }} />
          Autoriser les commentaires
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={epingler} onChange={(e) => setEpingler(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0 }} />
          Épingler sur l'accueil
        </label>
        {epingler && (
          <label style={champ}>Épinglée jusqu'au (inclus)
            <input type="date" value={echeance} min={jourQuebec()} onChange={(e) => setEcheance(e.target.value)} style={dateStyle} />
          </label>
        )}
        <button type="submit" className="btn" disabled={!titre.trim()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <Send size={16} /> {estAdmin ? 'Envoyer à tout le monde' : "Envoyer à l'admin"}
        </button>
        {message && <small>{message}</small>}
      </form>

      {estAdmin && enAttente.length > 0 && (
        <div className="carte" style={colonne}>
          <b>À approuver ({enAttente.length})</b>
          {enAttente.map((m) => (
            <div key={m.id} style={{ ...ligneCarte, border: '2px solid var(--btn)' }}>
              <small style={aide}>De <Pseudo x={{ pseudo: m.auteur, role: m.role_auteur }} repli="modo" /></small>
              <b>{m.titre}</b>
              {m.contenu && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.contenu}</p>}
              <div style={actions}>
                <button type="button" className="btn" style={petitBtn} onClick={() => decider(m, 'publiee')}><Check size={14} /> Approuver</button>
                <button type="button" className="btn alt danger" style={petitBtn} onClick={() => decider(m, 'refusee')}><X size={14} /> Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="carte" style={colonne}>
        <b>{estAdmin ? 'Toutes les missives' : 'Missives'}</b>
        {missives.filter((m) => !(estAdmin && m.statut === 'en_attente')).map((m) => (
          <div key={m.id} style={{ ...ligneCarte, opacity: m.statut === 'refusee' ? 0.6 : 1 }}>
            <small style={aide}>
              {new Date(m.cree_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
              {m.auteur && <> · <Pseudo x={{ pseudo: m.auteur, role: m.role_auteur }} /></>} · {STATUT[m.statut]}
            </small>
            <b>{m.titre}</b>
            {m.contenu && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.contenu}</p>}
            {m.epinglee_jusqu && m.epinglee_jusqu >= jourQuebec() && (
              <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <Pin size={14} aria-hidden="true" /> Épinglée jusqu'au {jourLong(m.epinglee_jusqu)}
              </small>
            )}
            {estAdmin && m.statut === 'publiee' && (
              <label style={champ}>Épinglée sur l'accueil jusqu'au
                <span style={{ display: 'flex', gap: '6px', minWidth: 0 }}>
                  <input type="date" value={m.epinglee_jusqu || ''} min={jourQuebec()} onChange={(e) => changerEpingle(m, e.target.value || null)}
                    style={{ ...dateStyle, flex: 1 }} />
                  {m.epinglee_jusqu && (
                    <button type="button" className="btn alt" style={petitBtn} onClick={() => changerEpingle(m, null)}>Désépingler</button>
                  )}
                </span>
              </label>
            )}
            {(estAdmin || m.statut !== 'publiee') && (
              <button type="button" className="btn alt danger" style={{ ...petitBtn, alignSelf: 'flex-start' }} onClick={() => supprimer(m)}>
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>
        ))}
        {!missives.length && <p style={aide}>Aucune missive pour le moment.</p>}
      </div>
    </div>
  );
}
