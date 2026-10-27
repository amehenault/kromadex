'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar, BoutonJaime, imagePage, poster } from './outils';
import FicheDetail from './ficheDetail';
import { CartePublication, PublicationDetail, aimerPublication } from './publications';
import Pseudo from '@/components/Pseudo';

const quand = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

export default function FilActualites() {
  const [suivis, setSuivis] = useState(false);
  const [fil, setFil] = useState([]);
  const [fin, setFin] = useState(false);
  const [charge, setCharge] = useState(false);
  const [fiche, setFiche] = useState(null);
  const [publication, setPublication] = useState(null);

  async function charger(reinit) {
    setCharge(true);
    const avant = !reinit && fil.length ? `&avant=${encodeURIComponent(fil.at(-1).date)}` : '';
    const r = await fetch(`/api/publications?vue=fil${suivis ? '&suivis=1' : ''}${avant}`);
    const d = r.ok ? (await r.json()).fil || [] : [];
    setFil((l) => (reinit ? d : [...l, ...d]));
    setFin(d.length < 20);
    setCharge(false);
  }
  useEffect(() => { charger(true); }, [suivis]);

  const maj = (sorte) => (id, champs) => setFil((l) => l.map((x) => (x.sorte === sorte && x.id === id ? { ...x, ...champs } : x)));
  async function aimerColoriage(f) {
    maj('coloriage')(f.id, { aime: !f.aime, likes: f.likes + (f.aime ? -1 : 1) });
    const r = await poster('/api/communaute', { id: f.id });
    if (r) maj('coloriage')(f.id, r);
  }

  const puce = { flex: '0 0 auto', minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 12px' };

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        <button type="button" className={!suivis ? 'btn' : 'btn alt'} style={puce} onClick={() => setSuivis(false)}>Tout</button>
        <button type="button" className={suivis ? 'btn' : 'btn alt'} style={puce} onClick={() => setSuivis(true)}>Abonnements</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {fil.map((x) => (x.sorte === 'publication'
          ? <CartePublication key={`p${x.id}`} p={x} onOuvrir={setPublication} onLike={(p) => aimerPublication(p, maj('publication'))} />
          : (
            <div key={`c${x.id}`} role="button" tabIndex={0} onClick={() => setFiche(x.id)} onKeyDown={(e) => e.key === 'Enter' && setFiche(x.id)}
              style={{ cursor: 'pointer', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Link href={`/membre/${x.auteur_id}`} onClick={(e) => e.stopPropagation()} aria-label="Voir le profil"><Avatar x={x} taille={28} /></Link>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <small style={{ display: 'block' }}><Pseudo x={x} /></small>
                  <small style={{ color: 'var(--texte-secondaire)' }}>Coloriage terminé · {quand(x.date)}</small>
                </span>
              </div>
              {x.img_size ? (
                <div style={{ borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', aspectRatio: '4 / 3' }}>
                  <img src={imagePage(x)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : null}
              <small style={{ overflowWrap: 'anywhere' }}><b>{x.title}</b>{x.tome ? ` · ${x.tome}` : ''}{x.page_no ? `, p. ${x.page_no}` : ''}</small>
              <div><BoutonJaime aime={x.aime} likes={x.likes} onClick={() => aimerColoriage(x)} petit /></div>
            </div>
          )))}
      </div>

      {!charge && !fil.length && (
        <p style={{ color: 'var(--texte-secondaire)', textAlign: 'center' }}>
          {suivis ? 'Les membres que tu suis n’ont encore rien publié.' : 'Rien pour l’instant. Pose une question ou partage un coloriage !'}
        </p>
      )}
      {!fin && fil.length > 0 && (
        <button type="button" className="btn alt" disabled={charge} onClick={() => charger(false)} style={{ width: '100%', marginTop: '10px', minHeight: '44px' }}>
          {charge ? 'Chargement…' : 'Voir plus'}
        </button>
      )}

      {fiche && <FicheDetail id={fiche} onFermer={() => setFiche(null)} onLike={maj('coloriage')} />}
      {publication && (
        <PublicationDetail id={publication} onFermer={() => setPublication(null)} onMaj={maj('publication')}
          onRetiree={(id) => setFil((l) => l.filter((x) => !(x.sorte === 'publication' && x.id === id)))} />
      )}
    </>
  );
}
