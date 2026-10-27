'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { Avatar, BoutonJaime, imagePage, poster } from './outils';
import FicheDetail from './ficheDetail';
import useTypesVisibles from '@/components/useTypesVisibles';
import Pseudo from '@/components/Pseudo';

export default function Fil() {
  const [type, setType] = useState('');
  const visibles = useTypesVisibles();
  const [fiches, setFiches] = useState([]);
  const [fin, setFin] = useState(false);
  const [charge, setCharge] = useState(false);
  const [ouverte, setOuverte] = useState(null);

  async function charger(reinit) {
    setCharge(true);
    const avant = !reinit && fiches.length ? `&avant=${encodeURIComponent(fiches.at(-1).publiee_le)}` : '';
    const filtre = type === 'suivis' ? '&suivis=1' : type ? `&type=${type}` : '';
    const r = await fetch(`/api/communaute?vue=fil${filtre}${avant}`);
    const d = r.ok ? (await r.json()).fiches || [] : [];
    setFiches((l) => (reinit ? d : [...l, ...d]));
    setFin(d.length < 20);
    setCharge(false);
  }
  useEffect(() => { charger(true); }, [type]);

  const majLike = (id, r) => setFiches((l) => l.map((f) => (f.id === id ? { ...f, aime: r.aime, likes: r.likes } : f)));
  async function aimer(f) {
    majLike(f.id, { aime: !f.aime, likes: f.likes + (f.aime ? -1 : 1) });
    const r = await poster('/api/communaute', { id: f.id });
    if (r) majLike(f.id, r);
  }

  const puce = (actif) => ({ flex: '0 0 auto', minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 12px' });

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        <button type="button" className={!type ? 'btn' : 'btn alt'} style={puce()} onClick={() => setType('')}>Mes types</button>
        <button type="button" className={type === 'suivis' ? 'btn' : 'btn alt'} style={puce()} onClick={() => setType('suivis')}>Abonnements</button>
        {TYPES_COLORIAGE.filter((t) => visibles.includes(t.valeur)).map((t) => (
          <button key={t.valeur} type="button" className={type === t.valeur ? 'btn' : 'btn alt'} style={puce()} onClick={() => setType(t.valeur)}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
        {fiches.map((f) => (
          <div key={f.id} role="button" tabIndex={0} onClick={() => setOuverte(f.id)} onKeyDown={(e) => e.key === 'Enter' && setOuverte(f.id)}
            style={{ cursor: 'pointer', minWidth: 0, background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1 / 1', background: 'var(--carte)' }}>
              {f.img_size ? <img src={imagePage(f)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            </div>
            <div style={{ padding: '6px 8px' }}>
              <b style={{ display: 'block', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</b>
              {f.tome && (
                <small style={{ display: 'block', color: 'var(--texte-secondaire)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.tome}{f.page_no ? ` · p. ${f.page_no}` : ''}
                </small>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <Link href={`/membre/${f.auteur_id}`} onClick={(e) => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                  <Avatar x={f} taille={20} />
                  <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Pseudo x={f} /></small>
                </Link>
                <BoutonJaime aime={f.aime} likes={f.likes} onClick={() => aimer(f)} petit />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!charge && !fiches.length && (
        <p style={{ color: 'var(--texte-secondaire)', textAlign: 'center' }}>
          {type === 'suivis'
            ? "Les membres que tu suis n'ont rien publié pour l'instant. Touche le nom d'un membre pour voir son profil et le suivre."
            : 'Aucun coloriage publié pour l\'instant. Coche « Publier dans la communauté » dans une de tes fiches pour partager le tien !'}
        </p>
      )}
      {!fin && fiches.length > 0 && (
        <button type="button" className="btn alt" disabled={charge} onClick={() => charger(false)} style={{ width: '100%', marginTop: '10px', minHeight: '44px' }}>
          {charge ? 'Chargement…' : 'Voir plus'}
        </button>
      )}

      {ouverte && <FicheDetail id={ouverte} onFermer={() => setOuverte(null)} onLike={majLike} />}
    </>
  );
}
