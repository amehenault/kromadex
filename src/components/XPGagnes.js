'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import Feuille from './Feuille';

// Pop-up « Bravo chère (ou cher) <titre>, tu as gagné <n> XP ! Continue comme ça. »
// Vérifié à chaque changement de page ; le X (ou le bouton) le ferme et les gains sont marqués comme vus.
export default function XPGagnes() {
  const chemin = usePathname() || '/';
  const [gain, setGain] = useState(null);

  useEffect(() => {
    fetch('/api/xp').then((r) => (r.ok ? r.json() : null))
      .then((d) => setGain(d?.xp > 0 ? d : null)).catch(() => {});
  }, [chemin]);

  if (!gain) return null;

  function fermer() {
    setGain(null);
    fetch('/api/xp', { method: 'POST' }).catch(() => {});
  }

  return (
    <Feuille titre="Bravo !" onFermer={fermer}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', padding: '6px 0' }}>
        <Sparkles size={40} aria-hidden="true" style={{ color: 'var(--btn)' }} />
        <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.4 }}>
          Bravo {gain.feminin ? 'chère' : 'cher'} <b>{gain.titre}</b>, tu as gagné <b>{gain.xp} XP</b> !<br />Continue comme ça.
        </p>
      </div>
      <button type="button" className="btn" onClick={fermer} style={{ minHeight: '48px', fontWeight: 700 }}>Merci !</button>
    </Feuille>
  );
}
