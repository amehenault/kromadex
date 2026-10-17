'use client';
import { useEffect, useState } from 'react';
import { Tags, Plus, X, Trash2 } from 'lucide-react';

// Mots-clefs d'un de mes coloriages : ils sont rattachés au tome du catalogue et au numéro de page du coloriage.
// L'image reste visible en haut pendant l'ajout pour aider à choisir les mots.
// tome : { id, nom, possede } ou null si le tome du coloriage n'est pas dans le catalogue
export default function MotsClesColoriage({ tome, pageNo, image }) {
  const [ouvert, setOuvert] = useState(false);
  const [mots, setMots] = useState([]);
  const [mot, setMot] = useState('');
  const [message, setMessage] = useState('');
  const page = String(pageNo || '').trim();
  const peutAjouter = Boolean(tome?.possede) && /^\d*$/.test(page);

  async function charger() {
    if (!tome) return;
    const r = await fetch(`/api/mots-cles?tome=${tome.id}`);
    // Mots-clefs de cette page (ou de tout le livre si le coloriage n'a pas de numéro de page)
    if (r.ok) setMots(((await r.json()).mots || []).filter((m) => String(m.page_no || '') === page));
  }
  useEffect(() => { if (ouvert) { setMessage(''); charger(); } }, [ouvert]);

  async function ajouter(e) {
    e.preventDefault();
    const r = await fetch('/api/mots-cles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId: tome.id, mot, pageNo: page }),
    });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? `Mot-clef « ${mot.trim()} » ajouté` : d.error || 'Erreur, réessaie.');
    if (r.ok) { setMot(''); charger(); }
  }

  async function retirer(m) {
    if (!confirm(`Retirer le mot-clef « ${m.mot} » ?`)) return;
    await fetch('/api/mots-cles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
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
        <div onClick={() => setOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div role="dialog" aria-label="Ajouter des mots-clefs" onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', maxHeight: '92dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', display: 'flex', flexDirection: 'column' }}>
            {/* Image du coloriage, toujours visible en haut */}
            <div style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--fond-carte)', padding: 'var(--espace-3) var(--espace-4) var(--espace-2)', borderBottom: '1px solid var(--bordure-carte)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <b style={{ minWidth: 0, overflowWrap: 'anywhere' }}>Mots-clefs{tome ? ` · ${tome.nom}${page ? `, page ${page}` : ''}` : ''}</b>
                <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setOuvert(false)} style={carre}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {image
                ? <img src={image} alt="Mon coloriage" style={{ display: 'block', width: '100%', maxHeight: '34dvh', objectFit: 'contain', borderRadius: 'var(--rayon-m)' }} />
                : <small style={{ color: 'var(--texte-secondaire)' }}>Ajoute une photo au coloriage pour la voir ici.</small>}
            </div>

            <div style={{ padding: 'var(--espace-3) var(--espace-4) var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!tome && (
                <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
                  Les mots-clefs se rattachent à un tome du catalogue. Choisis un tome du catalogue pour ce coloriage, puis enregistre-le.
                </p>
              )}
              {tome && !tome.possede && (
                <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
                  Ajoute « {tome.nom} » à ta bibliothèque pour pouvoir lui ajouter des mots-clefs.
                </p>
              )}
              {tome?.possede && !peutAjouter && (
                <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Le numéro de page du coloriage doit être un nombre.</p>
              )}

              {peutAjouter && (
                <form onSubmit={ajouter} style={{ display: 'flex', gap: '6px' }}>
                  <input value={mot} onChange={(e) => setMot(e.target.value)} maxLength={40} placeholder="ex. Stitch" aria-label="Mot-clef" autoFocus
                    style={{ flex: 1, minWidth: 0 }} />
                  <button type="submit" className="btn" disabled={mot.trim().length < 2} aria-label="Ajouter ce mot-clef" style={carre}>
                    <Plus size={18} aria-hidden="true" />
                  </button>
                </form>
              )}
              {message && <small role="status" style={{ fontWeight: 700 }}>{message}</small>}

              {tome && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {mots.map((m) => (
                    <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', paddingLeft: '12px', borderRadius: '999px', border: '1px solid var(--bordure-carte)', background: 'var(--accent-doux)', maxWidth: '100%' }}>
                      <span style={{ overflowWrap: 'anywhere', fontWeight: 600 }}>{m.mot}</span>
                      {m.moi ? (
                        <button type="button" aria-label={`Retirer le mot-clef ${m.mot}`} onClick={() => retirer(m)}
                          style={{ ...carre, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)' }}>
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      ) : <span style={{ width: '12px' }} />}
                    </span>
                  ))}
                  {!mots.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun mot-clef pour cette page pour l’instant.</small>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
