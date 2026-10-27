'use client';
import { createContext, useContext } from 'react';
import { accord } from '@/lib/genre';

const ContexteGenre = createContext('');

export function GenreProvider({ genre, children }) {
  return <ContexteGenre.Provider value={genre || ''}>{children}</ContexteGenre.Provider>;
}

export function useAccord() {
  const genre = useContext(ContexteGenre);
  return (feminin, masculin) => accord(genre, feminin, masculin);
}
