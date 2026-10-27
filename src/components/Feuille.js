'use client';
import { X } from 'lucide-react';

export default function Feuille({ titre, onFermer, children, haute }) {
  return (
    <div className="fond-feuille" onClick={onFermer}>
      <div className={haute ? 'feuille haute' : 'feuille'} role="dialog" aria-modal="true" aria-label={titre} onClick={(e) => e.stopPropagation()}
        style={{ padding: 'var(--espace-3)', gap: '10px' }}>
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
