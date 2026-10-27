'use client';
import { useEffect, useState } from 'react';
import { Archive, Inbox } from 'lucide-react';
import { GROUPES_DEMANDE, groupeDuType, nomType, nomStatut, estArchivee } from '@/lib/demandes';
import { envoyer, colonne, ligneCarte, champ, aide } from './outils';
import Pseudo from '@/components/Pseudo';
import Deroulant from '@/components/Deroulant';

export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [groupe, setGroupe] = useState('questions');
  const [archives, setArchives] = useState(false);
  const [edition, setEdition] = useState({});
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/demandes?tout=1');
    if (res.ok) setDemandes((await res.json()).demandes || []);
  }
  useEffect(() => { charger(); }, []);

  const duGroupe = (cle) => demandes.filter((d) => groupeDuType(d.type).cle === cle);
  const visibles = duGroupe(groupe).filter((d) => estArchivee(d.statut) === archives);

  async function enregistrer(d) {
    const e = edition[d.id] || {};
    const r = await envoyer('/api/demandes', 'PUT', { id: d.id, statut: e.statut ?? d.statut, reponse: e.reponse ?? d.reponse });
    setMessage(r.ok ? 'Réponse enregistrée' : r.error);
    if (r.ok) { setEdition((x) => ({ ...x, [d.id]: undefined })); charger(); }
  }

  const modifier = (id, cle, v) => setEdition((x) => ({ ...x, [id]: { ...(x[id] || {}), [cle]: v } }));
  const bouton = { minHeight: '44px', minWidth: 0, padding: '6px 8px', fontSize: '0.82rem', lineHeight: 1.2 };

  return (
    <div className="carte" style={colonne}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
        {GROUPES_DEMANDE.map((g, i) => {
          const aTraiter = duGroupe(g.cle).filter((d) => !estArchivee(d.statut)).length;
          return (
            <button key={g.cle} type="button" className={groupe === g.cle ? 'btn' : 'btn alt'} onClick={() => setGroupe(g.cle)}
              style={{ ...bouton, overflowWrap: 'normal', gridColumn: i === GROUPES_DEMANDE.length - 1 && i % 2 === 0 ? '1 / -1' : undefined }}>
              {g.label}{aTraiter ? ` (${aTraiter})` : ''}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button type="button" className={!archives ? 'btn' : 'btn alt'} style={bouton} onClick={() => setArchives(false)}>
          <Inbox size={16} aria-hidden="true" /> À traiter
        </button>
        <button type="button" className={archives ? 'btn' : 'btn alt'} style={bouton} onClick={() => setArchives(true)}>
          <Archive size={16} aria-hidden="true" /> Archivées
        </button>
      </div>
      {archives && <small style={aide}>Les demandes archivées sont supprimées automatiquement 30 jours après leur archivage.</small>}
      {message && <small>{message}</small>}

      {visibles.map((d) => {
        const e = edition[d.id] || {};
        const statuts = groupeDuType(d.type).statuts;
        return (
          <div key={d.id} style={{ ...ligneCarte, border: d.statut === 'nouvelle' ? '2px solid var(--btn)' : ligneCarte.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <small style={{ fontWeight: 700 }}>{nomType(d.type)} · {nomStatut(d.statut)}</small>
              <small style={aide}>{new Date(d.cree_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</small>
            </div>
            <small><Pseudo x={d} /></small>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{d.message}</p>
            <label style={champ}>Statut
              <Deroulant titre="Statut" value={e.statut ?? d.statut} onChange={(v) => modifier(d.id, 'statut', v)}
                options={statuts.map((s) => ({ valeur: s, label: nomStatut(s) }))} />
            </label>
            <label style={champ}>Réponse
              <textarea rows={3} value={e.reponse ?? d.reponse} onChange={(ev) => modifier(d.id, 'reponse', ev.target.value)} maxLength={2000} />
            </label>
            <button type="button" className="btn" disabled={!edition[d.id]} onClick={() => enregistrer(d)} style={{ minHeight: '44px' }}>
              Enregistrer
            </button>
          </div>
        );
      })}
      {!visibles.length && <p style={aide}>{archives ? 'Aucune demande archivée ici.' : 'Rien à traiter ici.'}</p>}
    </div>
  );
}
