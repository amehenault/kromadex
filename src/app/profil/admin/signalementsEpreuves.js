'use client';
import { useEffect, useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { nomPoste, couleurPoste } from '@/lib/postes';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';
import Pseudo from '@/components/Pseudo';

const image = (s) => `/api/pages/${s.page_id}/image?s=${s.img_size || 0}`;
const SANCTIONS = [[0, 'Avertir'], [7, 'Suspendre 7 jours'], [30, 'Suspendre 30 jours'], [36500, 'Bannir']];

// Coloriages d'épreuve signalés : on retire le coloriage (la personne perd le double des points gagnés avec),
// on ignore le signalement, et on peut aussi sanctionner la personne.
export default function SignalementsEpreuves() {
  const [liste, setListe] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/defis/signalements');
    if (r.ok) setListe((await r.json()).signalements || []);
  }
  useEffect(() => { charger(); }, []);

  async function traiter(s, action) {
    if (action === 'retirer' && !confirm('Retirer ce coloriage de l’épreuve ? La personne perdra le double des points gagnés avec.')) return;
    const r = await envoyer('/api/defis/signalements', 'PUT', { defiId: s.defi_id, pageId: s.page_id, action });
    setMessage(r.ok ? (action === 'retirer' ? 'Coloriage retiré, points repris en double' : 'Signalement ignoré') : r.error);
    if (r.ok) { charger(); window.dispatchEvent(new Event('kromadex-lu')); }
  }
  async function sanctionner(s, jours) {
    const libelle = SANCTIONS.find(([j]) => j === jours)[1].toLowerCase();
    if (!confirm(`Confirmer : ${libelle} ${s.pseudo ? `@${s.pseudo}` : s.name || 'ce membre'} ?`)) return;
    const r = await envoyer('/api/moderation', 'POST', { userId: s.auteur_id, motif: `Coloriage qui ne correspond pas à l’épreuve « ${s.epreuve} »`, jours });
    setMessage(r.ok ? 'Sanction envoyée' : r.error);
  }

  if (!liste) return <p>Chargement…</p>;
  return (
    <div className="carte" style={colonne}>
      <b>Coloriages d’épreuve signalés ({liste.length})</b>
      <p style={aide}>Un membre trouve que ce coloriage ne correspond pas à ce que l’épreuve demande.</p>
      {message && <small>{message}</small>}
      {!liste.length && <p style={aide}>Aucun signalement à traiter.</p>}
      {liste.map((s) => (
        <div key={`${s.defi_id}-${s.page_id}`} style={{ ...ligneCarte, border: '2px solid var(--danger)' }}>
          <small style={{ color: 'var(--danger)', fontWeight: 700 }}>{s.nombre} signalement{s.nombre > 1 ? 's' : ''}</small>
          <b style={{ overflowWrap: 'anywhere' }}>{s.epreuve}</b>
          {s.description && <small style={{ ...aide, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{s.description}</small>}
          <img src={image(s)} alt={s.title || ''} loading="lazy" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: 'var(--rayon-s)', background: 'var(--carte)' }} />
          <small style={{ overflowWrap: 'anywhere' }}>
            Par <Pseudo x={s} role={s.role_auteur} />
            {s.role_auteur && <span style={{ color: couleurPoste(s.role_auteur), fontWeight: 700 }}> · {nomPoste(s.role_auteur, s.genre_auteur)}</span>}
          </small>
          <div style={actions}>
            <button type="button" className="btn alt danger" style={petitBtn} onClick={() => traiter(s, 'retirer')}><Trash2 size={14} aria-hidden="true" /> Retirer le coloriage</button>
            <button type="button" className="btn alt" style={petitBtn} onClick={() => traiter(s, 'ignorer')}><Check size={14} aria-hidden="true" /> Il correspond</button>
          </div>
          {!['admin', 'modo'].includes(s.role_auteur) && (
            <label style={champ}>Sanctionner la personne
              <select value="" onChange={(e) => e.target.value !== '' && sanctionner(s, Number(e.target.value))}>
                <option value="">Choisir une sanction</option>
                {SANCTIONS.map(([j, l]) => <option key={j} value={j}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
