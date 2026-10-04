'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

export default function Library({ pages }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [tome, setTome] = useState('');
  const uniq = (k) => [...new Set(pages.map((p) => p[k]).filter(Boolean))].sort();
  const liste = useMemo(() => pages.filter((p) =>
    (!cat || p.category === cat) && (!tome || p.tome === tome) && p.title.toLowerCase().includes(q.toLowerCase())
  ), [pages, q, cat, tome]);
  return (
    <>
      <div className="barre">
        <input placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Toutes les sous-catégories</option>
          {uniq('category').map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={tome} onChange={(e) => setTome(e.target.value)}>
          <option value="">Tous les tomes</option>
          {uniq('tome').map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grille">
        {liste.map((p) => (
          <Link key={p.id} href={`/pages/${p.id}`} className="tuile">
            {p.has_image ? <img src={`/api/pages/${p.id}/image`} alt="" /> : <div className="vide" />}
            <b>{p.title || 'Sans titre'}</b>
            <small>{p.tome}{p.page_no ? ` / page ${p.page_no}` : ''}</small>
            <small>{p.category}</small>
          </Link>
        ))}
      </div>
      {!liste.length && <p>Aucun coloriage pour l&apos;instant. Appuie sur + pour commencer.</p>}
      <Link href="/pages/new" className="btn ajouter" aria-label="Ajouter un coloriage">+</Link>
    </>
  );
}
