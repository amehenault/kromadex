'use client';
import { useCallback, useEffect, useRef } from 'react';

// Empêche de quitter une page par erreur quand son contenu n'est pas enregistré.
// Trois façons de partir sont couvertes :
//  - un lien de l'application (menu du bas, en-tête, boutons) : la question s'affiche avant de partir ;
//  - la touche Retour (téléphone ou navigateur) : une étape d'historique en plus permet de poser la question ;
//  - fermer l'onglet ou recharger : le navigateur affiche sa propre question (il n'accepte pas de texte personnalisé).
// actif : true tant qu'il y a du contenu non enregistré. Renvoie :
//  - confirmer() : pose la question (pour un bouton « Retour » de la page), true si on peut partir ;
//  - liberer() : à appeler juste avant de quitter volontairement (après Enregistrer ou Supprimer).
export function useGardeQuitter(actif, message) {
  const actifRef = useRef(actif);
  const libre = useRef(false);
  actifRef.current = actif;
  const garde = () => actifRef.current && !libre.current;

  const confirmer = useCallback(() => !garde() || window.confirm(message), [message]); // eslint-disable-line react-hooks/exhaustive-deps
  const liberer = useCallback(() => { libre.current = true; }, []);

  useEffect(() => {
    // Fermer l'onglet, recharger, quitter vers un autre site
    const avantDeQuitter = (e) => {
      if (!garde()) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    // Liens de l'application : on intercepte le clic avant la navigation
    const clic = (e) => {
      if (!garde() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = e.target.closest?.('a[href]');
      if (!lien || lien.target === '_blank' || lien.hasAttribute('download')) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm(message)) { e.preventDefault(); e.stopPropagation(); }
      else libre.current = true;
    };

    // Touche Retour : on ajoute une étape d'historique identique ; revenir dessus pose la question
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { confirmer, liberer };
}
