'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import Feuille from './Feuille';
import TexteErreur from './TexteErreur';
import { RAISONS_SIGNALEMENT } from '@/lib/signalements';

// Drapeau « Signaler » : un contenu qui contrevient aux règles d'utilisation (coloriage, commentaire, profil).
// Le signalement arrive dans l'Espace de l'Invocatrice et des Sentinelles (Contenu signalé).
export default function BoutonSignaler({ genre, cible, petit = false }) {
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState('');
  const [details, setDetails] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    setEnvoi(true); setErreur('');
    const r = await fetch('/api/signalements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ genre, cible, raison, details }),
    });
    setEnvoi(false);
    if (r.ok) setEnvoye(true);
    else setErreur((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.');
  }

  function fermer() { setOuvert(false); setEnvoye(false); setRaison(''); setDetails(''); setErreur(''); }

  return (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOuvert(true); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'var(--texte-secondaire)', fontWeight: 700, fontSize: petit ? '0.8rem' : '0.85rem', minHeight: '44px', padding: petit ? 0 : '0 6px',
        }}>
        <Flag size={petit ? 14 : 16} aria-hidden="true" /> Signaler
      </button>
      {ouvert && (
        <Feuille titre="Signaler" onFermer={fermer}>
          {envoye ? (
            <>
              <p style={{ margin: 0 }}>Merci ! Ton signalement a été envoyé à l’équipe de modération. Il reste anonyme pour la personne concernée.</p>
              <button type="button" className="btn" onClick={fermer} style={{ minHeight: '44px' }}>Fermer</button>
            </>
          ) : (
            <form onSubmit={envoyer} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <small style={{ color: 'var(--texte-secondaire)' }}>Pourquoi ce contenu contrevient-il aux règles d’utilisation ?</small>
              {RAISONS_SIGNALEMENT.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={raison === r} onClick={() => setRaison(r)}
                  className={raison === r ? 'btn' : 'btn alt'} style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: '44px', fontSize: '0.9rem' }}>
                  {r}
                </button>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
                Précisions {raison === 'Autre' ? '(obligatoire)' : '(facultatif)'}
                <textarea rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} style={{ resize: 'vertical', font: 'inherit' }} />
              </label>
              {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
              <button type="submit" className="btn" disabled={!raison || envoi || (raison === 'Autre' && details.trim().length < 3)} style={{ minHeight: '44px', fontWeight: 700 }}>
                {envoi ? 'Envoi…' : 'Envoyer le signalement'}
              </button>
            </form>
          )}
        </Feuille>
      )}
    </>
  );
}
