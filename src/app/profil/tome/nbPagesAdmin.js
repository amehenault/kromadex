'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Admin : corriger le nombre de coloriages d'un tome du catalogue
export default function NbPagesAdmin({ tomeId, actuel }) {
  const router = useRouter();
  const [valeur, setValeur] = useState(actuel ?? '');
  const [message, setMessage] = useState('');

  async function enregistrer() {
    const res = await fetch('/api/tomes/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tomeId, nbPages: valeur }),
    });
    setMessage(res.ok ? 'Enregistré ✓' : 'Erreur');
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
      <small style={{ color: 'var(--texte-secondaire)' }}>Admin · coloriages :</small>
      <input type="number" inputMode="numeric" min={1} value={valeur} onChange={(e) => setValeur(e.target.value)} style={{ width: '70px' }} />
      <button type="button" className="btn alt" onClick={enregistrer} style={{ minHeight: '36px', fontSize: '0.8rem' }}>OK</button>
      {message && <small>{message}</small>}
    </div>
  );
}
