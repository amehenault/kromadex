'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { GENRES } from '@/lib/titres';
import { PAYS } from '@/lib/pays';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { AGE_MINIMUM, CONDITIONS_UTILISATION, POLITIQUE_CONFIDENTIALITE } from '@/lib/pagesLegales';
import Deroulant from './Deroulant';

export default function Inscription({ onConnexion }) {
  const router = useRouter();
  const [etape, setEtape] = useState(1);
  const [f, setF] = useState({
    email: '', password: '', confirmation: '', pseudo: '', name: '', genre: '', pays: '', typesPratiques: [], typesVus: [],
  });
  const [pseudoEtat, setPseudoEtat] = useState(null);
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setMessage(''); };
  const basculer = (k, v) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  const differents = f.confirmation && f.password !== f.confirmation;
  const etape1Ok = /^\S+@\S+\.\S+$/.test(f.email) && f.password.length >= 8 && f.password === f.confirmation;

  useEffect(() => {
    const p = f.pseudo.trim().replace(/^@/, '');
    if (!p) { setPseudoEtat(null); return; }
    const minuteur = setTimeout(() => {
      fetch(`/api/user/pseudo?q=${encodeURIComponent(p)}`).then((r) => r.json()).then(setPseudoEtat).catch(() => {});
    }, 400);
    return () => clearTimeout(minuteur);
  }, [f.pseudo]);

  const etape2Ok = pseudoEtat?.libre && f.name.trim() && f.genre && f.pays && f.typesPratiques.length > 0;

  function continuer(e) {
    e.preventDefault();
    if (!etape1Ok) { setMessage(differents ? 'Les deux mots de passe ne sont pas identiques.' : 'Vérifie ton courriel et ton mot de passe (8 caractères minimum).'); return; }
    setEtape(2);
  }

  async function creer(e) {
    e.preventDefault();
    if (!etape2Ok) { setMessage('Il manque des informations : pseudo libre, nom, genre, pays et au moins un type de coloriage.'); return; }
    setOccupe(true); setMessage('');
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    if (res.ok) { router.replace('/'); router.refresh(); return; }
    const d = await res.json().catch(() => ({}));
    setMessage(d.error || 'Une erreur est survenue.');
    if (/courriel|mot de passe/i.test(d.error || '')) setEtape(1);
    setOccupe(false);
  }

  const champ = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600 };
  const aide = { color: 'var(--texte-secondaire)', fontWeight: 400 };
  const puce = (actif) => ({
    minHeight: '44px', padding: '8px 14px', borderRadius: '999px', fontSize: '0.9rem', cursor: 'pointer',
    border: actif ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)', background: actif ? 'var(--btn)' : 'var(--carte)',
    color: actif ? '#ffffff' : 'var(--texte-principal)', fontWeight: actif ? 'bold' : 'normal',
  });

  return (
    <form className="carte etroite" onSubmit={etape === 1 ? continuer : creer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)' }} noValidate>
      <div>
        <small style={{ color: 'var(--texte-secondaire)', fontWeight: 700 }}>Étape {etape} sur 2</small>
        <h2 style={{ margin: '2px 0 0' }}>{etape === 1 ? 'Créer mon compte' : 'Mon profil'}</h2>
      </div>

      {etape === 1 ? (
        <>
          <label style={champ}>Courriel
            <input type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} required />
          </label>
          <label style={champ}>Mot de passe
            <input type="password" autoComplete="new-password" minLength={8} value={f.password} onChange={(e) => set('password', e.target.value)} required />
            <small style={aide}>8 caractères minimum.</small>
          </label>
          <label style={champ}>Confirme ton mot de passe
            <input type="password" autoComplete="new-password" value={f.confirmation} onChange={(e) => set('confirmation', e.target.value)}
              aria-invalid={differents} required />
            {differents && <small style={{ color: 'var(--danger)' }}>Les deux mots de passe ne sont pas identiques.</small>}
            {etape1Ok && <small style={{ color: 'var(--accent-primaire)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={14} aria-hidden="true" /> Les mots de passe sont identiques.</small>}
          </label>
          <small style={aide}>
            Kromadex est réservé aux personnes de {AGE_MINIMUM} ans et plus. En créant ton compte, tu acceptes les{' '}
            <a href={CONDITIONS_UTILISATION} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>conditions d’utilisation</a>
            {' '}et la{' '}
            <a href={POLITIQUE_CONFIDENTIALITE} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>politique de confidentialité</a>.
          </small>
          {message && <p className="erreur" role="alert" style={{ margin: 0 }}>{message}</p>}
          <button className="btn" type="submit" style={{ minHeight: '48px', fontWeight: 700 }}>Continuer</button>
          <button type="button" className="btn alt" onClick={onConnexion} style={{ minHeight: '44px' }}>J’ai déjà un compte</button>
        </>
      ) : (
        <>
          <label style={champ}>Pseudo
            <input value={f.pseudo} onChange={(e) => set('pseudo', e.target.value)} maxLength={31} autoComplete="nickname" placeholder="ex. amelacreative"
              aria-invalid={pseudoEtat?.libre === false} required />
            <small style={aide}>C’est le nom que les autres coloristes verront. Tu pourras le changer plus tard.</small>
            {pseudoEtat && (
              <small role="status" style={{ color: pseudoEtat.libre ? 'var(--accent-primaire)' : 'var(--danger)' }}>
                {pseudoEtat.libre ? 'Ce pseudo est disponible' : pseudoEtat.erreur}
              </small>
            )}
          </label>
          <label style={champ}>Nom
            <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={60} autoComplete="name" required />
            <small style={aide}>Ton prénom ou ton nom, affiché sur ton profil au-dessus de ton pseudo. Il ne change pas quand tu changes de pseudo.</small>
          </label>
          <label style={champ}>Genre
            <Deroulant titre="Genre" value={f.genre} onChange={(v) => set('genre', v)}
              options={GENRES.map((g) => ({ valeur: g.valeur, label: g.label }))} />
            <small style={aide}>
              Sert seulement à accorder ton titre et ton rôle (ex. Gribouilleuse ou Gribouilleur, Cheffe ou Chef des coloristes).
            </small>
          </label>
          <label style={champ}>Pays ou région
            <Deroulant titre="Pays ou région" value={f.pays} onChange={(v) => set('pays', v)}
              options={PAYS.map((p) => ({ valeur: p.valeur, label: p.label }))} />
            <small style={aide}>Sert à afficher les heures dans ton fuseau horaire (fin des épreuves, des bingos, des combats…).</small>
          </label>
          <div style={champ}>
            Je fais du…
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TYPES_COLORIAGE.map((t) => (
                <button key={t.valeur} type="button" style={puce(f.typesPratiques.includes(t.valeur))} aria-pressed={f.typesPratiques.includes(t.valeur)}
                  onClick={() => basculer('typesPratiques', t.valeur)}>{t.label}</button>
              ))}
            </div>
            <small style={aide}>Choisis au moins un type. Ça adapte tes tomes, tes livres et les épreuves proposées.</small>
          </div>
          <div style={champ}>
            Je veux voir les… (facultatif)
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {TYPES_COLORIAGE.map((t) => (
                <button key={t.valeur} type="button" style={puce(f.typesVus.includes(t.valeur))} aria-pressed={f.typesVus.includes(t.valeur)}
                  onClick={() => basculer('typesVus', t.valeur)}>{t.label}</button>
              ))}
            </div>
            <small style={aide}>Les autres types sont cachés pour toi. Rien de coché : tu vois ce que tu fais.</small>
          </div>
          <small style={aide}>
            Tu pourras ajouter ta photo et ta biographie dans Paramètres. Ton pseudo, ton nom, ta photo et ta biographie sont visibles
            par les autres membres connectés de Kromadex (jamais ton courriel).
          </small>
          {message && <p className="erreur" role="alert" style={{ margin: 0 }}>{message}</p>}
          <button className="btn" type="submit" disabled={occupe} style={{ minHeight: '48px', fontWeight: 700 }}>
            {occupe ? 'Création…' : 'Créer mon compte'}
          </button>
          <button type="button" className="btn alt" onClick={() => { setEtape(1); setMessage(''); }} style={{ minHeight: '44px' }}>
            <ArrowLeft size={16} aria-hidden="true" /> Retour
          </button>
        </>
      )}
    </form>
  );
}
