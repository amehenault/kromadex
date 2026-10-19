'use client';
import { createContext, useContext } from 'react';
import { accord } from '@/lib/genre';

// Genre de la personne connectée, fourni par le layout : sert à accorder les textes qui lui parlent
const ContexteGenre = createContext('');

export function GenreProvider({ genre, children }) {
  return <ContexteGenre.Provider value={genre || ''}>{children}</ContexteGenre.Provider>;
}

// a('inscrite', 'inscrit') : féminin, sauf si la personne a choisi « masculin »
export function useAccord() {
  const genre = useContext(ContexteGenre);
  return (feminin, masculin) => accord(genre, feminin, masculin);
}
