'use client';
import { useEffect } from 'react';

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
