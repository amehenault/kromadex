'use client';
import { X } from 'lucide-react';

// Feuille qui monte du bas de l'écran (mobile d'abord), fermée en touchant le fond ou le X
export default function Feuille({ titre, onFermer, children }) {
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '520px', maxHeight: '88dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <b style={{ fontSize: '1.05rem', overflowWrap: 'anywhere' }}>{titre}</b>
          <button type="button" className="btn alt" aria-label="Fermer" onClick={onFermer}
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
