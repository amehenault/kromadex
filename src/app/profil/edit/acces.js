'use client';
import { useState } from 'react';

// Changer son courriel et/ou son mot de passe (mot de passe actuel exigé)
export default function Acces() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actuel, setActuel] = useState('');
  const [message, setMessage] = useState('');

  async function enregistrer(e) {
    e.preventDefault();
    setMessage('Mise à jour en cours…');
    const res = await fetch('/api/user/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, actuel }),
    });
    if (res.ok) {
      setMessage('Modifications enregistrées !');
      setEmail(''); setPassword(''); setActuel('');
    } else {
      setMessage((await res.json().catch(() => ({}))).error || 'Erreur lors de la mise à jour.');
    }
  }

  return (
    <form onSubmit={enregistrer} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)', marginBottom: 'var(--espace-3)' }}>
      <h3 style={{ margin: 0 }}>Courriel et mot de passe</h3>
      <label>Nouveau courriel
        <input type="email" autoComplete="email" placeholder="Changer le courriel" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>Nouveau mot de passe
        <input type="password" autoComplete="new-password" placeholder="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>Mot de passe actuel *
        <input type="password" required autoComplete="current-password" placeholder="Pour confirmer que c'est bien toi" value={actuel} onChange={(e) => setActuel(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-corail">Sauvegarder</button>
      {message && <p style={{ margin: 0, textAlign: 'center' }}>{message}</p>}
    </form>
  );
}
