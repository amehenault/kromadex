'use client';
import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { LIGNES_BINGO, nomCategorieBingo } from '@/lib/bingos';
import { TempsRestant } from '@/components/Fuseau';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Un bingo de 3 x 3 : toucher une case affiche sa condition, puis on la coche ou la décoche
export default function Bingo({ bingo }) {
  const [cochees, setCochees] = useState(() => new Set((bingo.cochees || []).map((c) => c.case)));
  const [ouverte, setOuverte] = useState(null);
  const [erreur, setErreur] = useState('');

  const lignes = useMemo(() => LIGNES_BINGO.filter((l) => l.every((i) => cochees.has(i))).length, [cochees]);

  async function basculer(i) {
    setErreur('');
    const avant = new Set(cochees);
    const apres = new Set(cochees);
    apres.has(i) ? apres.delete(i) : apres.add(i);
    setCochees(apres);
    setOuverte(null);
    const r = await fetch('/api/bingos/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bingoId: bingo.id, case: i }) });
    if (!r.ok) { setCochees(avant); setErreur((await r.json().catch(() => ({}))).error || 'Erreur'); }
  }

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <b style={{ fontSize: '1.05rem' }}>{bingo.titre}</b>
        <small style={{ color: 'var(--texte-secondaire)' }}>{bingo.debut ? jour(bingo.debut) : ''}{bingo.fin ? ` au ${jour(bingo.fin)}` : ' à la fin du mois'}</small>
      </div>
      <small style={{ fontWeight: 700 }}>{nomCategorieBingo(bingo.categorie)}</small>
      <TempsRestant fin={bingo.fin_instant} />
      <small style={{ fontWeight: 700, color: lignes ? 'var(--btn)' : 'var(--texte-secondaire)' }}>
        {lignes ? `Bingo ! ${lignes} ligne${lignes > 1 ? 's' : ''} complète${lignes > 1 ? 's' : ''}` : 'Touche une case pour voir sa condition'} · {cochees.size} / {bingo.cases.length}
      </small>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
        {bingo.cases.map((c, i) => {
          const ok = cochees.has(i);
          return (
            <button key={i} type="button" onClick={() => setOuverte(i)} aria-label={`${c}${ok ? ', faite' : ''}`}
              style={{
                position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', padding: '6px', cursor: 'pointer', minWidth: 0, overflow: 'hidden',
                fontSize: '0.85rem', lineHeight: 1.2, wordBreak: 'break-word', fontWeight: 700,
                border: ok ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
                background: ok ? 'var(--btn)' : 'var(--fond-carte)', color: 'var(--texte-principal)',
              }}>
              {c}
              {ok && <Check size={18} aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4 }} />}
            </button>
          );
        })}
      </div>
      {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}

      {ouverte !== null && (
        <div onClick={() => setOuverte(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <b style={{ fontSize: '1.1rem' }}>{bingo.cases[ouverte]}</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setOuverte(null)}
                style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(bingo.conditions || [])[ouverte] || 'Aucune condition particulière.'}</p>
            <button type="button" className={cochees.has(ouverte) ? 'btn alt' : 'btn'} onClick={() => basculer(ouverte)} style={{ minHeight: '48px', fontWeight: 700 }}>
              {cochees.has(ouverte) ? 'Décocher cette case' : 'C’est fait, je coche'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
