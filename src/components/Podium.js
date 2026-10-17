'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar } from '@/app/communaute/outils';
import { IconeRecompense } from './Recompense';
import { nomRecompense } from '@/lib/recompenses';
import Pseudo from '@/components/Pseudo';

const COULEURS_RANG = ['#d4a017', '#9aa3ad', '#b87333'];

// Podium de l'Assemblée : les gagnant·es des 30 derniers jours, selon les XP gagnés, avec leurs récompenses
export default function Podium() {
  const [gagnants, setGagnants] = useState(null);
  const [tous, setTous] = useState(false);

  useEffect(() => {
    fetch('/api/podium').then((r) => (r.ok ? r.json() : null)).then((d) => setGagnants(d?.gagnants || [])).catch(() => setGagnants([]));
  }, []);

  if (!gagnants?.length) return null;
  const visibles = tous ? gagnants : gagnants.slice(0, 3);

  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
        <Trophy size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Podium de l’Assemblée
      </b>
      <small style={{ color: 'var(--texte-secondaire)', marginTop: '-6px' }}>Les gagnant·es des 30 derniers jours</small>
      {visibles.map((g, i) => (
        <div key={g.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span aria-label={`Rang ${i + 1}`} style={{ width: 26, height: 26, flex: '0 0 auto', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.85rem', background: COULEURS_RANG[i] || 'var(--carte)', color: i < 3 ? '#ffffff' : 'var(--texte-principal)' }}>{i + 1}</span>
          <Link href={`/membre/${g.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, color: 'inherit', textDecoration: 'none', minHeight: '44px' }}>
            <Avatar x={g} taille={32} />
            <span style={{ minWidth: 0 }}>
              <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.92rem' }}><Pseudo x={g} /></b>
              <small style={{ color: 'var(--texte-secondaire)' }}>+{g.xp} XP · {g.victoires} victoire{g.victoires > 1 ? 's' : ''}</small>
            </span>
          </Link>
          <span style={{ display: 'flex', gap: '2px', flex: '0 0 auto' }}>
            {(g.recompenses || []).slice(0, 3).map((r, j) => (
              <span key={j} aria-label={nomRecompense(r)}><IconeRecompense r={r} taille={28} /></span>
            ))}
          </span>
        </div>
      ))}
      {gagnants.length > 3 && (
        <button type="button" className="btn alt" onClick={() => setTous(!tous)} style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {tous ? <><ChevronUp size={16} aria-hidden="true" /> Réduire</> : <><ChevronDown size={16} aria-hidden="true" /> Voir tous les gagnant·es ({gagnants.length})</>}
        </button>
      )}
    </section>
  );
}
