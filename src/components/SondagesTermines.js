'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Feuille from './Feuille';
import Sondage from './Sondage';

export default function SondagesTermines() {
  const chemin = usePathname() || '/';
  const [sondages, setSondages] = useState([]);

  useEffect(() => {
    fetch('/api/missives?termines=1').then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSondages(d.sondages || [])).catch(() => {});
  }, [chemin]);

  const m = sondages[0];
  if (!m) return null;

  function vu() {
    setSondages((l) => l.slice(1));
    fetch('/api/missives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sondageVu: m.id }) })
      .then(() => window.dispatchEvent(new Event('kromadex-lu'))).catch(() => {});
  }

  return (
    <Feuille titre="Sondage terminé !" onFermer={vu}>
      <p style={{ margin: 0, overflowWrap: 'anywhere' }}>Voici le résultat final du sondage de la missive <b>« {m.titre} »</b>.</p>
      <Sondage key={m.id} missiveId={m.id} sondage={m.sondage} lectureSeule />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button type="button" className="btn alt" onClick={vu} style={{ minHeight: '44px' }}>Fermer</button>
        <Link href={`/missives#missive-${m.id}`} className="btn" onClick={vu}
          style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Voir la missive</Link>
      </div>
    </Feuille>
  );
}
