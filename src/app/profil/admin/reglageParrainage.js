'use client';
import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { envoyer, colonne, aide } from './outils';

export default function ReglageParrainage() {
  const [actif, setActif] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/reglages').then((r) => (r.ok ? r.json() : null)).then((d) => setActif(!!d?.reglages?.parrainage_actif)).catch(() => setActif(false));
  }, []);

  async function changer(valeur) {
    const avant = actif;
    setActif(valeur); setMessage('');
    const r = await envoyer('/api/reglages', 'POST', { cle: 'parrainage_actif', valeur });
    if (!r.ok) { setActif(avant); setMessage(r.error); return; }
    setMessage(valeur ? 'Le parrainage est activé : les membres voient leur lien d’invitation.' : 'Le parrainage est désactivé : le lien d’invitation est caché.');
  }

  const option = (valeur, label) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px', cursor: 'pointer', fontWeight: actif === valeur ? 700 : 400 }}>
      <input type="radio" name="parrainage" checked={actif === valeur} disabled={actif === null} onChange={() => changer(valeur)} style={{ width: 22, height: 22 }} />
      {label}
    </label>
  );

  return (
    <div className="carte" style={colonne}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HeartHandshake size={18} aria-hidden="true" /> Parrainage</b>
      <p style={aide}>Affiche ou cache le bloc Inviter une amie et le lien d’invitation dans le profil des membres.</p>
      <div role="radiogroup" aria-label="Parrainage" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {option(false, 'Désactivé')}
        {option(true, 'Activé')}
      </div>
      {message && <small style={aide}>{message}</small>}
    </div>
  );
}
