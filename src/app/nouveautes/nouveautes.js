'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { CATEGORIES_NOUVEAUTE } from '@/lib/nouveautes';

const date = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

// Nouveautés : nouvelles, changements de l'app, livres et coffrets ajoutés
export default function Nouveautes() {
  const [categorie, setCategorie] = useState('nouvelles');
  const [articles, setArticles] = useState(null);
  const [ouvert, setOuvert] = useState(null);

  useEffect(() => {
    setArticles(null); setOuvert(null);
    fetch(`/api/nouveautes?categorie=${categorie}`).then((r) => r.json()).then((d) => setArticles(d.articles || []));
  }, [categorie]);

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Nouveautés</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {CATEGORIES_NOUVEAUTE.map((c) => (
          <button key={c.valeur} type="button" onClick={() => setCategorie(c.valeur)} className={categorie === c.valeur ? 'btn' : 'btn alt'}
            style={{ minHeight: '48px', padding: '6px 4px', fontSize: '0.8rem', lineHeight: 1.2, minWidth: 0 }}>
            {c.label}
          </button>
        ))}
      </div>

      {articles === null && <p>Chargement…</p>}
      {articles && !articles.length && <p style={{ color: 'var(--texte-secondaire)' }}>Rien de nouveau ici pour l'instant.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {articles?.map((a) => {
          const estOuvert = ouvert === a.id;
          return (
            <article key={a.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button type="button" onClick={() => setOuvert(estOuvert ? null : a.id)} aria-expanded={estOuvert}
                style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <small style={{ color: 'var(--texte-secondaire)', display: 'block' }}>{date(a.publie_le)}</small>
                  <b style={{ display: 'block', fontSize: '1.15rem', lineHeight: 1.25, overflowWrap: 'anywhere' }}>{a.titre}</b>
                  {a.resume && <span style={{ display: 'block', marginTop: '4px', fontSize: '0.92rem' }}>{a.resume}</span>}
                </span>
                {a.contenu && (estOuvert
                  ? <ChevronDown size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
                  : <ArrowRight size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />)}
              </button>
              {estOuvert && a.contenu && (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', borderTop: '1px solid var(--bordure-carte)', paddingTop: '8px' }}>{a.contenu}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
