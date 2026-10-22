'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Inscription from './Inscription';
import { POLITIQUE_CONFIDENTIALITE, CONDITIONS_UTILISATION, MENTIONS_LEGALES } from '@/lib/pagesLegales';

// Connexion, mot de passe oublié, et inscription (formulaire en 2 étapes)
export default function AuthForm() {
  const r = useRouter();
  const [mode, setMode] = useState('login');
  const [msg, setMsg] = useState('');
  const [envoye, setEnvoye] = useState(false); // mot de passe oublié : lien demandé
  const [busy, setBusy] = useState(false);

  function changer(m) { setMode(m); setMsg(''); setEnvoye(false); }

  async function envoyer(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    const res = await fetch('/api/auth/' + mode, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    if (res.ok && mode === 'oubli') { setEnvoye(true); setBusy(false); return; }
    if (res.ok) { r.replace('/'); r.refresh(); return; }
    setMsg((await res.json().catch(() => ({}))).error || 'Une erreur est survenue.');
    setBusy(false);
  }

  if (mode === 'register') return <Inscription onConnexion={() => changer('login')} />;

  const retour = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', padding: 0 };

  // Mot de passe oublié : flèche de retour, puis après l'envoi le rappel des courriels indésirables
  if (mode === 'oubli') {
    return (
      <form className="carte etroite" onSubmit={envoyer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <button type="button" className="btn alt" onClick={() => changer('login')} aria-label="Retour à la connexion" style={retour}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <h2 style={{ margin: 0 }}>Mot de passe oublié</h2>
        </div>
        {!envoye ? (
          <>
            <input name="email" type="email" placeholder="Courriel" autoComplete="email" required />
            <p className="erreur">{msg}</p>
            <button className="btn" disabled={busy} style={{ width: '100%' }}>Recevoir un lien</button>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              Si un compte existe avec ce courriel, un lien pour choisir un nouveau mot de passe va t’être envoyé. Il est valable 1 heure.
            </p>
            <p style={{ color: 'var(--texte-secondaire)' }}>
              Le courriel peut arriver dans tes courriels indésirables (spams) : pense à y jeter un œil.
            </p>
            <button type="button" className="btn" onClick={() => changer('login')} style={{ width: '100%' }}>
              Retourner à la page de connexion
            </button>
          </>
        )}
      </form>
    );
  }

  return (
    <form className="carte etroite" onSubmit={envoyer}>
      <h2>Connexion</h2>
      <input name="email" type="email" placeholder="Courriel" autoComplete="email" required />
      <input name="password" type="password" placeholder="Mot de passe" autoComplete="current-password" required />
      <p className="erreur">{msg}</p>
      <button className="btn" disabled={busy}>Se connecter</button>{' '}
      <button type="button" className="btn alt" onClick={() => changer('register')}>Nouveau compte</button>
      <button type="button" onClick={() => changer('oubli')}
        style={{ display: 'block', marginTop: 'var(--espace-3)', minHeight: '44px', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: 'inherit', textDecoration: 'underline', font: 'inherit' }}>
        Mot de passe oublié ?
      </button>
      {/* Pages légales du site kromadex.com, accessibles sans compte */}
      <small style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 'var(--espace-2)', color: 'var(--texte-secondaire)' }}>
        <a href={POLITIQUE_CONFIDENTIALITE} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Confidentialité</a>
        <a href={CONDITIONS_UTILISATION} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Conditions d’utilisation</a>
        <a href={MENTIONS_LEGALES} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Mentions légales</a>
      </small>
    </form>
  );
}
