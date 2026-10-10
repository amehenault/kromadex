'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export default function Library({ pages = [] }) {
  const [q, setQ] = useState('');
  const [tome, setTome] = useState('');

  const elements = Array.isArray(pages) ? pages : [];

  const tomes = useMemo(() => {
    return [...new Set(elements.map((p) => p.tome).filter(Boolean))].sort();
  }, [elements]);

  const liste = useMemo(() => {
    return elements.filter((p) => {
      const matchTome = !tome || p.tome === tome;
      const titre = (p.title || p.titre || '').toString().toLowerCase();
      const matchQ = !q.trim() || titre.includes(q.trim().toLowerCase());
      return matchTome && matchQ;
    });
  }, [elements, q, tome]);

  return (
    <>
      <div className="barre">
        <input placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tome} onChange={(e) => setTome(e.target.value)}>
          <option value="">Tous les tomes</option>
          {tomes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grille">
        {liste.map((p) => (
          <Link key={p.id} href={`/pages/${p.id}`} className="tuile">
            {p.has_image ? (
              <img 
                src={`/api/pages/${p.id}/image?s=${p.img_size || 0}`} 
                alt="" 
              />
            ) : (
              <div className="vide" />
            )}
            <b>{p.title || p.titre || 'Sans titre'}</b>
            <small>
              {[p.tome, p.page_no ? `page ${p.page_no}` : null].filter(Boolean).join(', ')}
            </small>
          </Link>
        ))}
      </div>

      {!liste.length && (
        <p>Aucun coloriage pour l&apos;instant. Appuie sur + pour commencer.</p>
      )}

      <Link href="/pages/new" className="btn ajouter" aria-label="Ajouter un coloriage">+</Link>
    </>
  );
}