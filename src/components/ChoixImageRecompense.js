'use client';
import { Check } from 'lucide-react';
import IMAGES from '@/lib/manifesteRecompenses.json';
import { imagesDe } from '@/lib/recompenses';

// Images proposées : le dossier de l'activité (ex. recompenses-activites/prophetie) et les fichiers reconnus pour cette récompense.
export function imagesProposees(dossier, genre) {
  const liste = [...IMAGES.filter((i) => i.chemin.startsWith(`/recompenses-activites/${dossier}/`)), ...imagesDe(genre)];
  return liste.filter((i, n) => liste.findIndex((x) => x.chemin === i.chemin) === n);
}

const nomLisible = (fichier) => fichier.replace(/\.[a-z0-9]+$/i, '').replace(/^kromadex-/, '').replace(/[-_]+/g, ' ');

export default function ChoixImageRecompense({ dossier, genre, valeur, onChange }) {
  const images = imagesProposees(dossier, genre);
  const tuile = (actif) => ({
    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', minWidth: 0, minHeight: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '6px', borderRadius: 'var(--rayon-m)', background: 'var(--fond-carte)', textAlign: 'center', position: 'relative',
    border: actif ? '3px solid var(--btn)' : '1px solid var(--bordure-carte)',
  });
  const coche = <span style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'var(--btn)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} aria-hidden="true" /></span>;

  if (!images.length) {
    return <small style={{ color: 'var(--texte-secondaire)' }}>Aucune image dans public/recompenses-activites/{dossier} pour l’instant : dépose un fichier dans ce dossier, il apparaîtra ici au prochain déploiement.</small>;
  }
  return (
    <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
      <button type="button" role="radio" aria-checked={!valeur} onClick={() => onChange('')} style={tuile(!valeur)}>
        <img src={images[0].chemin} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain' }} />
        <small style={{ fontWeight: 700, fontSize: '0.75rem' }}>Par défaut</small>
        {!valeur && coche}
      </button>
      {images.map((i) => {
        const actif = valeur === i.fichier;
        return (
          <button key={i.chemin} type="button" role="radio" aria-checked={actif} onClick={() => onChange(i.fichier)} style={tuile(actif)}>
            <img src={i.chemin} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain' }} />
            <small style={{ fontSize: '0.75rem', overflowWrap: 'anywhere', textTransform: 'capitalize' }}>{nomLisible(i.fichier)}</small>
            {actif && coche}
          </button>
        );
      })}
    </div>
  );
}
