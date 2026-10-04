'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export default function Library({ pages }) {
  const [q, setQ] = useState('');
  const [tome, setTome] = useState('');
  const tomes = [...new Set(pages.map((p) => p.tome).filter(Boolean))].sort();
  const liste = useMemo(() => pages.filter((p) =>
    (!tome || p.tome === tome) && (p.title || '').toLowerCase().includes(q.toLowerCase())
  ), [pages, q, tome]);

  return (
    <>
      <div className="barre">
        <input placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tome} onChange={(e) => setTome(e.target.value)}>
          <option value="">Tous les tomes</option>
          {tomes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grille">
        {liste.map((p) => (
          <Link key={p.id} href={`/pages/${p.id}`} className="tuile">
            {p.has_image ? <img src={`/api/pages/${p.id}/image`} alt="" /> : <div className="vide" />}
            <b>{p.title || 'Sans titre'}</b>
            <small>
              {[
                p.tome,
                p.page_no ? `page ${p.page_no}` : null
              ].filter(Boolean).join(', ')}
            </small>
          </Link>
        ))}
      </div>
      {!liste.length && <p>Aucun coloriage pour l&apos;instant. Appuie sur + pour commencer.</p>}
      <Link href="/pages/new" className="btn ajouter" aria-label="Ajouter un coloriage">+</Link>
    </>
  );
}
