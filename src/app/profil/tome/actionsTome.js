'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Images, Gem } from 'lucide-react';
import AvisTome, { Cristaux } from '@/components/AvisTome';

export default function ActionsTome({ tome, moyenne, nbAvis }) {
  const [ouvert, setOuvert] = useState(false);
  const [stats, setStats] = useState({ moyenne, nb_avis: nbAvis });
  const bouton = { minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', flex: 1, minWidth: 0, padding: '6px 8px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      {tome.id && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Cristaux note={stats.moyenne} />
          <small style={{ color: 'var(--texte-secondaire)' }}>{stats.nb_avis ? `${stats.moyenne} sur 5 (${stats.nb_avis} avis)` : 'Aucun avis pour l’instant'}</small>
        </span>
      )}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {tome.id && (
          <button type="button" className="btn alt" style={bouton} onClick={() => setOuvert(true)}>
            <Gem size={16} aria-hidden="true" /> Mon avis
          </button>
        )}
        <Link href={`/galerie?tome=${encodeURIComponent(tome.nom)}`} className="btn alt" style={bouton}>
          <Images size={16} aria-hidden="true" /> Coloriages de la communauté
        </Link>
      </div>
      {ouvert && <AvisTome tome={tome} onFermer={() => setOuvert(false)} onMaj={(_, champs) => setStats(champs)} />}
    </div>
  );
}
