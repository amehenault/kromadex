'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';
import Pseudo from '@/components/Pseudo';

const DUREES = [
  { jours: 0, label: 'Avertissement seulement' },
  { jours: 1, label: 'Suspendre 1 jour' },
  { jours: 3, label: 'Suspendre 3 jours' },
  { jours: 7, label: 'Suspendre 7 jours' },
  { jours: 30, label: 'Suspendre 30 jours' },
  { jours: 36500, label: 'Bannir définitivement' },
];
const date = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

// Avertissements et suspensions temporaires (admin et modo)
export default function Moderation({ role, monId }) {
  const [membres, setMembres] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [cible, setCible] = useState(null);
  const [motif, setMotif] = useState('');
  const [jours, setJours] = useState(0);
  const [message, setMessage] = useState('');

  async function charger() {
    const res = await fetch('/api/moderation');
    if (!res.ok) return;
    const d = await res.json();
    setMembres(d.membres || []);
    setHistorique(d.avertissements || []);
  }
  useEffect(() => { charger(); }, []);

  // Membres qu'on a le droit d'avertir
  const possibles = useMemo(() => membres.filter((u) =>
    String(u.id) !== String(monId) && u.role !== 'admin' && !(role === 'modo' && u.role === 'modo')), [membres, role, monId]);
  const trouves = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    if (!q) return [];
    return possibles.filter((u) => [u.email, u.pseudo, u.name].some((x) => (x || '').toLowerCase().includes(q))).slice(0, 8);
  }, [possibles, recherche]);
  const suspendus = possibles.filter((u) => u.suspendu_jusqu && new Date(u.suspendu_jusqu) > new Date());

  async function avertir(e) {
    e.preventDefault();
    const libelle = DUREES.find((d) => d.jours === jours).label.toLowerCase();
    if (!confirm(`Confirmer : ${libelle} pour ${nom(cible)} ?`)) return;
    const r = await envoyer('/api/moderation', 'POST', { userId: cible.id, motif, jours });
    setMessage(r.ok ? 'Avertissement envoyé' : r.error);
    if (r.ok) { setCible(null); setMotif(''); setJours(0); setRecherche(''); charger(); }
  }

  async function lever(u) {
    if (!confirm(`Lever la suspension de ${nom(u)} ?`)) return;
    const r = await envoyer('/api/moderation', 'POST', { userId: u.id, lever: true });
    setMessage(r.ok ? 'Suspension levée' : r.error);
    charger();
  }

  const nom = (u) => (u.pseudo ? `@${u.pseudo}` : u.name || u.email);

  return (
    <div style={colonne}>
      <form onSubmit={avertir} className="carte" style={colonne}>
        <b>Donner un avertissement</b>
        <p style={aide}>
          L'avertissement et son motif s'affichent sur l'accueil du membre. Pendant une suspension, la connexion est bloquée.
        </p>
        {cible ? (
          <div style={{ ...ligneCarte, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pseudo x={cible} />
            <button type="button" className="btn alt" style={petitBtn} onClick={() => setCible(null)}>Changer</button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
              <input placeholder="Chercher un membre" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ width: '100%', paddingLeft: '36px' }} />
            </div>
            {trouves.map((u) => (
              <button key={u.id} type="button" className="btn alt" onClick={() => setCible(u)}
                style={{ justifyContent: 'flex-start', minHeight: '44px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Pseudo x={u} />
                {u.nb_avertissements > 0 && <small>{u.nb_avertissements} avertissement{u.nb_avertissements > 1 ? 's' : ''}</small>}
              </button>
            ))}
          </>
        )}
        <label style={champ}>Motif
          <textarea rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={500} placeholder="ex. Propos irrespectueux dans les commentaires" />
        </label>
        <label style={champ}>Sanction
          <select value={jours} onChange={(e) => setJours(Number(e.target.value))}>
            {DUREES.map((d) => <option key={d.jours} value={d.jours}>{d.label}</option>)}
          </select>
        </label>
        <button type="submit" className="btn danger" disabled={!cible || motif.trim().length < 3}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <AlertTriangle size={16} /> Envoyer
        </button>
        {message && <small>{message}</small>}
      </form>

      {suspendus.length > 0 && (
        <div className="carte" style={colonne}>
          <b>Suspensions en cours</b>
          {suspendus.map((u) => (
            <div key={u.id} style={ligneCarte}>
              <Pseudo x={u} />
              <small style={aide}>Jusqu'au {date(u.suspendu_jusqu)}</small>
              <div style={actions}>
                <button type="button" className="btn alt" style={petitBtn} onClick={() => lever(u)}>Lever la suspension</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="carte" style={colonne}>
        <b>Historique</b>
        {historique.map((a) => (
          <div key={a.id} style={ligneCarte}>
            <small style={aide}>{date(a.cree_le)}{a.par && <> · par <Pseudo x={{ pseudo: a.par, role: a.role_par }} /></>}</small>
            <Pseudo x={a} />
            <small>{a.suspension_jours >= 36500 ? 'Bannissement' : a.suspension_jours ? `Suspension de ${a.suspension_jours} jour${a.suspension_jours > 1 ? 's' : ''}` : 'Avertissement'}</small>
            <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.motif}</p>
          </div>
        ))}
        {!historique.length && <p style={aide}>Aucun avertissement pour le moment.</p>}
      </div>
    </div>
  );
}
