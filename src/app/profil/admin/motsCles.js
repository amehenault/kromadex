'use client';
import { useEffect, useState } from 'react';
import { Trash2, Pencil, Flag, Check, X } from 'lucide-react';
import { NOMS_POSTES, couleurPoste } from '@/lib/postes';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';

const RAISONS = { repetition: 'Répétition', faux: 'Faux', inapproprie: 'Inapproprié' };
const SANCTIONS = [[0, 'Avertir'], [7, 'Suspendre 7 jours'], [30, 'Suspendre 30 jours'], [36500, 'Bannir']];

// Mots-clés ajoutés par les membres : les plus signalés en premier.
// On peut modifier ou supprimer un mot-clé, et avertir, suspendre ou bannir la personne qui l'a créé.
export default function MotsCles() {
  const [mots, setMots] = useState([]);
  const [filtre, setFiltre] = useState('signales');
  const [edition, setEdition] = useState(null); // { id, mot }
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/mots-cles?gestion=1');
    if (r.ok) setMots((await r.json()).mots || []);
  }
  useEffect(() => { charger(); }, []);

  const visibles = mots.filter((m) => filtre === 'tous' || m.signalements > 0);

  async function enregistrer() {
    const r = await envoyer('/api/mots-cles', 'PUT', edition);
    setMessage(r.ok ? 'Mot-clé modifié' : r.error);
    if (r.ok) { setEdition(null); charger(); }
  }
  async function supprimer(m) {
    if (!confirm(`Supprimer le mot-clé « ${m.mot} » ?`)) return;
    await envoyer('/api/mots-cles', 'DELETE', { id: m.id });
    charger();
  }
  async function sanctionner(m, jours) {
    const libelle = SANCTIONS.find(([j]) => j === jours)[1].toLowerCase();
    if (!confirm(`Confirmer : ${libelle} @${m.pseudo || m.email} pour le mot-clé « ${m.mot} » ?`)) return;
    const r = await envoyer('/api/moderation', 'POST', { userId: m.auteur_id, motif: `Mot-clé inapproprié : « ${m.mot} » (${m.tome})`, jours });
    setMessage(r.ok ? 'Sanction envoyée' : r.error);
  }

  return (
    <div className="carte" style={colonne}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button type="button" className={filtre === 'signales' ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setFiltre('signales')}>
          <Flag size={16} aria-hidden="true" /> Signalés ({mots.filter((m) => m.signalements > 0).length})
        </button>
        <button type="button" className={filtre === 'tous' ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setFiltre('tous')}>
          Tous ({mots.length})
        </button>
      </div>
      {message && <small>{message}</small>}

      {visibles.map((m) => (
        <div key={m.id} style={{ ...ligneCarte, border: m.signalements ? '2px solid var(--danger)' : ligneCarte.border }}>
          {edition?.id === m.id ? (
            <label style={champ}>Mot-clé
              <input value={edition.mot} onChange={(e) => setEdition({ ...edition, mot: e.target.value })} maxLength={40} />
            </label>
          ) : (
            <b style={{ overflowWrap: 'anywhere' }}>{m.mot}</b>
          )}
          <small style={aide}>{m.tome}{m.page_no ? ` · page ${m.page_no}` : ''}</small>
          <small style={{ overflowWrap: 'anywhere' }}>
            Créé par {m.pseudo ? `@${m.pseudo}` : m.email || 'compte supprimé'}
            {m.role_auteur && <span style={{ color: couleurPoste(m.role_auteur), fontWeight: 700 }}> · {NOMS_POSTES[m.role_auteur]}</span>}
          </small>
          {m.signalements > 0 && (
            <small style={{ color: 'var(--danger)', fontWeight: 700 }}>
              {m.signalements} signalement{m.signalements > 1 ? 's' : ''} : {Object.entries(m.raisons || {}).map(([r, n]) => `${RAISONS[r]} (${n})`).join(', ')}
            </small>
          )}
          <div style={actions}>
            {edition?.id === m.id ? (
              <>
                <button type="button" className="btn" style={petitBtn} onClick={enregistrer}><Check size={14} aria-hidden="true" /> Enregistrer</button>
                <button type="button" className="btn alt" style={petitBtn} onClick={() => setEdition(null)}><X size={14} aria-hidden="true" /> Annuler</button>
              </>
            ) : (
              <button type="button" className="btn alt" style={petitBtn} onClick={() => setEdition({ id: m.id, mot: m.mot })}><Pencil size={14} aria-hidden="true" /> Modifier</button>
            )}
            <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(m)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
          </div>
          {m.auteur_id && !['admin', 'modo'].includes(m.role_auteur) && (
            <label style={champ}>Sanctionner la personne
              <select value="" onChange={(e) => e.target.value !== '' && sanctionner(m, Number(e.target.value))}>
                <option value="">Choisir une sanction</option>
                {SANCTIONS.map(([j, l]) => <option key={j} value={j}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
      ))}
      {!visibles.length && <p style={aide}>{filtre === 'signales' ? 'Aucun mot-clé signalé.' : 'Aucun mot-clé pour le moment.'}</p>}
    </div>
  );
}
