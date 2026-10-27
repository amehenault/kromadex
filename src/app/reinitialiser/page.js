'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function Formulaire() {
  const jeton = useSearchParams().get('jeton') || '';
  const [msg, setMsg] = useState('');
  const [fait, setFait] = useState(false);
  const [busy, setBusy] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (f.password !== f.confirmation) { setMsg('Les deux mots de passe ne sont pas identiques.'); return; }
    setBusy(true); setMsg('');
    const res = await fetch('/api/auth/reinitialiser', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jeton, password: f.password }),
    });
    setBusy(false);
    if (res.ok) setFait(true);
    else setMsg((await res.json().catch(() => ({}))).error || 'Une erreur est survenue.');
  }

  if (fait) {
    return (
      <div className="carte etroite">
        <h2>Mot de passe changé</h2>
        <p>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Link href="/login" className="btn">Se connecter</Link>
      </div>
    );
  }
  return (
    <form className="carte etroite" onSubmit={envoyer}>
      <h2>Nouveau mot de passe</h2>
      <input name="password" type="password" placeholder="Nouveau mot de passe (8 caractères minimum)" autoComplete="new-password" minLength={8} required />
      <input name="confirmation" type="password" placeholder="Confirmer le mot de passe" autoComplete="new-password" minLength={8} required />
      <p className="erreur">{msg}</p>
      <button className="btn" disabled={busy || !jeton}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      {!jeton && <p className="erreur">Ce lien est incomplet. Refais une demande depuis la page de connexion.</p>}
    </form>
  );
}

export default function ReinitialiserPage() {
  return <Suspense fallback={null}><Formulaire /></Suspense>;
}
