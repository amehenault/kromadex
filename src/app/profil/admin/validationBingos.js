'use client';
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { envoyer, colonne, ligneCarte, aide, actions, petitBtn } from './outils';
import Pseudo from '@/components/Pseudo';

const image = (c) => `/api/pages/${c.page_id}/image?s=${c.img_size || 0}`;

export default function ValidationBingos() {
  const [cases, setCases] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/bingos/validation');
    if (r.ok) setCases((await r.json()).cases || []);
  }
  useEffect(() => { charger(); }, []);

  async function decider(c, valide) {
    const r = await envoyer('/api/bingos/validation', 'PUT', { bingoId: c.bingo_id, userId: c.user_id, case: c.case_no, valide });
    setMessage(r.ok ? (valide ? 'Case validée' : 'Case refusée') : r.error);
    if (r.ok) {
      setCases((l) => l.filter((x) => !(x.bingo_id === c.bingo_id && x.user_id === c.user_id && x.case_no === c.case_no)));
      window.dispatchEvent(new Event('kromadex-lu'));
    }
  }

  if (!cases) return <p>Chargement…</p>;
  return (
    <div className="carte" style={colonne}>
      <b>Cases de bingo à valider ({cases.length})</b>
      <p style={aide}>Valide une case si le coloriage respecte sa condition. Les XP de chaque personne sont versés le dernier jour du mois (ou tout de suite si le bingo est déjà terminé).</p>
      {message && <small>{message}</small>}
      {!cases.length && <p style={aide}>Aucune case en attente.</p>}
      {cases.map((c) => (
        <div key={`${c.bingo_id}-${c.user_id}-${c.case_no}`} style={ligneCarte}>
          <small style={aide}>{c.bingo} · case {c.case_no + 1} · <Pseudo x={c} /></small>
          <b style={{ overflowWrap: 'anywhere' }}>{c.tache}</b>
          {c.condition && <small style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.condition}</small>}
          <img src={image(c)} alt={c.title || ''} loading="lazy" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: 'var(--rayon-s)', background: 'var(--carte)' }} />
          <div style={actions}>
            <button type="button" className="btn" style={petitBtn} onClick={() => decider(c, true)}><Check size={16} aria-hidden="true" /> Valider</button>
            <button type="button" className="btn alt danger" style={petitBtn} onClick={() => decider(c, false)}><X size={16} aria-hidden="true" /> Refuser</button>
          </div>
        </div>
      ))}
    </div>
  );
}
