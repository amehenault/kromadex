'use client';
import { useCallback, useEffect, useRef } from 'react';

export function useGardeQuitter(actif, message) {
  const actifRef = useRef(actif);
  const libre = useRef(false);
  actifRef.current = actif;
  const garde = () => actifRef.current && !libre.current;

  const confirmer = useCallback(() => !garde() || window.confirm(message), [message]);
  const liberer = useCallback(() => { libre.current = true; }, []);

  useEffect(() => {
    const avantDeQuitter = (e) => {
      if (!garde()) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    const clic = (e) => {
      if (!garde() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = e.target.closest?.('a[href]');
      if (!lien || lien.target === '_blank' || lien.hasAttribute('download')) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm(message)) { e.preventDefault(); e.stopPropagation(); }
      else libre.current = true;
    };

    const etat = { ...(window.history.state || {}), gardeKromadex: true };
    window.history.pushState(etat, '', window.location.href);
    const retour = () => {
      if (!garde()) { window.removeEventListener('popstate', retour); window.history.back(); return; }
      if (window.confirm(message)) {
        libre.current = true;
        window.removeEventListener('popstate', retour);
        window.history.back();
      } else {
        window.history.pushState(etat, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', avantDeQuitter);
    document.addEventListener('click', clic, true);
    window.addEventListener('popstate', retour);
    return () => {
      window.removeEventListener('beforeunload', avantDeQuitter);
      document.removeEventListener('click', clic, true);
      window.removeEventListener('popstate', retour);
    };
  }, []);

  return { confirmer, liberer };
}
