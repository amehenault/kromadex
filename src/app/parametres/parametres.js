'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Award, Trash2 } from 'lucide-react';
import NotificationsAppareil from '@/components/NotificationsAppareil';
import PhotoProfil from '@/app/profil/edit/photoProfil';
import APropos from '@/app/profil/edit/apropos';
import Preferences from '@/app/profil/edit/preferences';
import Acces from '@/app/profil/edit/acces';
import ChoixCadre from '@/components/ChoixCadre';
import { useAccord } from '@/components/Genre';
import Deroulant from '@/components/Deroulant';

const enregistrer = (corps) => fetch('/api/user/parametres', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
}).then((r) => r.ok);

const carte = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)' };
const titre_ = { margin: 0, display: 'flex', alignItems: 'center', gap: '8px' };
const ligne = { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '48px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' };

export function PageParametres({ titre, retour = '/parametres', children }) {
  return (
    <div className="contenu edition-profil" style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ marginBottom: 'var(--espace-3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href={retour} className="btn alt" aria-label={retour === '/profil' ? 'Retour au profil' : 'Retour aux Paramètres'} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{titre}</h2>
      </div>
      {children}
    </div>
  );
}

export function Notifications({ clePublique, types, notifs: initiales }) {
  const [notifs, setNotifs] = useState(initiales);
  async function basculer(cle, v) {
    setNotifs((n) => ({ ...n, [cle]: v }));
    if (!(await enregistrer({ notifs: { [cle]: v } }))) setNotifs((n) => ({ ...n, [cle]: !v }));
  }
  return (
    <section className="carte" style={carte}>
      <h3 style={titre_}><Bell size={20} aria-hidden="true" /> Notifications</h3>
      <NotificationsAppareil clePublique={clePublique} />
      <small style={{ color: 'var(--texte-secondaire)' }}>Choisis ce qui t’envoie une notification (sur chaque appareil activé) :</small>
      {types.map((t) => (
        <label key={t.cle} style={{ ...ligne, justifyContent: 'space-between' }}>
          <span style={{ minWidth: 0 }}>{t.label}</span>
          <input type="checkbox" checked={notifs[t.cle] !== false} onChange={(e) => basculer(t.cle, e.target.checked)}
            style={{ width: '22px', height: '22px', margin: 0, flex: '0 0 auto' }} />
        </label>
      ))}
    </section>
  );
}

export function TitreEtCadre({ cadres, cadre, genre, titre: titreInitial, titreActuel, titresNiveau = [], titres }) {
  const router = useRouter();
  const [titre, setTitre] = useState(titreInitial === 'Coloriste débutant' ? '' : titreInitial);
  async function choisirTitre(t) {
    const avant = titre;
    setTitre(t);
    if (await enregistrer({ titre: t })) router.refresh(); else setTitre(avant);
  }
  return (
    <>
      <section className="carte" style={carte}>
        <h3 style={titre_}><Award size={20} aria-hidden="true" /> Titre affiché</h3>
        <Deroulant ariaLabel="Titre affiché" value={titre} onChange={(v) => choisirTitre(v)}
          options={[
            { valeur: '', label: `Titre de mon niveau actuel : ${titreActuel}` },
            ...titresNiveau.map((t) => ({ valeur: t, label: t, groupe: 'Titres de niveau déjà atteints' })),
            ...titres.map((t) => ({ valeur: t, label: t, groupe: 'Titres spéciaux gagnés' })),
          ]} />
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Ce titre remplace celui de ton niveau sur ton profil. Gagne des épreuves et des activités pour débloquer des titres spéciaux.
        </small>
      </section>
      <ChoixCadre cadres={cadres} cadre={cadre} genre={genre} />
    </>
  );
}

export function MesInformations({ role }) {
  return (
    <>
      <PhotoProfil />
      <APropos />
      <Preferences />
      <Acces />
      <SupprimerCompte role={role} />
    </>
  );
}

function SupprimerCompte({ role }) {
  const router = useRouter();
  const acc = useAccord();
  const [ouvert, setOuvert] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);
  if (role === 'admin') return null;

  function demander() {
    if (confirm(`Es-tu ${acc('sûre', 'sûr')} de vouloir supprimer ton compte ? Tu perdras l’entièreté de tes données.`)) setOuvert(true);
  }
  async function supprimer(e) {
    e.preventDefault();
    setOccupe(true); setMessage('');
    const r = await fetch('/api/user/compte', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motDePasse }) });
    if (r.ok) { router.replace('/login'); router.refresh(); return; }
    setMessage((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.');
    setOccupe(false);
  }

  return (
    <section id="supprimer-compte" className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)', borderColor: 'var(--danger)' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}><Trash2 size={20} aria-hidden="true" /> Supprimer mon compte</h3>
      <small style={{ color: 'var(--texte-secondaire)' }}>
        Ton compte, tes coloriages, ta collection, tes XP, tes récompenses, tes commentaires, tes votes et tes demandes d’aide seront effacés.
        Restent, sans ton nom : les épreuves, missives et mots-clefs que tu as créés pour la communauté, et les résultats des activités passées des autres membres.
        Une copie déjà téléchargée ou une capture d’écran faite par quelqu’un d’autre ne peut pas être rappelée.
      </small>
      {!ouvert ? (
        <button type="button" className="btn alt danger" onClick={demander} style={{ minHeight: '48px' }}>Supprimer mon compte</button>
      ) : (
        <form onSubmit={supprimer} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Ton mot de passe, pour confirmer
            <input type="password" required autoComplete="current-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
          </label>
          <button type="submit" className="btn danger" disabled={occupe || !motDePasse} style={{ minHeight: '48px' }}>
            {occupe ? 'Suppression…' : 'Supprimer définitivement mon compte'}
          </button>
          <button type="button" className="btn alt" onClick={() => { setOuvert(false); setMotDePasse(''); setMessage(''); }} style={{ minHeight: '44px' }}>Annuler</button>
        </form>
      )}
      {message && <small role="alert" style={{ color: 'var(--danger)', fontWeight: 600 }}>{message}</small>}
    </section>
  );
}
