'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Newspaper, HelpCircle, Brush, Images, Palette } from 'lucide-react';
import FilActualites from './filActualites';
import Publications from './publications';
import Termines from './termines';
import CodesCouleurs from './codesCouleurs';

// Communauté en 4 sections (fil d'actualités, questions, coloriages en cours, coloriages terminés),
// plus la recherche de codes couleurs. On publie directement depuis chaque section (les missives ont leur page).
const ONGLETS = [
  ['fil', 'Fil d’actualités', Newspaper],
  ['questions', 'Questions', HelpCircle],
  ['en_cours', 'Coloriages en cours', Brush],
  ['termines', 'Coloriages terminés', Images],
  ['codes', 'Codes couleurs', Palette],
];

export default function Communaute({ monId, integre }) {
  const [onglet, setOnglet] = useState('fil');

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: integre ? 0 : 'var(--espace-3)' }}>
      {!integre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Communauté</h2>
        </div>
      )}

      {/* Sections : 3 par rangée, les mots passent à la ligne entiers */}
      <div role="tablist" aria-label="Communauté" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} onClick={() => setOnglet(cle)} className={onglet === cle ? 'btn' : 'btn alt'}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
              minHeight: '54px', padding: '6px 4px', fontSize: '0.78rem', lineHeight: 1.2, minWidth: 0, overflowWrap: 'normal', wordBreak: 'normal',
            }}>
            <Icone size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {onglet === 'fil' && <FilActualites />}
      {onglet === 'questions' && <Publications genre="question" />}
      {onglet === 'en_cours' && <Publications genre="en_cours" />}
      {onglet === 'termines' && <Termines />}
      {onglet === 'codes' && <CodesCouleurs />}
    </div>
  );
}
