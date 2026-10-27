'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Fil from './fil';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import TexteErreur from '@/components/TexteErreur';
import useTypesVisibles from '@/components/useTypesVisibles';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';

export default function Termines() {
  const visibles = useTypesVisibles();
  const [choix, setChoix] = useState(false);
  const [coloriage, setColoriage] = useState(null);
  const [type, setType] = useState('');
  const [erreur, setErreur] = useState('');
  const [version, setVersion] = useState(0);

  function choisir(f) {
    setChoix(false);
    setColoriage(f);
    setType(f.type_coloriage || '');
    setErreur('');
  }

  async function publier() {
    const r = await fetch('/api/communaute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publier: coloriage.id, type }) });
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.'); return; }
    setColoriage(null);
    setVersion((v) => v + 1);
  }

  const types = TYPES_COLORIAGE.filter((t) => visibles.includes(t.valeur));
  return (
    <>
      <button type="button" className="btn" onClick={() => setChoix(true)}
        style={{ width: '100%', minHeight: '48px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
        <Plus size={18} aria-hidden="true" /> Publier un coloriage terminé
      </button>
      <Fil key={version} />

      {choix && (
        <ChoixColoriage titre="Quel coloriage veux-tu publier ?" nonPubliees avertissement={false}
          aide="Tes coloriages avec photo, pas encore publiés. Ta photo, le titre, le tome, la page et tes codes couleurs seront visibles ; ton mémo reste privé."
          onChoisir={choisir} onFermer={() => setChoix(false)} />
      )}
      {coloriage && (
        <Feuille titre="Publier dans la communauté" onFermer={() => setColoriage(null)}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <img src={`/api/pages/${coloriage.id}/image?s=${coloriage.img_size || 0}`} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--rayon-s)', flex: '0 0 auto' }} />
            <b style={{ overflowWrap: 'anywhere' }}>{coloriage.title || 'Sans titre'}{coloriage.page_no ? ` · p. ${coloriage.page_no}` : ''}</b>
          </div>
          <small style={{ color: 'var(--texte-secondaire)' }}>Type de coloriage</small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {types.map((t) => (
              <button key={t.valeur} type="button" onClick={() => setType(t.valeur)} className={type === t.valeur ? 'btn' : 'btn alt'}
                style={{ minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem' }}>{t.label}</button>
            ))}
          </div>
          {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
          <button type="button" className="btn" disabled={!type} onClick={publier} style={{ minHeight: '48px', fontWeight: 700 }}>Publier</button>
        </Feuille>
      )}
    </>
  );
}
