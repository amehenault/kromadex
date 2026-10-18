'use client';
import { useEffect, useRef, useState } from 'react';
import { Crown, Gem, Medal, Shield, Sparkles, Award, Sword, Stamp, BadgeCheck, Compass, Swords, Puzzle, ScrollText, Gift } from 'lucide-react';
import { RECOMPENSES, imageRecompense, nomRecompense } from '@/lib/recompenses';

const ICONES = { Crown, Gem, Medal, Shield, Sparkles, Award, Sword, Stamp, BadgeCheck, Compass, Swords, Puzzle, ScrollText };

// Image d'une récompense (dossier public/recompenses-activites), ou son icône tant que l'image n'existe pas
// carre : cadre carré aux coins arrondis, avec un fond (objets de l'inventaire) au lieu du rond
export function IconeRecompense({ r, taille = 40, carre = false }) {
  const [rate, setRate] = useState(false);
  const img = useRef(null);
  const src = imageRecompense(r);
  // L'image peut avoir échoué avant que la page soit interactive : on vérifie au montage
  useEffect(() => { const i = img.current; if (i && i.complete && !i.naturalWidth) setRate(true); }, [src]);
  const Icone = ICONES[RECOMPENSES[r.genre]?.icone] || Gift;
  return (
    <span title={nomRecompense(r)} style={{
      width: taille, height: taille, flex: '0 0 auto', borderRadius: carre ? 'var(--rayon-m)' : '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: carre ? 'var(--accent-doux)' : rate || !src ? 'var(--carte)' : 'transparent', color: 'var(--btn)', overflow: 'hidden',
      border: carre ? '1px solid var(--bordure-carte)' : 'none', padding: carre ? Math.round(taille * 0.08) : 0, boxSizing: 'border-box',
    }}>
      {src && !rate
        ? <img ref={img} src={src} alt="" onError={() => setRate(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        : <Icone size={Math.round(taille * 0.55)} aria-hidden="true" />}
    </span>
  );
}

// Une récompense avec son nom (« 2 sceaux de @marie »)
export function LigneRecompense({ r, nombre = 1, taille = 40 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <IconeRecompense r={r} taille={taille} />
      <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontWeight: 600, fontSize: '0.9rem' }}>{nomRecompense(r, nombre)}</span>
    </div>
  );
}
