'use client';
import { useMemo, useState } from 'react';
import { Check, Clock, XCircle, Image as ImageIcon, Trash2, Gift } from 'lucide-react';
import { LIGNES_BINGO, nomCategorieBingo } from '@/lib/bingos';
import { XP_BINGO } from '@/lib/activites';
import { TempsRestant } from '@/components/Fuseau';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import TexteErreur from '@/components/TexteErreur';
import NombreParticipants from '@/components/NombreParticipants';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const image = (c) => `/api/pages/${c.page}/image?s=${c.img_size || 0}`;
const ETAT = {
  attente: { texte: 'En attente de validation', Icone: Clock, couleur: 'var(--texte-secondaire)' },
  valide: { texte: 'Validée', Icone: Check, couleur: 'var(--btn)' },
  refuse: { texte: 'Refusée : choisis un autre coloriage', Icone: XCircle, couleur: 'var(--danger)' },
};
const etatCase = (c) => (!c ? null : c.valide === true ? 'valide' : c.valide === false ? 'refuse' : 'attente');

// Un bingo de 3 x 3 : toucher une case montre sa condition, puis on y ajoute son coloriage.
// L'admin ou une sentinelle valide chaque case ; les XP sont versés le dernier jour du mois.
export default function Bingo({ bingo }) {
  const [cases, setCases] = useState(() => Object.fromEntries((bingo.cochees || []).filter((c) => c.page).map((c) => [c.case, c])));
  const [ouverte, setOuverte] = useState(null);
  const [choix, setChoix] = useState(false);
  const [erreur, setErreur] = useState('');
  const [inscrit, setInscrit] = useState(Boolean(bingo.inscrit));
  const [participants, setParticipants] = useState(bingo.participants || 0);

  // S'inscrire au bingo (1 bingo par mois en version gratuite, les 2 avec Kromadex+)
  async function inscrire() {
    setErreur('');
    const r = await fetch('/api/bingos/inscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bingoId: bingo.id }) });
    if (r.ok) { if (!inscrit) setParticipants((n) => n + 1); setInscrit(true); } else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }

  const valides = useMemo(() => new Set(Object.values(cases).filter((c) => c.valide === true).map((c) => c.case)), [cases]);
  const lignes = LIGNES_BINGO.filter((l) => l.every((i) => valides.has(i))).length;
  const remplies = Object.keys(cases).length;

  async function envoyer(corps) {
    setErreur('');
    const r = await fetch('/api/bingos/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bingoId: bingo.id, case: ouverte, ...corps }) });
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur'); return false; }
    return true;
  }
  async function ajouter(f) {
    if (await envoyer({ pageId: f.id })) {
      setCases({ ...cases, [ouverte]: { case: ouverte, page: f.id, img_size: f.img_size, valide: null } });
      setChoix(false); setOuverte(null);
    }
  }
  async function retirer() {
    if (await envoyer({})) {
      const { [ouverte]: _, ...reste } = cases;
      setCases(reste); setOuverte(null);
    }
  }

  const c = ouverte !== null ? cases[ouverte] : null;
  const etat = ETAT[etatCase(c)];

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <b style={{ fontSize: '1.05rem' }}>{bingo.titre}</b>
        <small style={{ color: 'var(--texte-secondaire)' }}>{bingo.debut ? jour(bingo.debut) : ''}{bingo.fin ? ` au ${jour(bingo.fin)}` : ''}</small>
      </div>
      <small style={{ fontWeight: 700 }}>{nomCategorieBingo(bingo.categorie)}</small>
      <TempsRestant fin={bingo.fin_instant} />
      <small style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--texte-secondaire)' }}>
        <Gift size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} />
        <span>{XP_BINGO.ligne} XP par ligne (3 au maximum), {XP_BINGO.grille} XP pour la grille complète, {XP_BINGO.caseEnPlus} XP par case de plus remplie avec un même coloriage. Les XP sont versés le dernier jour du mois, une fois les cases validées.</span>
      </small>
      <small style={{ fontWeight: 700, color: lignes ? 'var(--btn)' : 'var(--texte-secondaire)' }}>
        {lignes ? `Bingo ! ${lignes} ligne${lignes > 1 ? 's' : ''} validée${lignes > 1 ? 's' : ''}` : 'Touche une case pour voir sa condition'} · {remplies} / {bingo.cases.length}
      </small>
      {!inscrit && (
        <>
          <button type="button" className="btn" onClick={inscrire} style={{ minHeight: '48px', fontWeight: 700 }}>S’inscrire à ce bingo</button>
          <NombreParticipants n={participants} />
          {erreur && ouverte === null && <small style={{ color: 'var(--danger)' }}><TexteErreur texte={erreur} /></small>}
        </>
      )}
      {inscrit && <NombreParticipants n={participants} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
        {bingo.cases.map((tache, i) => {
          const x = cases[i];
          const e = etatCase(x);
          return (
            <button key={i} type="button" onClick={() => { setOuverte(i); setErreur(''); }} aria-label={`${tache}${e ? `, ${ETAT[e].texte}` : ''}`}
              style={{
                position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', padding: '6px', cursor: 'pointer', minWidth: 0, overflow: 'hidden',
                fontSize: '0.85rem', lineHeight: 1.2, wordBreak: 'break-word', fontWeight: 700, color: x ? '#ffffff' : 'var(--texte-principal)',
                border: e === 'valide' ? '3px solid var(--btn)' : e === 'refuse' ? '3px solid var(--danger)' : '1px solid var(--bordure-carte)',
                background: x ? `center / cover no-repeat url(${image(x)})` : 'var(--fond-carte)',
                textShadow: x ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
              }}>
              {tache}
              {e && (() => { const { Icone } = ETAT[e]; return <Icone size={18} aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4, color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />; })()}
            </button>
          );
        })}
      </div>

      {ouverte !== null && !choix && (
        <Feuille titre={bingo.cases[ouverte]} onFermer={() => setOuverte(null)}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(bingo.conditions || [])[ouverte] || 'Aucune condition particulière.'}</p>
          {c && (
            <>
              <img src={image(c)} alt="Mon coloriage pour cette case" style={{ width: '100%', maxHeight: '45dvh', objectFit: 'contain', borderRadius: 'var(--rayon-m)', background: 'var(--carte)' }} />
              <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: etat.couleur }}><etat.Icone size={16} aria-hidden="true" /> {etat.texte}</small>
            </>
          )}
          {inscrit ? (
            <button type="button" className="btn" onClick={() => setChoix(true)} style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ImageIcon size={18} aria-hidden="true" /> {c ? 'Changer de coloriage' : 'Ajouter mon coloriage'}
            </button>
          ) : (
            <button type="button" className="btn" onClick={inscrire} style={{ minHeight: '48px', fontWeight: 700 }}>S’inscrire à ce bingo pour ajouter mes coloriages</button>
          )}
          {c && c.valide !== true && (
            <button type="button" className="btn alt" onClick={retirer} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={16} aria-hidden="true" /> Retirer le coloriage
            </button>
          )}
          {erreur && <small style={{ color: 'var(--danger)' }}><TexteErreur texte={erreur} /></small>}
        </Feuille>
      )}
      {choix && (
        <ChoixColoriage titre={bingo.cases[ouverte]} type={['cozy', 'mystere'].includes(bingo.categorie) ? bingo.categorie : null}
          aide="Un même coloriage peut remplir plusieurs cases : 10 XP par case de plus."
          onChoisir={ajouter} onFermer={() => setChoix(false)} erreur={erreur} />
      )}
    </div>
  );
}
