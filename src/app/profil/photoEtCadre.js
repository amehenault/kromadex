'use client';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import Feuille from '@/components/Feuille';
import ChoixCadre from '@/components/ChoixCadre';
import PhotoProfil from './edit/photoProfil';

export default function PhotoEtCadre({ cadres, cadre, genre, children }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOuverte(true)} aria-label="Changer ma photo de profil et mon cadre"
        style={{ all: 'unset', cursor: 'pointer', position: 'relative', display: 'inline-flex', borderRadius: '50%' }}>
        {children}
        <span aria-hidden="true" style={{
          position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderRadius: '50%',
          background: 'var(--btn)', color: '#ffffff', border: '2px solid var(--fond-carte)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={12} />
        </span>
      </button>
      {ouverte && (
        <Feuille titre="Photo et cadre de profil" onFermer={() => setOuverte(false)}>
          <PhotoProfil />
          <ChoixCadre cadres={cadres} cadre={cadre} genre={genre} />
        </Feuille>
      )}
    </>
  );
}
