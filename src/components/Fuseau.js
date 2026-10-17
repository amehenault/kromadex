'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { FUSEAU_REF, texteTempsRestant, formaterInstant } from '@/lib/temps';

// Fuseau horaire de la personne (selon le pays de son profil), disponible dans tous les écrans
const ContexteFuseau = createContext(FUSEAU_REF);
export function FuseauProvider({ fuseau, children }) {
  return <ContexteFuseau.Provider value={fuseau || FUSEAU_REF}>{children}</ContexteFuseau.Provider>;
}
export const useFuseau = () => useContext(ContexteFuseau);

// Temps restant avant la fin (jours, puis heures et minutes sous 24 h), mis à jour chaque minute,
// avec la date et l'heure de fin dans le fuseau de la personne
export function TempsRestant({ fin, style }) {
  const fuseau = useFuseau();
  const [maintenant, setMaintenant] = useState(null);

  useEffect(() => {
    setMaintenant(Date.now());
    const minuterie = setInterval(() => setMaintenant(Date.now()), 60000);
    return () => clearInterval(minuterie);
  }, []);

  if (!fin || maintenant === null) return null;
  const restant = new Date(fin).getTime() - maintenant;
  const urgent = restant > 0 && restant < 86400000;
  return (
    <small style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: urgent ? 'var(--danger)' : 'var(--texte-secondaire)', ...style }}>
      <Clock size={14} aria-hidden="true" />
      <span>
        {texteTempsRestant(fin, maintenant)}
        {restant > 0 && <span style={{ fontWeight: 400 }}> · fin le {formaterInstant(fin, fuseau)}</span>}
      </span>
    </small>
  );
}
