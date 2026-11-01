'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Images, Gem } from 'lucide-react';
import AvisTome, { Cristaux } from '@/components/AvisTome';

// Placé dans la grille de la carte du tome : la note à droite de la couverture, les deux boutons sous la couverture, pleine largeur.
export default function ActionsTome({ tome, moyenne, nbAvis }) {
  const [ouvert, setOuvert] = useState(false);
  const [stats, setStats] = useState({ moyenne, nb_avis: nbAvis });
  const bouton = { minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', minWidth: 0, padding: '6px 8px', textAlign: 'center', overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'manual' };
  return (
    <>
      <div style={{ minWidth: 0, alignSelf: 'start' }}>
        {tome.id && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <Cristaux note={stats.moyenne} />
            <small style={{ color: 'var(--texte-secondaire)' }}>{stats.nb_avis ? `${stats.moyenne} sur 5 (${stats.nb_avis} avis)` : 'Aucun avis pour l’instant'}</small>
          </span>
        )}
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: tome.id ? '1fr 1fr' : '1fr', gap: '8px' }}>
        {tome.id && (
          <button type="button" className="btn alt" style={bouton} onClick={() => setOuvert(true)}>
            <Gem size={18} aria-hidden="true" /> Mon avis
          </button>
        )}
        <Link href={`/galerie?tome=${encodeURIComponent(tome.nom)}`} className="btn alt" style={bouton}>
          <Images size={18} aria-hidden="true" /> Coloriages de la communauté
        </Link>
      </div>
      {ouvert && <AvisTome tome={tome} onFermer={() => setOuvert(false)} onMaj={(_, champs) => setStats(champs)} />}
    </>
  );
}
