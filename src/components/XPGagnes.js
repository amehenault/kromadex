'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import Feuille from './Feuille';

// Pop-up « Bravo chère (ou cher) <titre>, tu as gagné <n> XP car tu as <raison> ! Continue comme ça. »
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
        {/* Un seul gain : « … tu as gagné 10 XP car tu as terminé la quête « … » ! » ; plusieurs : le total, puis le détail */}
        <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.4 }}>
          Bravo {gain.feminin ? 'chère' : 'cher'} <b>{gain.titre}</b>, tu as gagné <b>{gain.xp} XP</b>
          {gain.gains?.length === 1 ? <> car tu as {gain.gains[0].raison}</> : ''} !<br />Continue comme ça.
        </p>
        {gain.gains?.length > 1 && (
          <ul style={{ margin: 0, paddingLeft: '18px', textAlign: 'left', fontSize: '0.92rem', alignSelf: 'stretch' }}>
            {gain.gains.map((g, i) => <li key={i}><b>{g.xp} XP</b> car tu as {g.raison}</li>)}
          </ul>
        )}
      </div>
      <button type="button" className="btn" onClick={fermer} style={{ minHeight: '48px', fontWeight: 700 }}>Merci !</button>
    </Feuille>
  );
}
