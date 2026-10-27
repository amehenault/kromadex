'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Pencil } from 'lucide-react';
import { VALEURS_TYPES, nomCollections, nomMesTomes } from '@/lib/typesColoriage';

export default function OngletsCollections({ actif, visibles: visiblesDonnes }) {
  const [lus, setLus] = useState(VALEURS_TYPES);
  const visibles = visiblesDonnes || lus;
  useEffect(() => {
    if (visiblesDonnes) return;
    fetch('/api/user/preferences').then((r) => (r.ok ? r.json() : null))
      .then((p) => p?.typesVisibles && setLus(p.typesVisibles)).catch(() => {});
  }, [visiblesDonnes]);

  const tomes = nomMesTomes(visibles);
  const onglet = (href, actifIci, contenu, petit) => (
    <Link href={href} aria-current={actifIci ? 'page' : undefined} className={actifIci ? 'btn' : 'btn alt'} replace
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: petit ? '44px' : '48px', minWidth: 0,
        fontWeight: 700, fontSize: petit ? '0.85rem' : '0.95rem', textAlign: 'center', padding: '6px 8px' }}>
      {contenu}
    </Link>
  );

  return (
    <div style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center', flex: '0 0 auto' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.15rem', minWidth: 0, overflowWrap: 'anywhere' }}>{nomCollections(visibles)}</h2>
      </div>
      <nav aria-label="Collections" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
        {onglet('/profil/collection', actif === 'crayons', <><Pencil size={18} aria-hidden="true" /> Crayons</>)}
        {onglet('/profil/progression', actif !== 'crayons', <><BookOpen size={18} aria-hidden="true" /> {tomes}</>)}
      </nav>
      {actif !== 'crayons' && (
        <nav aria-label={tomes} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px', padding: '6px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
          {onglet('/profil/progression', actif === 'collection', 'Ma collection', true)}
          {onglet('/profil/tomes', actif === 'ajouter', `${tomes} à ajouter`, true)}
        </nav>
      )}
    </div>
  );
}
