'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const r = useRouter();
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function envoyer(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    const res = await fetch('/api/auth/' + mode, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    if (res.ok) { r.replace('/'); r.refresh(); return; }
    setMsg((await res.json().catch(() => ({}))).error || 'Une erreur est survenue.');
    setBusy(false);
  }
  return (
    <form className="carte etroite" onSubmit={envoyer}>
      <h2>{mode === 'login' ? 'Connexion' : 'Créer mon compte'}</h2>
      <input name="email" type="email" placeholder="Courriel" autoComplete="email" required />
      <input name="password" type="password" placeholder="Mot de passe (8 caractères minimum)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
      <p className="erreur">{msg}</p>
      <button className="btn" disabled={busy}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>{' '}
      <button type="button" className="btn alt" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Nouveau compte' : 'J\u2019ai déjà un compte'}
      </button>
    </form>
  );
}
