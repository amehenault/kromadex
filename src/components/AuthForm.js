'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GENRES } from '@/lib/titres';

const TITRES = { login: 'Connexion', register: 'Créer mon compte', oubli: 'Mot de passe oublié' };
const ACTIONS = { login: 'Se connecter', register: 'Créer mon compte', oubli: 'Recevoir un lien' };

export default function AuthForm() {
  const r = useRouter();
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function changer(m) { setMode(m); setMsg(''); setInfo(''); }

  async function envoyer(e) {
    e.preventDefault(); setBusy(true); setMsg(''); setInfo('');
    const res = await fetch('/api/auth/' + mode, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    if (res.ok && mode === 'oubli') {
      setInfo('Si un compte existe avec ce courriel, un lien pour choisir un nouveau mot de passe va t’être envoyé. Il est valable 1 heure. Tu ne le vois pas d’ici quelques minutes ? Regarde dans tes courriels indésirables (spams).');
      setBusy(false);
      return;
    }
    if (res.ok) { r.replace('/'); r.refresh(); return; }
    setMsg((await res.json().catch(() => ({}))).error || 'Une erreur est survenue.');
    setBusy(false);
  }

  return (
    <form className="carte etroite" onSubmit={envoyer}>
      <h2>{TITRES[mode]}</h2>
      <input name="email" type="email" placeholder="Courriel" autoComplete="email" required />
      {mode === 'oubli' && !info && (
        <small style={{ display: 'block', color: 'var(--texte-secondaire)', marginBottom: 'var(--espace-2)' }}>
          Le courriel peut arriver dans tes courriels indésirables (spams) : pense à y jeter un œil.
        </small>
      )}
      {mode !== 'oubli' && (
        <input name="password" type="password" placeholder="Mot de passe (8 caractères minimum)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required />
      )}
      {mode === 'register' && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          Genre
          <select name="genre" defaultValue="feminin">
            {GENRES.map((g) => <option key={g.valeur} value={g.valeur}>{g.label}</option>)}
          </select>
          <small style={{ color: 'var(--texte-secondaire)' }}>
            Sert seulement à accorder ton titre (ex. Gribouilleuse ou Gribouilleur). Non-binaire et Autre utilisent la forme masculine.
          </small>
        </label>
      )}
      <p className="erreur">{msg}</p>
      {info && <p style={{ marginTop: 0 }}>{info}</p>}
      <button className="btn" disabled={busy}>{ACTIONS[mode]}</button>{' '}
      <button type="button" className="btn alt" onClick={() => changer(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Nouveau compte' : 'J’ai déjà un compte'}
      </button>
      {mode === 'login' && (
        <button type="button" onClick={() => changer('oubli')}
          style={{ display: 'block', marginTop: 'var(--espace-3)', minHeight: '44px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline', font: 'inherit' }}>
          Mot de passe oublié ?
        </button>
      )}
    </form>
  );
}
