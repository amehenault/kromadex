'use client';
import { useEffect } from 'react';

// iPhone : Safari ignore parfois le blocage du zoom du viewport ; on bloque aussi le geste de pincement
export default function SansZoom() {
  useEffect(() => {
    const bloquer = (e) => e.preventDefault();
    document.addEventListener('gesturestart', bloquer);
    document.addEventListener('gesturechange', bloquer);
    return () => {
      document.removeEventListener('gesturestart', bloquer);
      document.removeEventListener('gesturechange', bloquer);
    };
  }, []);
  return null;
}
