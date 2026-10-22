'use client';
import { useEffect, useState } from 'react';
import { Tags, Plus, X, Trash2 } from 'lucide-react';
import { cleMot } from '@/lib/cleMot';

// Mots-clefs d'un de mes coloriages, affichés directement sur le coloriage (pas besoin d'ouvrir la fenêtre).
// L'image reste visible en haut pendant l'ajout.
//  - Tome du catalogue : mots-clefs partagés de cette page du tome, ajoutés par tous les membres ; tout le monde les voit.
//    Un même mot n'existe qu'une fois par page, peu importe qui l'ajoute (Lapin = lapin = Lapins, lib/cleMot.js).
//  - Tome perso (hors catalogue) : mots-clefs gardés sur le coloriage lui-même
// tome : { id, nom } du catalogue, ou null
// Nouveau coloriage (pas encore enregistré) : enAttente + onAttente, les mots-clefs sont gardés ici et enregistrés
// avec le coloriage ; tomeNom permet de montrer déjà ceux des autres membres pour cette page.
export default function MotsClesColoriage({ pageId, tome: tomeCatalogue, tomeNom, pageNo, image, enAttente, onAttente }) {
  const attente = Boolean(onAttente);
  const [ouvert, setOuvert] = useState(false);
  const [partages, setPartages] = useState([]); // mots-clefs de la page, de tous les membres : [{ id, mot, page_no, moi }]
  const [perso, setPerso] = useState([]); // mots-clefs gardés sur le coloriage (tome hors catalogue)
  const [tomeTrouve, setTomeTrouve] = useState(null); // nouveau coloriage : tome du catalogue retrouvé par son nom
  const [mot, setMot] = useState('');
  const [message, setMessage] = useState('');
  const page = String(pageNo || '').trim();
  const tome = tomeCatalogue || tomeTrouve;
  const partage = Boolean(tome) && /^\d*$/.test(page);

  async function charger() {
    if (attente) {
      // Mots-clefs déjà mis par les autres membres sur cette page du tome choisi
      if (!tomeNom) { setTomeTrouve(null); setPartages([]); return; }
      const r = await fetch(`/api/mots-cles?nom=${encodeURIComponent(tomeNom)}`);
      const d = r.ok ? await r.json() : {};
      setTomeTrouve(d.tome ? { id: d.tome, nom: tomeNom } : null);
      setPartages((d.mots || []).filter((m) => String(m.page_no || '') === page));
      return;
    }
    if (partage) {
      const r = await fetch(`/api/mots-cles?tome=${tome.id}`);
      // Mots-clefs de cette page (ou de tout le livre si le coloriage n'a pas de numéro de page), de tous les membres
      if (r.ok) setPartages(((await r.json()).mots || []).filter((m) => String(m.page_no || '') === page));
    } else if (pageId) {
      const r = await fetch(`/api/pages/${pageId}/mots-cles`);
      if (r.ok) setPerso((await r.json()).mots || []);
    }
  }
  // Chargés dès l'ouverture du coloriage, et rechargés quand on change de tome ou de page (nouveau coloriage)
  useEffect(() => { charger(); }, [pageId, tomeCatalogue?.id, tomeNom, page]);
  useEffect(() => { if (ouvert) setMessage(''); }, [ouvert]);

  // Tous les mots-clefs à afficher : partagés (de tous), perso, et ceux en attente d'un nouveau coloriage
  const mots = [
    ...partages,
    ...perso.map((m) => ({ mot: m, moi: true })),
    ...(attente ? enAttente.map((m) => ({ mot: m, moi: true, enAttente: true })) : []),
  ];

  async function ajouter(e) {
    e.preventDefault();
    const m = mot.trim().replace(/\s+/g, ' ').slice(0, 40);
    // Même mot déjà là, peu importe qui l'a mis et comment il est écrit
    const existant = mots.find((x) => cleMot(x.mot) === cleMot(m));
    if (existant) { setMessage(`« ${existant.mot} » est déjà un mot-clef de ce coloriage`); return; }
    if (attente) {
      onAttente([...enAttente, m].slice(0, 30));
      setMessage(`Mot-clef « ${m} » ajouté : il sera enregistré avec le coloriage`); setMot('');
      return;
    }
    const r = partage
      ? await fetch('/api/mots-cles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId: tome.id, mot: m, pageNo: page }) })
      : await fetch(`/api/pages/${pageId}/mots-cles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mot: m }) });
    const d = await r.json().catch(() => ({}));
    setMessage(r.ok ? `Mot-clef « ${m} » ajouté` : d.error || 'Erreur, réessaie.');
    if (r.ok) setMot('');
    charger();
  }

  async function retirer(m) {
    if (!confirm(`Retirer le mot-clef « ${m.mot} » ?`)) return;
    if (m.enAttente) { onAttente(enAttente.filter((x) => x !== m.mot)); return; }
    if (m.id) await fetch('/api/mots-cles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
    else await fetch(`/api/pages/${pageId}/mots-cles`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mot: m.mot }) });
    charger();
  }

  const carre = { minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' };

  // Un mot-clef : seulement le mot (personne ne voit qui l'a mis, sauf l'Invocatrice dans son Espace), et la poubelle pour les siens
  const pastille = (m, petit) => (
    <span key={m.id || `${m.enAttente ? 'a' : 'p'}-${m.mot}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: '12px', paddingRight: m.moi && !petit ? 0 : '12px', minHeight: petit ? '32px' : undefined, borderRadius: '999px', border: '1px solid var(--bordure-carte)', background: 'var(--accent-doux)', maxWidth: '100%' }}>
      <span style={{ overflowWrap: 'anywhere', fontWeight: 600, fontSize: petit ? '0.85rem' : undefined }}>{m.mot}</span>
      {!petit && m.moi && (
        <button type="button" aria-label={`Retirer le mot-clef ${m.mot}`} onClick={() => retirer(m)}
          style={{ ...carre, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)' }}>
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
    </span>
  );

  return (
    <>
      <button type="button" className="btn btn-save" onClick={() => setOuvert(true)}
        style={{ width: '100%', minHeight: '46px', margin: 'var(--espace-2) 0', fontWeight: 700 }}>
        <Tags size={18} aria-hidden="true" /> Ajouter des mots-clefs
      </button>
      {/* Mots-clefs visibles directement sur le coloriage, ceux de tous les membres compris */}
      {mots.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--espace-2)' }} aria-label="Mots-clefs de ce coloriage">
          {mots.map((m) => pastille(m, true))}
        </div>
      )}

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
                  ? 'Ces mots-clefs sont partagés : toute la communauté les voit et les utilise pour retrouver cette page. Un même mot n’est gardé qu’une fois (Lapin, lapin et Lapins comptent pour un).'
                  : 'Ce tome n’est pas dans le catalogue : tes mots-clefs restent sur ce coloriage, pour le retrouver dans Coloriages.'}
                {attente && ' Les tiens seront enregistrés avec le coloriage quand tu toucheras Enregistrer.'}
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
                {mots.map((m) => pastille(m, false))}
                {!mots.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun mot-clef pour l’instant.</small>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
