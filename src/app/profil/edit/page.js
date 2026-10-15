'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function EditProfilPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('Mise à jour en cours...');

    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      setMessage('Modifications enregistrées !');
      setPassword('');
    } else {
      setMessage('Erreur lors de la mise à jour.');
    }
  }

  return (
    <div className="contenu" style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--espace-4)' }}>
      <div className="barre" style={{ marginBottom: 'var(--espace-4)' }}>
        <Link href="/profil" className="btn alt">← Annuler</Link>
        <h2>Modifier mes accès</h2>
      </div>

      <form onSubmit={handleSubmit} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)' }}>
        <label>
          Nouveau courriel
          <input 
            type="email" 
            placeholder="Changer le courriel" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </label>

        <label>
          Nouveau mot de passe
          <input 
            type="password" 
            placeholder="Nouveau mot de passe" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </label>

        <button type="submit" className="btn">Sauvegarder</button>
        {message && <p style={{ marginTop: 'var(--espace-2)', textAlign: 'center' }}>{message}</p>}
      </form>
    </div>
  );
}