'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Plus, Trash2, CheckCircle2, Check } from 'lucide-react';
import ChoixTome from '@/components/ChoixTome';
import TexteErreur from '@/components/TexteErreur';

const XP = 2;
const libelle = (o) => o.texte || `Colorier la page ${o.page_no} de ${o.tome}`;

export default function ObjectifsPerso({ objectifs: initiaux, bibliotheque, sansTitre = false }) {
  const router = useRouter();
  const [objectifs, setObjectifs] = useState(initiaux);
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  const [tome, setTome] = useState('');
  const [page, setPage] = useState('');
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function appeler(method, corps) {
    setOccupe(true); setErreur('');
    const r = await fetch('/api/objectifs', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const d = await r.json().catch(() => ({}));
    setOccupe(false);
    if (!r.ok) { setErreur(d.error || 'Erreur, réessaie.'); return null; }
    setObjectifs(d.objectifs || []);
    router.refresh();
    return d;
  }

  async function ajouter(e) {
    e.preventDefault();
    const d = await appeler('POST', { texte, tome, page_no: page });
    if (d) { setTexte(''); setTome(''); setPage(''); setOuvert(false); }
  }

  const enCours = objectifs.filter((o) => !o.termine_le);
  const accomplis = objectifs.filter((o) => o.termine_le);
  const lien = { display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 };

  return (
    <section className="carte" style={{ marginBottom: sansTitre ? 0 : 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {!sansTitre && (
        <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
          <Target size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Mes objectifs
        </b>
      )}
      <small style={{ color: 'var(--texte-secondaire)' }}>
        Fixe tes propres objectifs, chacun rapporte {XP} XP une fois accompli.
      </small>

      {enCours.map((o) => (
        <div key={o.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--bordure-carte)' }} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b style={{ fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{libelle(o)}</b>
              <small style={{ flex: '0 0 auto', fontWeight: 700, color: 'var(--btn)' }}>+{XP} XP</small>
            </div>
            {o.texte && o.tome && <small style={{ display: 'block', color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{o.tome}, page {o.page_no}</small>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {!o.tome && (
                <button type="button" disabled={occupe} onClick={() => appeler('PATCH', { id: o.id })} style={{ ...lien, color: 'inherit' }}>
                  <Check size={14} aria-hidden="true" /> C’est accompli
                </button>
              )}
              <button type="button" disabled={occupe} onClick={() => confirm(`Retirer l’objectif ${libelle(o)} ?`) && appeler('DELETE', { id: o.id })} style={{ ...lien, color: 'var(--texte-secondaire)' }}>
                <Trash2 size={14} aria-hidden="true" /> Retirer
              </button>
            </div>
          </div>
        </div>
      ))}

      {accomplis.map((o) => (
        <div key={o.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', opacity: 0.75 }}>
          <CheckCircle2 size={20} aria-label="Accompli" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
          <b style={{ flex: 1, minWidth: 0, fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{libelle(o)}</b>
        </div>
      ))}

      {ouvert ? (
        <form onSubmit={ajouter} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>Mon objectif
            <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={200} placeholder="ex. Terminer la double page du château" />
          </label>
          <small style={{ color: 'var(--texte-secondaire)' }}>Tome ou livre et page (facultatif)</small>
          <ChoixTome valeur={tome} bibliotheque={bibliotheque} onChange={setTome} />
          {tome && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>Numéro de la page
              <input type="number" inputMode="numeric" min={1} value={page} onChange={(e) => setPage(e.target.value)} placeholder="ex. 12" />
            </label>
          )}
          {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn" disabled={occupe || (!texte.trim() && !(tome && page))} style={{ flex: 1, minHeight: '48px', fontWeight: 700 }}>Ajouter l’objectif</button>
            <button type="button" className="btn alt" onClick={() => { setOuvert(false); setErreur(''); }} style={{ minHeight: '48px' }}>Annuler</button>
          </div>
        </form>
      ) : (
        <>
          {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
          <button type="button" className="btn alt" onClick={() => setOuvert(true)}
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}>
            <Plus size={16} aria-hidden="true" /> Ajouter un objectif
          </button>
        </>
      )}
    </section>
  );
}
