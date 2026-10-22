'use client';
import { useLayoutEffect, useRef, useState } from 'react';

// Texte toujours sur une seule ligne : la taille diminue (jusqu'à min) pour qu'il tienne dans la largeur disponible,
// au lieu de passer à la ligne. Recalculé quand le texte ou la largeur change (rotation du téléphone, etc.).
export default function TexteAjuste({ children, taille = 1, min = 0.6, style }) {
  const boite = useRef(null);
  const [rem, setRem] = useState(taille);

  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const ajuster = () => {
      let t = taille;
      el.style.fontSize = `${t}rem`;
      while (el.scrollWidth > el.clientWidth + 1 && t > min) {
        t = Math.max(min, +(t - 0.03).toFixed(2));
        el.style.fontSize = `${t}rem`;
      }
      setRem(t);
    };
    ajuster();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(ajuster) : null;
    obs?.observe(el.parentElement || el);
    return () => obs?.disconnect();
  }, [children, taille, min]);

  return (
    <span ref={boite} style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', minWidth: 0, ...style, fontSize: `${rem}rem` }}>
      {children}
    </span>
  );
}
