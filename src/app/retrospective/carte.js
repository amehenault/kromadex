'use client';
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2 } from 'lucide-react';

const nomMois = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });

export default function CarteRetrospective({ donnees: d, nom }) {
  const carte = useRef(null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState('');

  async function image() {
    await Promise.all([...carte.current.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
    return toPng(carte.current, { cacheBust: true, pixelRatio: 3 });
  }
  async function partager() {
    setOccupe(true); setMessage('');
    try {
      const url = await image();
      const fichier = new File([await (await fetch(url)).blob()], `kromadex-retrospective-${d.annee}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: `Ma rétrospective Kromadex ${d.annee}` }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.download = fichier.name; a.href = url; a.click();
        setMessage('Image téléchargée : tu peux la publier sur Instagram.');
      }
    } catch {
      setMessage('Impossible de créer l’image, réessaie.');
    } finally {
      setOccupe(false);
    }
  }

  const stats = [
    [d.coloriages, `page${d.coloriages > 1 ? 's' : ''} coloriée${d.coloriages > 1 ? 's' : ''}`],
    [d.jours, `jour${d.jours > 1 ? 's' : ''} de coloriage`],
  ];
  const lignes = [
    ['Tome ou livre préféré', d.tome ? `${d.tome.tome} (${d.tome.n} page${d.tome.n > 1 ? 's' : ''})` : null],
    ['Crayon le plus utilisé', d.crayon ? d.crayon.num : null, d.crayon?.hex],
    ['Mois le plus actif', d.mois ? `${nomMois(d.mois.mois)} (${d.mois.n} page${d.mois.n > 1 ? 's' : ''})` : null],
  ].filter(([, v]) => v);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--espace-3)' }}>
        <div ref={carte} style={{
          width: '100%', maxWidth: '360px', aspectRatio: '4 / 5', boxSizing: 'border-box', padding: '24px 20px', borderRadius: '20px',
          background: 'linear-gradient(160deg, #ffa17a 0%, #ffc6a8 45%, #4bbca1 100%)', color: '#1d1d1d',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.svg" alt="" style={{ width: 40, height: 40 }} />
            <span style={{ minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '1.15rem', lineHeight: 1.1 }}>Ma rétrospective {d.annee}</b>
              {nom && <small style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{nom}</small>}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {stats.map(([n, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '14px', padding: '10px', textAlign: 'center' }}>
                <b style={{ display: 'block', fontSize: '2rem', lineHeight: 1 }}>{n}</b>
                <small style={{ fontWeight: 700 }}>{label}</small>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lignes.map(([label, valeur, hex]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '14px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {hex && <span aria-hidden="true" style={{ flex: '0 0 auto', width: 22, height: 22, borderRadius: '50%', background: hex, border: '1px solid rgba(0,0,0,0.15)' }} />}
                <span style={{ minWidth: 0 }}>
                  <small style={{ display: 'block', fontWeight: 700, opacity: 0.75 }}>{label}</small>
                  <b style={{ overflowWrap: 'anywhere', textTransform: label === 'Mois le plus actif' ? 'capitalize' : 'none' }}>{valeur}</b>
                </span>
              </div>
            ))}
            {!lignes.length && !d.coloriages && (
              <div style={{ background: 'rgba(255,255,255,0.82)', borderRadius: '14px', padding: '10px 12px' }}>Ta première page de l’année t’attend !</div>
            )}
          </div>
          <small style={{ textAlign: 'center', fontWeight: 800, letterSpacing: '0.04em' }}>kromadex.com</small>
        </div>
      </div>
      <button type="button" className="btn" disabled={occupe} onClick={partager}
        style={{ width: '100%', minHeight: '48px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Share2 size={18} aria-hidden="true" />
        {occupe ? 'Création de l’image…' : 'Partager ma rétrospective'}
      </button>
      {message && <p style={{ textAlign: 'center', fontWeight: 600 }}>{message}</p>}
    </>
  );
}
