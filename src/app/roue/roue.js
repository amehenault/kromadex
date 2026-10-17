'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Dices, Compass, BookOpen, Pencil } from 'lucide-react';

const auHasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
// Pages encore à faire d'un tome (le nombre total doit être connu)
const pagesLibres = (t) => {
  if (!t.total) return [];
  const faites = new Set(t.faites);
  return Array.from({ length: t.total }, (_, i) => i + 1).filter((n) => !faites.has(n));
};

// Mode libre : un tome au hasard puis une page non faite. Mode guidé : on choisit le tome.
export default function Roue({ tomes }) {
  const [mode, setMode] = useState('libre');
  const [tomeChoisi, setTomeChoisi] = useState('');
  const [angle, setAngle] = useState(0);
  const [tourne, setTourne] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [message, setMessage] = useState('');

  const admissibles = tomes.filter((t) => pagesLibres(t).length > 0);

  function lancer() {
    setMessage(''); setResultat(null);
    let tome;
    if (mode === 'libre') {
      if (!admissibles.length) {
        setMessage(tomes.length
          ? "Aucun de tes tomes n'a de page libre connue : soit tout est colorié, soit le nombre de coloriages du livre est inconnu."
          : "Ajoute d'abord des tomes à ton profil pour que la Roue puisse choisir.");
        return;
      }
      tome = auHasard(admissibles);
    } else {
      tome = tomes.find((t) => t.nom === tomeChoisi);
      if (!tome) { setMessage('Choisis un tome.'); return; }
      if (!tome.total) { setMessage("Le nombre de coloriages de ce tome est inconnu : la Roue ne peut pas choisir de page."); return; }
      if (!pagesLibres(tome).length) { setMessage('Toutes les pages de ce tome sont déjà faites. Bravo !'); return; }
    }
    const page = auHasard(pagesLibres(tome));
    setTourne(true);
    setAngle((a) => a + 1440 + Math.floor(Math.random() * 360));
    setTimeout(() => { setTourne(false); setResultat({ tome, page }); }, 2200);
  }

  const onglet = (cle, label, Icone) => (
    <button type="button" onClick={() => { setMode(cle); setResultat(null); setMessage(''); }} className={mode === cle ? 'btn' : 'btn alt'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '48px', minWidth: 0 }}>
      <Icone size={18} aria-hidden="true" /> {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/coloriages" className="btn alt" aria-label="Retour à mes coloriages" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>La Roue du destin</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {onglet('libre', 'Destin libre', Dices)}
        {onglet('guide', 'Destin guidé', Compass)}
      </div>
      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)', fontSize: '0.92rem' }}>
        {mode === 'libre'
          ? 'La Roue choisit un de tes tomes au hasard, puis une page que tu n’as pas encore faite.'
          : 'Choisis ton tome, la Roue choisit une page que tu n’as pas encore faite.'}
      </p>

      {mode === 'guide' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, marginBottom: 'var(--espace-3)' }}>Tome
          <select value={tomeChoisi} onChange={(e) => { setTomeChoisi(e.target.value); setResultat(null); setMessage(''); }}>
            <option value="">Choisir un tome</option>
            {tomes.map((t) => (
              <option key={t.nom} value={t.nom}>
                {t.nom}{t.total ? ` (${pagesLibres(t).length} page${pagesLibres(t).length > 1 ? 's' : ''} libre${pagesLibres(t).length > 1 ? 's' : ''})` : ' (nombre inconnu)'}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* La roue */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', margin: '10px 0 20px' }}>
        <div style={{ position: 'relative', width: 'min(70vw, 240px)', aspectRatio: '1 / 1' }}>
          <span aria-hidden="true" style={{
            position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', zIndex: 1,
            width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid var(--texte-principal)',
          }} />
          <div aria-hidden="true" style={{
            width: '100%', height: '100%', borderRadius: '50%', border: '4px solid var(--texte-principal)',
            background: 'conic-gradient(var(--btn) 0 45deg, var(--fond-carte) 45deg 90deg, var(--btn) 90deg 135deg, var(--fond-carte) 135deg 180deg, var(--btn) 180deg 225deg, var(--fond-carte) 225deg 270deg, var(--btn) 270deg 315deg, var(--fond-carte) 315deg 360deg)',
            transform: `rotate(${angle}deg)`, transition: 'transform 2.2s cubic-bezier(0.17, 0.67, 0.21, 1)',
          }} />
        </div>
        <button type="button" className="btn" onClick={lancer} disabled={tourne}
          style={{ minHeight: '50px', minWidth: '200px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Dices size={20} aria-hidden="true" /> {tourne ? 'La Roue tourne…' : 'Faire tourner la Roue'}
        </button>
      </div>

      {message && <p className="carte" style={{ margin: 0 }}>{message}</p>}

      {resultat && (
        <div className="carte" style={{ display: 'flex', gap: '12px', alignItems: 'center', border: '2px solid var(--btn)' }}>
          <span style={{ width: '64px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {resultat.tome.couverture ? <img src={resultat.tome.couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={24} aria-hidden="true" />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <small style={{ color: 'var(--texte-secondaire)' }}>Ton prochain coloriage</small>
            <b style={{ display: 'block', fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{resultat.tome.nom}</b>
            <b style={{ display: 'block', fontSize: '1.6rem' }}>Page {resultat.page}</b>
            <Link href={`/pages/new?tome=${encodeURIComponent(resultat.tome.nom)}&page=${resultat.page}`} className="btn"
              style={{ marginTop: '6px', minHeight: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Pencil size={16} aria-hidden="true" /> Commencer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
