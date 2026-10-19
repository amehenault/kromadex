'use client';
import { useAccord } from '@/components/Genre';
import { useEffect, useState } from 'react';
import { Gavel, Check, Flag } from 'lucide-react';
import Feuille from './Feuille';
import { TempsRestant } from './Fuseau';

const image = (f) => `/api/pages/${f.id}/image?s=${f.img_size || 0}`;
const CONFIRMATION = (acc) => `Es-tu ${acc('sûre', 'sûr')} de vouloir changer le résultat de ton verdict ? Ce choix sera définitif.`;

// Rond corail numéroté qui remplace la photo et le pseudo dans les combats (anonymat)
export function PastilleColoriste({ n, taille = 28 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
      <span aria-hidden="true" style={{
        width: taille, height: taille, borderRadius: '50%', background: 'var(--couleur-principale)', color: 'var(--noir)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}>{n}</span>
      Coloriste {n}
    </span>
  );
}

// Verdict de l'Assemblée : coloriages anonymes, un verdict par personne (modifiable une seule fois).
// On ne voit ni l'autrice ou l'auteur des coloriages, ni le nombre de verdicts reçus par chacun.
// signalerDefi : id de l'épreuve, pour signaler un coloriage qui ne correspond pas à ce qui est demandé.
export default function Verdict({ activite, signalerDefi, onVote }) {
  const acc = useAccord(); // accord au genre de la personne connectée (le féminin prime)
  const [vue, setVue] = useState(null);
  const [ouverte, setOuverte] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch(`/api/verdicts?activite=${encodeURIComponent(activite)}`);
    if (r.ok) setVue(await r.json());
  }
  useEffect(() => { charger(); }, [activite]);

  async function voter(f) {
    setMessage('');
    if (vue.monVerdict && vue.monVerdict !== f.id && !confirm(CONFIRMATION(acc))) return;
    const r = await fetch('/api/verdicts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activite, pageId: f.id }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(d.error || 'Erreur'); return; }
    setVue(d); setOuverte(null); onVote?.();
  }

  async function signaler(f) {
    if (!confirm('Signaler ce coloriage parce qu’il ne correspond pas à ce que l’épreuve demande ?')) return;
    const r = await fetch('/api/defis/signalements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defiId: signalerDefi, pageId: f.id }) });
    setMessage(r.ok ? 'Merci, l’équipe de modération va vérifier ce coloriage.' : (await r.json().catch(() => ({}))).error || 'Erreur');
    setOuverte(null);
  }

  if (!vue) return <small style={{ color: 'var(--texte-secondaire)' }}>Chargement du verdict…</small>;
  const n = vue.total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
        <Gavel size={16} aria-hidden="true" style={{ color: 'var(--btn)' }} />
        {n} membre{n > 1 ? 's' : ''} de l’Assemblée {n > 1 ? 'ont' : 'a'} rendu leur verdict
      </small>
      {vue.ouvert && vue.fin && <TempsRestant fin={vue.fin} />}
      {vue.peutVoter && (
        <small style={{ color: 'var(--texte-secondaire)' }}>
          {vue.monVerdict
            ? (vue.peutChanger ? 'Ton verdict est rendu. Tu peux le changer une seule fois.' : 'Ton verdict est définitif.')
            : 'Touche le coloriage que tu préfères pour rendre ton verdict.'}
        </small>
      )}
      {!vue.peutVoter && vue.raison && <small style={{ color: 'var(--texte-secondaire)' }}>{vue.raison}</small>}
      {!vue.fiches.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun coloriage pour l’instant.</small>}
      {/* Combats : 2 images par ligne, « Coloriste N » et un bouton de vote sous chaque image */}
      {vue.numerote && vue.fiches.length > 0 && (
        <>
          <small style={{ color: 'var(--texte-secondaire)' }}>Clique sur une image pour la voir en grand.</small>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            {vue.fiches.map((f) => {
              const choisi = vue.monVerdict === f.id;
              const peut = vue.peutVoter && !f.a_moi && !choisi && (!vue.monVerdict || vue.peutChanger);
              return (
                <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <PastilleColoriste n={f.numero} />
                  <button type="button" onClick={() => setOuverte(f)} aria-label={`Voir en grand le coloriage du Coloriste ${f.numero}`}
                    style={{ all: 'unset', cursor: 'zoom-in', display: 'block', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-m)', overflow: 'hidden', background: 'var(--carte)',
                      outline: choisi ? '3px solid var(--btn)' : 'none', outlineOffset: '-3px' }}>
                    <img src={image(f)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                  {f.a_moi ? <small style={{ fontWeight: 700, textAlign: 'center' }}>Mon coloriage</small>
                    : choisi ? <small style={{ fontWeight: 700, color: 'var(--btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Check size={16} aria-hidden="true" /> Ton verdict</small>
                    : peut ? (
                      <button type="button" className="btn" onClick={() => voter(f)} style={{ minHeight: '44px', fontSize: '0.85rem', fontWeight: 700, padding: '6px 8px' }}>
                        Voter pour le Coloriste {f.numero}
                      </button>
                    ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
      {!vue.numerote && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px' }}>
        {vue.fiches.map((f) => {
          const choisi = vue.monVerdict === f.id;
          return (
            <button key={f.id} type="button" onClick={() => setOuverte(f)} aria-label={choisi ? 'Coloriage choisi' : 'Voir ce coloriage'}
              style={{ all: 'unset', cursor: 'pointer', position: 'relative', display: 'block', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)',
                outline: choisi ? '3px solid var(--btn)' : 'none', outlineOffset: '-3px' }}>
              <img src={image(f)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {choisi && <Check size={20} aria-hidden="true" style={{ position: 'absolute', top: 4, right: 4, color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />}
              {f.a_moi && <small style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', color: '#1d1d1d', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem' }}>Mon coloriage</small>}
            </button>
          );
        })}
      </div>}
      {message && <small style={{ fontWeight: 600 }}>{message}</small>}

      {ouverte && (
        <Feuille titre={ouverte.a_moi ? 'Mon coloriage' : ouverte.numero ? `Coloriste ${ouverte.numero}` : 'Coloriage en lice'} onFermer={() => setOuverte(null)}>
          <img src={image(ouverte)} alt="" style={{ width: '100%', maxHeight: '60dvh', objectFit: 'contain', borderRadius: 'var(--rayon-m)', background: 'var(--carte)' }} />
          {vue.peutVoter && !ouverte.a_moi && (vue.monVerdict === ouverte.id
            ? <small style={{ fontWeight: 700, color: 'var(--btn)', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} aria-hidden="true" /> Ton verdict</small>
            : (!vue.monVerdict || vue.peutChanger) && (
              <button type="button" className="btn" onClick={() => voter(ouverte)} style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Gavel size={18} aria-hidden="true" /> {ouverte.numero
                  ? `${vue.monVerdict ? 'Changer mon verdict : ' : ''}Voter pour le Coloriste ${ouverte.numero}`
                  : vue.monVerdict ? 'Changer mon verdict pour ce coloriage' : 'Rendre mon verdict pour ce coloriage'}
              </button>
            ))}
          {signalerDefi && !ouverte.a_moi && (
            <button type="button" className="btn alt" onClick={() => signaler(ouverte)} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Flag size={16} aria-hidden="true" /> Signaler : ne correspond pas à l’épreuve
            </button>
          )}
          {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
        </Feuille>
      )}
    </div>
  );
}
