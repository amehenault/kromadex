'use client';
import { useState } from 'react';
import { Plus, Tags, X, Flag, Trash2 } from 'lucide-react';

const RAISONS = [['repetition', 'Répétition'], ['faux', 'Faux'], ['inapproprie', 'Inapproprié']];

// Mots-clés d'un tome : ajout réservé aux personnes qui possèdent le tome, signalement possible
export default function MotsCles({ tomeId, possede }) {
  const [feuille, setFeuille] = useState(null); // 'ajouter' | 'voir'
  const [mots, setMots] = useState([]);
  const [mot, setMot] = useState('');
  const [page, setPage] = useState('');
  const [message, setMessage] = useState('');
  const [signalement, setSignalement] = useState(null); // id du mot-clé à signaler

  async function charger() {
    const r = await fetch(`/api/mots-cles?tome=${tomeId}`);
    if (r.ok) setMots((await r.json()).mots || []);
  }
  function ouvrir(f) { setFeuille(f); setMessage(''); if (f === 'voir') charger(); }

  async function ajouter(e) {
    e.preventDefault();
    const r = await fetch('/api/mots-cles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId, mot, pageNo: page }) });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? `Mot-clé « ${mot.trim()} » ajouté` : d.error || 'Erreur');
    if (r.ok) { setMot(''); setPage(''); }
  }

  async function signaler(id, raison) {
    await fetch('/api/mots-cles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signaler: id, raison }) });
    setSignalement(null);
    setMessage('Merci, le signalement a été envoyé.');
    charger();
  }

  async function retirer(m) {
    if (!confirm(`Retirer le mot-clé « ${m.mot} » ?`)) return;
    await fetch('/api/mots-cles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
    charger();
  }

  const bouton = { minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 10px' };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginTop: '10px' }}>
        {possede && (
          <button type="button" className="btn btn-corail" style={bouton} onClick={() => ouvrir('ajouter')}>
            <Plus size={16} aria-hidden="true" /> Ajouter un mot-clé
          </button>
        )}
        <button type="button" className="btn btn-corail" style={bouton} onClick={() => ouvrir('voir')}>
          <Tags size={16} aria-hidden="true" /> Voir les mots-clés
        </button>
      </div>

      {feuille && (
        <div onClick={() => setFeuille(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '85dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{feuille === 'ajouter' ? 'Ajouter un mot-clé' : 'Mots-clés'}</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setFeuille(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {feuille === 'ajouter' ? (
              <form onSubmit={ajouter} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <small style={{ color: 'var(--texte-secondaire)' }}>
                  Ajoute des mots-clés pour faciliter la recherche de page ou de livre lors des différentes activités.
                </small>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>Mot-clé
                  <input value={mot} onChange={(e) => setMot(e.target.value)} maxLength={40} placeholder="ex. Stitch" required />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>Numéro de page (facultatif)
                  <input value={page} onChange={(e) => setPage(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={4} placeholder="Tout le livre si vide" />
                </label>
                <button type="submit" className="btn" disabled={mot.trim().length < 2} style={{ minHeight: '46px' }}>Ajouter</button>
              </form>
            ) : (
              <>
                {!mots.length && <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucun mot-clé pour l’instant.</p>}
                {mots.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--bordure-carte)', paddingBottom: '6px' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ overflowWrap: 'anywhere' }}>{m.mot}</b>
                      <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>
                        {m.page_no ? `Page ${m.page_no}` : 'Tout le livre'}{m.pseudo ? ` · ajouté par @${m.pseudo}` : ''}
                        {m.mon_signalement ? ' · signalé' : ''}
                      </small>
                    </span>
                    {m.moi ? (
                      <button type="button" aria-label="Retirer mon mot-clé" onClick={() => retirer(m)} className="btn alt" style={{ ...bouton, padding: '0 10px' }}>
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" aria-label="Signaler ce mot-clé" onClick={() => setSignalement(signalement === m.id ? null : m.id)} className="btn alt" style={{ ...bouton, padding: '0 10px' }}>
                        <Flag size={16} aria-hidden="true" />
                      </button>
                    )}
                    {signalement === m.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {RAISONS.map(([v, l]) => (
                          <button key={v} type="button" className="btn alt" style={{ ...bouton, minHeight: '44px' }} onClick={() => signaler(m.id, v)}>{l}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {message && <small style={{ fontWeight: 700 }}>{message}</small>}
          </div>
        </div>
      )}
    </>
  );
}
