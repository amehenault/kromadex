'use client';

import { useState } from 'react';
import Link from 'next/link';
import Preferences from './preferences';
import PhotoProfil from './photoProfil';
import APropos from './apropos';
import { ArrowLeft } from 'lucide-react';

export default function EditProfilPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actuel, setActuel] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('Mise à jour en cours...');

    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        actuel,
      }),
    });

    if (res.ok) {
      setMessage('Modifications enregistrées !');
      setEmail('');
      setPassword('');
      setActuel('');
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage(d.error || 'Erreur lors de la mise à jour.');
    }
  }

  return (
    <div
      className="contenu edition-profil"
      style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: 'var(--espace-3)',
      }}
    >
      <div
        style={{
          marginBottom: 'var(--espace-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Link
          href="/profil"
          className="btn alt"
          aria-label="Retour au profil"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>

        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
          Modifier mon profil
        </h2>
      </div>

      <PhotoProfil />

      <APropos />

      <Preferences />

      <form
        onSubmit={handleSubmit}
        className="carte"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--espace-3)',
        }}
      >
        <h3 style={{ margin: 0 }}>Mes accès</h3>

        <label>
          Nouveau courriel
          <input
            type="email"
            autoComplete="email"
            placeholder="Changer le courriel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Nouveau mot de passe
          <input
            type="password"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label>
          Mot de passe actuel *
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Pour confirmer que c'est bien toi"
            value={actuel}
            onChange={(e) => setActuel(e.target.value)}
          />
        </label>

        <button type="submit" className="btn btn-corail">
          Sauvegarder
        </button>

        {message && (
          <p
            style={{
              marginTop: 'var(--espace-2)',
              textAlign: 'center',
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}