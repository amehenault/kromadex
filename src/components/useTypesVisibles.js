'use client';
import { useEffect, useState } from 'react';
import { VALEURS_TYPES } from '@/lib/typesColoriage';

export default function useTypesVisibles() {
  const [visibles, setVisibles] = useState(VALEURS_TYPES);
  useEffect(() => {
    fetch('/api/user/preferences').then((r) => (r.ok ? r.json() : null))
      .then((p) => p?.typesVisibles && setVisibles(p.typesVisibles)).catch(() => {});
  }, []);
  return visibles;
}
