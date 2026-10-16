'use client';
import { useEffect, useState } from 'react';
import { TYPES_DEMANDE, STATUTS_DEMANDE, nomType } from '@/lib/demandes';
import { envoyer, colonne, ligneCarte, champ, aide } from './outils';

// Demandes envoyées depuis la page Aide : répondre et changer le statut
export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [filtre, setFiltre] = useState('ouvertes');
  const [edition, setEdition] = useState({});
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/demandes?tout=1');
    if (res.ok) setDemandes((await res.json()).demandes || []);
  }
  useEffect(() => { charger(); }, []);

  const visibles = demandes.filter((d) =>
    filtre === 'toutes' ? true : filtre === 'ouvertes' ? ['nouvelle', 'en_cours'].includes(d.statut) : d.type === filtre);

  async function enregistrer(d) {
    const e = edition[d.id] || {};
    const r = await envoyer('/api/demandes', 'PUT', { id: d.id, statut: e.statut ?? d.statut, reponse: e.reponse ?? d.reponse });
    setMessage(r.ok ? 'Réponse enregistrée ✓' : r.error);
    if (r.ok) { setEdition((x) => ({ ...x, [d.id]: undefined })); charger(); }
  }

  const modifier = (id, cle, v) => setEdition((x) => ({ ...x, [id]: { ...(x[id] || {}), [cle]: v } }));

  return (
    <div className="carte" style={colonne}>
      <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
        <option value="ouvertes">À traiter</option>
        <option value="toutes">Toutes</option>
        {TYPES_DEMANDE.map((t) => <option key={t.valeur} value={t.valeur}>{t.court}</option>)}
      </select>
      {message && <small>{message}</small>}

      {visibles.map((d) => {
        const e = edition[d.id] || {};
        return (
          <div key={d.id} style={{ ...ligneCarte, border: d.statut === 'nouvelle' ? '2px solid var(--btn)' : ligneCarte.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <small style={{ fontWeight: 700 }}>{nomType(d.type)}</small>
              <small style={aide}>{new Date(d.cree_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</small>
            </div>
            <small style={{ ...aide, overflowWrap: 'anywhere' }}>{d.pseudo ? `@${d.pseudo}` : d.email}</small>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{d.message}</p>
            <label style={champ}>Statut
              <select value={e.statut ?? d.statut} onChange={(ev) => modifier(d.id, 'statut', ev.target.value)}>
                {STATUTS_DEMANDE.map((s) => <option key={s.valeur} value={s.valeur}>{s.label}</option>)}
              </select>
            </label>
            <label style={champ}>Réponse
              <textarea rows={3} value={e.reponse ?? d.reponse} onChange={(ev) => modifier(d.id, 'reponse', ev.target.value)} maxLength={2000} />
            </label>
            <button type="button" className="btn" disabled={!edition[d.id]} onClick={() => enregistrer(d)} style={{ minHeight: '42px' }}>
              Enregistrer
            </button>
          </div>
        );
      })}
      {!visibles.length && <p style={aide}>Aucune demande ici.</p>}
    </div>
  );
}
