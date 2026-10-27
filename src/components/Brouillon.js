'use client';
import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

const appel = (method, corps) => fetch('/api/brouillons', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });

export function useBrouillon(cle, valeur, actif) {
  const [trouve, setTrouve] = useState(null);
  const pret = useRef(false);
  const dernier = useRef('');

  useEffect(() => {
    fetch(`/api/brouillons?cle=${cle}`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.brouillon) setTrouve(d.brouillon); pret.current = true; })
      .catch(() => { pret.current = true; });
  }, [cle]);

  useEffect(() => {
    if (!pret.current || trouve || !actif) return;
    const texte = JSON.stringify(valeur);
    if (texte === dernier.current) return;
    const minuteur = setTimeout(() => { dernier.current = texte; appel('PUT', { cle, donnees: valeur }).catch(() => {}); }, 1000);
    return () => clearTimeout(minuteur);
  }, [cle, valeur, actif, trouve]);

  return {
    trouve,
    reprendre() { const d = trouve?.donnees; setTrouve(null); dernier.current = JSON.stringify(d); return d; },
    async effacer() { setTrouve(null); dernier.current = ''; await appel('DELETE', { cle }).catch(() => {}); },
  };
}

export function BandeauBrouillon({ nom, brouillon, onReprendre }) {
  if (!brouillon.trouve) return null;
  const quand = new Date(brouillon.trouve.maj_le).toLocaleString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '2px solid var(--couleur-principale)', marginBottom: 'var(--espace-3)' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} aria-hidden="true" /> Brouillon {nom} retrouvé</b>
      <small style={{ color: 'var(--texte-secondaire)' }}>Enregistré automatiquement le {quand}.</small>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button type="button" className="btn" style={{ minHeight: '44px' }} onClick={() => onReprendre(brouillon.reprendre())}>Reprendre le brouillon</button>
        <button type="button" className="btn alt danger" style={{ minHeight: '44px' }}
          onClick={() => confirm('Supprimer ce brouillon ?') && brouillon.effacer()}>Supprimer</button>
      </div>
    </div>
  );
}
