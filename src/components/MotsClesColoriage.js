'use client';
import { useEffect, useState } from 'react';
import { Tags, Plus, X, Trash2 } from 'lucide-react';
import Pseudo from '@/components/Pseudo';

// Mots-clefs d'un de mes coloriages. L'image reste visible en haut pendant l'ajout.
//  - Tome du catalogue : mots-clefs partagés de cette page du tome, ajoutés par tous les membres (affichés sous le champ)
//  - Tome perso (hors catalogue) : mots-clefs gardés sur le coloriage lui-même
// tome : { id, nom } du catalogue, ou null
export default function MotsClesColoriage({ pageId, tome, pageNo, image }) {
  const [ouvert, setOuvert] = useState(false);
  const [mots, setMots] = useState([]); // partagés : [{ id, mot, pseudo, role, moi }] ; perso : [{ mot, moi: true }]
  const [mot, setMot] = useState('');
  const [message, setMessage] = useState('');
  const page = String(pageNo || '').trim();
  const partage = Boolean(tome) && /^\d*$/.test(page);

  async function charger() {
    if (partage) {
      const r = await fetch(`/api/mots-cles?tome=${tome.id}`);
      // Mots-clefs de cette page (ou de tout le livre si le coloriage n'a pas de numéro de page), de tous les membres
      if (r.ok) setMots(((await r.json()).mots || []).filter((m) => String(m.page_no || '') === page));
    } else {
      const r = await fetch(`/api/pages/${pageId}/mots-cles`);
      if (r.ok) setMots(((await r.json()).mots || []).map((m) => ({ mot: m, moi: true })));
    }
  }
  useEffect(() => { if (ouvert) { setMessage(''); charger(); } }, [ouvert]);

  async function ajouter(e) {
    e.preventDefault();
    const r = partage
      ? await fetch('/api/mots-cles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId: tome.id, mot, pageNo: page }) })
      : await fetch(`/api/pages/${pageId}/mots-cles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mot }) });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? `Mot-clef « ${mot.trim()} » ajouté` : d.error || 'Erreur, réessaie.');
    if (r.ok) { setMot(''); charger(); }
  }

  async function retirer(m) {
    if (!confirm(`Retirer le mot-clef « ${m.mot} » ?`)) return;
    if (partage) await fetch('/api/mots-cles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
    else await fetch(`/api/pages/${pageId}/mots-cles`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mot: m.mot }) });
    charger();
  }

  const carre = { minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' };

  return (
    <>
      <button type="button" className="btn btn-save" onClick={() => setOuvert(true)}
        style={{ width: '100%', minHeight: '46px', margin: 'var(--espace-2) 0', fontWeight: 700 }}>
        <Tags size={18} aria-hidden="true" /> Ajouter des mots-clefs
      </button>

      {ouvert && (
        <div className="fond-feuille" onClick={() => setOuvert(false)}>
          <div className="feuille" role="dialog" aria-modal="true" aria-label="Mots-clefs" onClick={(e) => e.stopPropagation()}>
            {/* Image du coloriage, toujours visible en haut */}
            <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--fond-carte)', padding: 'var(--espace-3) var(--espace-4) var(--espace-2)', borderBottom: '1px solid var(--bordure-carte)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <b style={{ minWidth: 0, overflowWrap: 'anywhere' }}>Mots-clefs{tome ? ` · ${tome.nom}${page ? `, page ${page}` : ''}` : ''}</b>
                <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setOuvert(false)} style={carre}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {image
                ? <img src={image} alt="Mon coloriage" style={{ display: 'block', width: '100%', maxHeight: '30dvh', objectFit: 'contain', borderRadius: 'var(--rayon-m)' }} />
                : <small style={{ color: 'var(--texte-secondaire)' }}>Ajoute une photo au coloriage pour la voir ici.</small>}
            </div>

            <div style={{ padding: 'var(--espace-3) var(--espace-4) var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <small style={{ color: 'var(--texte-secondaire)' }}>
                {partage
                  ? 'Ces mots-clefs sont partagés : toute la communauté les voit et les utilise pour retrouver cette page.'
                  : 'Ce tome n’est pas dans le catalogue : tes mots-clefs restent sur ce coloriage, pour le retrouver dans Mes coloriages.'}
              </small>
              <form onSubmit={ajouter} style={{ display: 'flex', gap: '6px' }}>
                <input value={mot} onChange={(e) => setMot(e.target.value)} maxLength={40} placeholder="ex. lapin" aria-label="Mot-clef" autoFocus
                  style={{ flex: 1, minWidth: 0, margin: 0 }} />
                <button type="submit" className="btn" disabled={mot.trim().length < 2} aria-label="Ajouter ce mot-clef" style={carre}>
                  <Plus size={18} aria-hidden="true" />
                </button>
              </form>
              {message && <small role="status" style={{ fontWeight: 700 }}>{message}</small>}

              {/* Tous les mots-clefs de cette page, ajoutés par tous les membres */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {mots.map((m) => (
                  <span key={m.id || m.mot} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: '12px', borderRadius: '999px', border: '1px solid var(--bordure-carte)', background: 'var(--accent-doux)', maxWidth: '100%' }}>
                    <span style={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{m.mot}</span>
                    {partage && m.pseudo && !m.moi && <small style={{ color: 'var(--texte-secondaire)', paddingRight: '10px' }}>par <Pseudo x={m} /></small>}
                    {m.moi ? (
                      <button type="button" aria-label={`Retirer le mot-clef ${m.mot}`} onClick={() => retirer(m)}
                        style={{ ...carre, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)' }}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                ))}
                {!mots.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun mot-clef pour l’instant.</small>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
