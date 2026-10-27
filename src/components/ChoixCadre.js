'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Frame, Lock } from 'lucide-react';
import { CADRES, nomCadre, conditionCadre } from '@/lib/cadres';
import PhotoCadre from './PhotoCadre';

const enregistrer = (corps) => fetch('/api/user/parametres', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
}).then((r) => r.ok);

export default function ChoixCadre({ cadres, cadre: cadreInitial, genre }) {
  const router = useRouter();
  const [cadre, setCadre] = useState(cadreInitial || cadres[0] || 'aucun');

  async function choisirCadre(c) {
    const avant = cadre;
    setCadre(c);
    if (await enregistrer({ cadre: c })) router.refresh(); else setCadre(avant);
  }

  return (
    <section className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Frame size={20} aria-hidden="true" /> Cadre de profil</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
        {['aucun', ...Object.keys(CADRES)].map((c) => {
          const libre = c === 'aucun' || cadres.includes(c);
          const choisi = libre && cadre === c;
          return (
            <button key={c} type="button" onClick={() => libre && choisirCadre(c)} aria-pressed={choisi} aria-disabled={!libre}
              className={choisi ? 'btn' : 'btn alt'}
              style={{ position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', gap: '8px', padding: '16px 8px', minHeight: '120px', fontSize: '0.8rem', minWidth: 0, cursor: libre ? 'pointer' : 'default' }}>
              <span style={{ filter: libre ? 'none' : 'grayscale(1)', opacity: libre ? 1 : 0.45, display: 'inline-flex' }}>
                <PhotoCadre cadre={c === 'aucun' ? null : c} taille={40}>
                  {(t) => <span style={{ width: t, height: t, borderRadius: '50%', background: 'var(--carte)', display: 'block' }} />}
                </PhotoCadre>
              </span>
              {!libre && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex' }} aria-hidden="true">
                  <Lock size={16} />
                </span>
              )}
              <b style={{ fontSize: '0.8rem', overflowWrap: 'anywhere' }}>{c === 'aucun' ? 'Sans cadre' : nomCadre(c, genre)}</b>
              {!libre && (
                <small style={{ fontWeight: 400, fontSize: '0.72rem', color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>
                  {conditionCadre(c, genre)}
                </small>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
