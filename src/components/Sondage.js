'use client';
import { useState } from 'react';
import { BarChart3, Check } from 'lucide-react';
import { TempsRestant } from './Fuseau';
import TexteErreur from './TexteErreur';

// Sondage d'une missive : on choisit sa ou ses réponses et on vote, puis on voit les résultats.
// On peut changer son vote tant que le sondage est ouvert. lectureSeule : résultats seulement (Espace de l'Invocatrice).
export default function Sondage({ missiveId, sondage: initial, lectureSeule = false, onVote }) {
  const [sondage, setSondage] = useState(initial);
  const [choix, setChoix] = useState(initial.mes_votes || []);
  const [modifier, setModifier] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const aVote = (sondage.mes_votes || []).length > 0;
  const voirResultats = lectureSeule || !sondage.ouvert || (aVote && !modifier);
  const nombre = (i) => (sondage.votes || []).find((v) => v.option === i)?.n || 0;
  const totalVotes = (sondage.votes || []).reduce((t, v) => t + v.n, 0);

  function basculer(i) {
    if (sondage.multiple) setChoix((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));
    else setChoix([i]);
  }

  async function voter() {
    setEnvoi(true); setErreur('');
    const r = await fetch('/api/missives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: missiveId, options: choix }) });
    setEnvoi(false);
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.'); return; }
    // Résultats mis à jour sur place : on retire mes anciens votes et on ajoute les nouveaux
    const anciens = new Set(sondage.mes_votes || []);
    const votes = sondage.options.map((_, i) => ({ option: i, n: nombre(i) - (anciens.has(i) ? 1 : 0) + (choix.includes(i) ? 1 : 0) })).filter((v) => v.n > 0);
    setSondage({ ...sondage, votes, mes_votes: [...choix], votants: (sondage.votants || 0) + (aVote ? 0 : 1) });
    setModifier(false);
    onVote?.();
  }

  return (
    <div onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', padding: '10px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
        <BarChart3 size={16} aria-hidden="true" /> Sondage
        <small style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>· {sondage.multiple ? 'plusieurs réponses permises' : 'une seule réponse'}</small>
      </b>

      {voirResultats ? (
        sondage.options.map((o, i) => {
          const pct = totalVotes ? Math.round((nombre(i) / totalVotes) * 100) : 0;
          const mien = (sondage.mes_votes || []).includes(i);
          return (
            <div key={i} style={{ position: 'relative', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'var(--btn-secondaire-bordure)', opacity: 0.55 }} />
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', fontSize: '0.88rem', minWidth: 0 }}>
                {mien && <Check size={14} aria-label="Mon vote" style={{ flex: '0 0 auto' }} />}
                <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: mien ? 700 : 400 }}>{o}</span>
                <b style={{ flex: '0 0 auto' }}>{pct} %</b>
              </span>
            </div>
          );
        })
      ) : (
        <>
          {sondage.options.map((o, i) => {
            const coche = choix.includes(i);
            return (
              <button key={i} type="button" onClick={() => basculer(i)} role={sondage.multiple ? 'checkbox' : 'radio'} aria-checked={coche}
                className={coche ? 'btn' : 'btn alt'}
                style={{ justifyContent: 'flex-start', textAlign: 'left', minHeight: '44px', fontSize: '0.88rem', gap: '8px', overflowWrap: 'anywhere' }}>
                <span aria-hidden="true" style={{
                  width: 18, height: 18, flex: '0 0 auto', borderRadius: sondage.multiple ? '4px' : '50%', border: '2px solid currentColor',
                  display: 'grid', placeItems: 'center',
                }}>{coche && (sondage.multiple
                  ? <Check size={12} />
                  : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />)}</span>
                {o}
              </button>
            );
          })}
          <button type="button" className="btn" onClick={voter} disabled={!choix.length || envoi} style={{ minHeight: '44px', fontWeight: 700 }}>
            {envoi ? 'Envoi…' : aVote ? 'Changer mon vote' : 'Voter'}
          </button>
        </>
      )}

      <small style={{ color: 'var(--texte-secondaire)' }}>
        {sondage.votants || 0} personne{(sondage.votants || 0) > 1 ? 's ont' : ' a'} voté{!sondage.ouvert && ' · sondage terminé'}
      </small>
      {sondage.ouvert && sondage.fin && <TempsRestant fin={sondage.fin} />}
      {!lectureSeule && sondage.ouvert && aVote && !modifier && (
        <button type="button" className="btn alt" onClick={() => { setChoix(sondage.mes_votes || []); setModifier(true); }} style={{ minHeight: '44px', fontSize: '0.85rem' }}>
          Changer mon vote
        </button>
      )}
      {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
    </div>
  );
}
