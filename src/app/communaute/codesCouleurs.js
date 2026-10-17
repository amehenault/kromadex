'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { Avatar, BoutonJaime, imagePage, poster } from './outils';
import { CodesLecture } from './ficheDetail';
import useTypesVisibles from '@/components/useTypesVisibles';
import Pseudo from '@/components/Pseudo';

// Codes couleurs des autres : type de coloriage, puis tome, puis numéro de page
export default function CodesCouleurs() {
  const [type, setType] = useState('mystere');
  const typesVus = useTypesVisibles();
  // Si le type affiché n'est pas visible pour la personne, on passe au premier type visible
  useEffect(() => { if (!typesVus.includes(type)) setType(typesVus[0]); }, [typesVus]);
  const [tomes, setTomes] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [tome, setTome] = useState(null);
  const [pages, setPages] = useState(null);
  const [page, setPage] = useState(null);
  const [fiches, setFiches] = useState(null);

  useEffect(() => {
    setTomes(null); setTome(null);
    fetch(`/api/communaute?vue=tomes&type=${type}`).then((r) => r.json()).then((d) => setTomes(d.tomes || []));
  }, [type]);

  useEffect(() => {
    if (!tome) return;
    setPages(null); setPage(null);
    fetch(`/api/communaute?vue=pages&tome=${encodeURIComponent(tome.tome)}`).then((r) => r.json()).then((d) => setPages(d.pages || []));
  }, [tome]);

  useEffect(() => {
    if (!page) return;
    setFiches(null);
    fetch(`/api/communaute?vue=page&tome=${encodeURIComponent(tome.tome)}&page=${encodeURIComponent(page)}`)
      .then((r) => r.json()).then((d) => setFiches(d.fiches || []));
  }, [page]);

  async function aimer(f) {
    const r = await poster('/api/communaute', { id: f.id });
    if (r) setFiches((l) => l.map((x) => (x.id === f.id ? { ...x, aime: r.aime, likes: r.likes } : x)));
  }

  const retour = (texte, action) => (
    <button type="button" className="btn alt" onClick={action}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', marginBottom: '10px' }}>
      <ArrowLeft size={16} /> {texte}
    </button>
  );

  // Étape 3 : les coloriages publiés de cette page, avec leurs codes
  if (tome && page) {
    return (
      <>
        {retour('Pages', () => setPage(null))}
        <h3 style={{ margin: '0 0 10px' }}>{tome.tome} · page {page}</h3>
        {fiches === null && <p>Chargement…</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {fiches?.map((f) => (
            <div key={f.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {f.img_size ? <img src={imagePage(f)} alt="" loading="lazy" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--rayon-s)', flex: '0 0 auto' }} /> : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{f.title}</b>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Link href={`/membre/${f.auteur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'inherit' }}><Avatar x={f} taille={20} /> <small><Pseudo x={f} /></small></Link>
                  </span>
                </div>
                <BoutonJaime aime={f.aime} likes={f.likes} onClick={() => aimer(f)} />
              </div>
              <CodesLecture codes={f.codes} />
            </div>
          ))}
        </div>
      </>
    );
  }

  // Étape 2 : les numéros de page qui ont des codes partagés
  if (tome) {
    return (
      <>
        {retour('Tomes', () => setTome(null))}
        <h3 style={{ margin: '0 0 4px' }}>{tome.tome}</h3>
        <small style={{ display: 'block', color: 'var(--texte-secondaire)', marginBottom: '10px' }}>Touche une page pour voir les codes couleurs des autres.</small>
        {pages === null && <p>Chargement…</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '6px' }}>
          {pages?.map((p) => (
            <button key={p.page_no} type="button" onClick={() => setPage(p.page_no)}
              style={{
                aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', border: '2px solid var(--btn)', background: 'var(--fond-carte)',
                fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: 'var(--texte-principal)', position: 'relative', minWidth: 0,
              }}>
              {p.page_no}
              {p.n > 1 && <small style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '0.6rem', color: 'var(--btn)' }}>{p.n}</small>}
            </button>
          ))}
        </div>
        {pages && !pages.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucune page numérotée pour ce tome.</p>}
      </>
    );
  }

  // Étape 1 : type de coloriage, puis les tomes
  const visibles = (tomes || []).filter((t) => t.tome.toLowerCase().includes(recherche.toLowerCase().trim()));
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {TYPES_COLORIAGE.filter((t) => typesVus.includes(t.valeur)).map((t) => (
          <button key={t.valeur} type="button" className={type === t.valeur ? 'btn' : 'btn alt'} onClick={() => setType(t.valeur)}
            style={{ flex: '0 0 auto', minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 12px' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
        <input placeholder="Chercher un tome" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ width: '100%', paddingLeft: '36px' }} />
      </div>
      {tomes === null && <p>Chargement…</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        {visibles.map((t) => (
          <button key={t.tome} type="button" onClick={() => setTome(t)}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <span style={{
              aspectRatio: '3 / 4', borderRadius: 'var(--rayon-m)', overflow: 'hidden', background: 'var(--carte)',
              border: '1px solid var(--bordure-carte)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {t.couverture ? <img src={t.couverture} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={28} />}
            </span>
            <b style={{ fontSize: '0.8rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.tome}</b>
            <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem' }}>{t.n} coloriage{t.n > 1 ? 's' : ''}</small>
          </button>
        ))}
      </div>
      {tomes && !visibles.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucun tome avec des codes partagés pour ce type.</p>}
    </>
  );
}
