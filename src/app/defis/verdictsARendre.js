'use client';
import { useEffect, useState } from 'react';
import { Gavel, Trophy, Swords, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import Verdict from '@/components/Verdict';
import { TempsRestant } from '@/components/Fuseau';

const FILTRES = [['a_voter', 'À voter'], ['votees', 'Verdicts donnés'], ['tous', 'Tous en cours']];
const ICONES = { epreuve: Trophy, combat: Swords, match: Crown };
const NOMS_EPREUVES = { officiel: 'Épreuve du mois', modo: 'Épreuve des Sentinelles', cheffe: 'Épreuve des Chef.fes' };
const nom = (a) => a.genre === 'epreuve' ? NOMS_EPREUVES[a.sorte] || 'Épreuve'
  : a.genre === 'combat' ? (a.sorte === 'duel' ? 'Duel' : 'Joute') : `Tournoi · ${a.sorte}`;

// Verdicts à rendre : tous les coloriages qui attendent le verdict de l'Assemblée (épreuves, combats, tournois).
// Une fois le verdict rendu, l'activité quitte « À voter » ; le filtre permet de revoir les verdicts donnés.
export default function VerdictsARendre({ onNombre }) {
  const [activites, setActivites] = useState(null);
  const [filtre, setFiltre] = useState('a_voter');
  const [ouverte, setOuverte] = useState(null);

  async function charger() {
    const r = await fetch('/api/verdicts?a_rendre=1');
    if (!r.ok) return;
    const liste = (await r.json()).activites || [];
    setActivites(liste);
    onNombre?.(liste.filter((a) => !a.votee).length);
  }
  useEffect(() => { charger(); }, []);

  if (!activites) return <p>Chargement…</p>;
  const visibles = activites.filter((a) => filtre === 'tous' || (filtre === 'votees' ? a.votee : !a.votee));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div role="group" aria-label="Filtrer les verdicts" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {FILTRES.map(([cle, label]) => (
          <button key={cle} type="button" onClick={() => setFiltre(cle)} aria-pressed={filtre === cle} className={filtre === cle ? 'btn' : 'btn alt'}
            style={{ minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 14px' }}>
            {label} ({activites.filter((a) => cle === 'tous' || (cle === 'votees' ? a.votee : !a.votee)).length})
          </button>
        ))}
      </div>

      {!visibles.length && (
        <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>
          {filtre === 'a_voter' ? 'Tu as rendu tous tes verdicts. Merci de faire vivre l’Assemblée !' : 'Rien ici pour l’instant.'}
        </p>
      )}

      {visibles.map((a) => {
        const Icone = ICONES[a.genre] || Gavel;
        const estOuverte = ouverte === a.activite;
        return (
          <div key={a.activite} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="button" onClick={() => setOuverte(estOuverte ? null : a.activite)} aria-expanded={estOuverte}
              style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px' }}>
              <Icone size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <small style={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>{nom(a)}{a.votee ? ' · verdict rendu' : ''}</small>
                <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{a.titre}</b>
                <TempsRestant fin={a.fin} />
              </span>
              {estOuverte ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
            </button>
            {estOuverte && <Verdict activite={a.activite} signalerDefi={a.genre === 'epreuve' ? Number(a.activite.split(':')[1]) : undefined} onVote={charger} />}
          </div>
        );
      })}
    </div>
  );
}
