'use client';
import { useEffect, useState } from 'react';
import { BarChart3, Check } from 'lucide-react';
import { TempsRestant } from './Fuseau';
import TexteErreur from './TexteErreur';

const RAFRAICHIR_MS = 15000;

export default function Sondage({ missiveId, sondage: initial, lectureSeule = false, onVote }) {
  const [sondage, setSondage] = useState(initial);
  const [choix, setChoix] = useState(initial.mes_votes || []);
  const [modifier, setModifier] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const aVote = (sondage.mes_votes || []).length > 0;
  const peutVoter = !lectureSeule && sondage.ouvert && (!aVote || modifier);
  const nombre = (i) => (sondage.votes || []).find((v) => v.option === i)?.n || 0;
  const votants = sondage.votants || 0;
  const pourcent = (i) => (votants ? Math.round((nombre(i) / votants) * 100) : 0);

  useEffect(() => {
    if (!sondage.ouvert) return;
    const recharger = () => {
      if (document.hidden) return;
      fetch(`/api/missives?sondage=${missiveId}`).then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.sondage && setSondage(d.sondage)).catch(() => {});
    };
    const minuterie = setInterval(recharger, RAFRAICHIR_MS);
    const reste = sondage.fin ? new Date(sondage.fin).getTime() - Date.now() : null;
    const fin = reste !== null && reste < 2147483647 ? setTimeout(recharger, Math.max(reste, 0) + 1000) : null;
    return () => { clearInterval(minuterie); if (fin) clearTimeout(fin); };
  }, [missiveId, sondage.ouvert, sondage.fin]);

  function basculer(i) {
    if (sondage.multiple) setChoix((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));
    else setChoix([i]);
  }

  async function voter() {
    setEnvoi(true); setErreur('');
    const r = await fetch('/api/missives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: missiveId, options: choix }) });
    setEnvoi(false);
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.'); return; }
    const anciens = new Set(sondage.mes_votes || []);
    const votes = sondage.options.map((_, i) => ({ option: i, n: nombre(i) - (anciens.has(i) ? 1 : 0) + (choix.includes(i) ? 1 : 0) })).filter((v) => v.n > 0);
    setSondage({ ...sondage, votes, mes_votes: [...choix], votants: votants + (aVote ? 0 : 1) });
    setModifier(false);
    onVote?.();
  }

  return (
    <div onClick={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', padding: '10px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
        <BarChart3 size={16} aria-hidden="true" /> Sondage
        <small style={{ fontWeight: 400, color: 'var(--texte-secondaire)' }}>· {sondage.multiple ? 'plusieurs réponses permises' : 'une seule réponse'}</small>
      </b>

      {sondage.options.map((o, i) => {
        const pct = pourcent(i);
        const n = nombre(i);
        const mien = (sondage.mes_votes || []).includes(i);
        const coche = choix.includes(i);
        const barre = <span aria-hidden="true" style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'var(--btn-secondaire-bordure)', opacity: 0.55 }} />;
        const resultat = (
          <span style={{ flex: '0 0 auto', textAlign: 'right', lineHeight: 1.15 }}>
            <b style={{ display: 'block' }}>{pct} %</b>
            <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.72rem' }}>{n} vote{n > 1 ? 's' : ''}</small>
          </span>
        );
        if (peutVoter) {
          return (
            <button key={i} type="button" onClick={() => basculer(i)} role={sondage.multiple ? 'checkbox' : 'radio'} aria-checked={coche}
              aria-label={`${o}, ${pct} %, ${n} vote${n > 1 ? 's' : ''}`}
              style={{
                position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minHeight: '44px',
                padding: '6px 10px', textAlign: 'left', fontSize: '0.88rem', cursor: 'pointer', color: 'var(--texte-principal)',
                borderRadius: 'var(--rayon-s)', background: 'var(--fond-carte)',
                border: coche ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
              }}>
              {barre}
              <span aria-hidden="true" style={{
                position: 'relative', width: 18, height: 18, flex: '0 0 auto', borderRadius: sondage.multiple ? '4px' : '50%',
                border: '2px solid var(--btn)', display: 'grid', placeItems: 'center', color: 'var(--btn)',
              }}>{coche && (sondage.multiple
                ? <Check size={12} />
                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />)}</span>
              <span style={{ position: 'relative', flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: coche ? 700 : 400 }}>{o}</span>
              <span style={{ position: 'relative', display: 'flex' }}>{resultat}</span>
            </button>
          );
        }
        return (
          <div key={i} style={{ position: 'relative', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)' }}>
            {barre}
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', minHeight: '32px', fontSize: '0.88rem', minWidth: 0 }}>
              {mien && <Check size={14} aria-label="Mon vote" style={{ flex: '0 0 auto' }} />}
              <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontWeight: mien ? 700 : 400 }}>{o}</span>
              {resultat}
            </span>
          </div>
        );
      })}

      {peutVoter && (
        <button type="button" className="btn" onClick={voter} disabled={!choix.length || envoi} style={{ minHeight: '44px', fontWeight: 700 }}>
          {envoi ? 'Envoi…' : aVote ? 'Changer mon vote' : 'Voter'}
        </button>
      )}

      <small style={{ color: 'var(--texte-secondaire)' }}>
        {votants} personne{votants > 1 ? 's ont' : ' a'} voté{!sondage.ouvert && ' · sondage terminé'}
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
