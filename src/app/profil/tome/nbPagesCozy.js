'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Tome Cozy colo dont le nombre de coloriages est inconnu : n'importe qui peut le compléter
export default function NbPagesCozy({ tomeId }) {
  const router = useRouter();
  const [valeur, setValeur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function enregistrer() {
    const n = parseInt(valeur, 10);
    if (!(n >= 1 && n <= 500)) { setMessage('Entre un nombre entre 1 et 500'); return; }
    if (!confirm(`Ce livre contient ${n} coloriages ? Le nombre sera le même pour tout le monde.`)) return;
    setOccupe(true);
    const res = await fetch('/api/tomes/nb-pages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tomeId, nbPages: n }),
    });
    const d = await res.json().catch(() => ({}));
    setOccupe(false);
    if (res.ok) router.refresh();
    else setMessage(d.error || 'Erreur, réessaie.');
  }

  return (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <small style={{ fontWeight: 700 }}>Combien de coloriages contient ce livre ?</small>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input type="number" inputMode="numeric" min={1} max={500} value={valeur} placeholder="ex. 50"
          onChange={(e) => { setValeur(e.target.value); setMessage(''); }} style={{ flex: 1, minWidth: 0 }} />
        <button type="button" className="btn" disabled={occupe || !valeur} onClick={enregistrer} style={{ minHeight: '42px' }}>
          Enregistrer
        </button>
      </div>
      {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
    </div>
  );
}
