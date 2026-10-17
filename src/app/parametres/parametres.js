'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Frame, Crown, PlayCircle, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import NotificationsAppareil from '@/components/NotificationsAppareil';
import PhotoProfil from '@/app/profil/edit/photoProfil';
import APropos from '@/app/profil/edit/apropos';
import Preferences from '@/app/profil/edit/preferences';
import Acces from '@/app/profil/edit/acces';
import { CADRES, styleCadre } from '@/lib/cadres';

const enregistrer = (corps) => fetch('/api/user/parametres', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
}).then((r) => r.ok);

// Paramètres : tout ce qu'une personne peut régler, au même endroit
export default function Parametres({ clePublique, types, notifs: initiales, cadres, cadre: cadreInitial }) {
  const router = useRouter();
  const [notifs, setNotifs] = useState(initiales);
  const [cadre, setCadre] = useState(cadreInitial || cadres[0] || 'aucun');

  async function basculer(cle, v) {
    setNotifs((n) => ({ ...n, [cle]: v }));
    if (!(await enregistrer({ notifs: { [cle]: v } }))) setNotifs((n) => ({ ...n, [cle]: !v }));
  }
  async function choisirCadre(c) {
    const avant = cadre;
    setCadre(c);
    if (await enregistrer({ cadre: c })) router.refresh(); else setCadre(avant);
  }
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const carte = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)' };
  const titre = { margin: 0, display: 'flex', alignItems: 'center', gap: '8px' };
  const ligne = { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '48px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' };
  const lien = { ...ligne, color: 'inherit', textDecoration: 'none', borderTop: '1px solid var(--bordure-carte)' };

  return (
    <div className="contenu edition-profil" style={{ maxWidth: '500px', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ marginBottom: 'var(--espace-3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Paramètres</h2>
      </div>

      {/* Notifications : l'appareil, puis chaque type */}
      <section className="carte" style={carte}>
        <h3 style={titre}><Bell size={20} aria-hidden="true" /> Notifications</h3>
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

      <PhotoProfil />

      {/* Cadre autour de la photo de profil, parmi ceux débloqués */}
      {cadres.length > 0 && (
        <section className="carte" style={carte}>
          <h3 style={titre}><Frame size={20} aria-hidden="true" /> Cadre de profil</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
            {[...cadres, 'aucun'].map((c) => (
              <button key={c} type="button" onClick={() => choisirCadre(c)} aria-pressed={cadre === c}
                className={cadre === c ? 'btn' : 'btn alt'}
                style={{ flexDirection: 'column', gap: '12px', padding: '16px 8px', minHeight: '120px', fontSize: '0.8rem', minWidth: 0 }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--carte)', ...(c === 'aucun' ? {} : styleCadre(c)) }} />
                {c === 'aucun' ? 'Sans cadre' : CADRES[c].nom}
              </button>
            ))}
          </div>
        </section>
      )}

      <APropos />
      <Preferences />
      <Acces />

      {/* Le reste : abonnement, présentation, aide, déconnexion */}
      <section className="carte" style={{ ...carte, gap: 0 }}>
        <Link href="/kromadex-plus" style={{ ...lien, borderTop: 'none' }}>
          <Crown size={20} aria-hidden="true" /> <span style={{ flex: 1 }}>Kromadex+ et mon abonnement</span> <ChevronRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/?tutoriel=1" style={lien}>
          <PlayCircle size={20} aria-hidden="true" /> <span style={{ flex: 1 }}>Revoir la présentation de Kromadex</span> <ChevronRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/aide" style={lien}>
          <HelpCircle size={20} aria-hidden="true" /> <span style={{ flex: 1 }}>Aide et demandes</span> <ChevronRight size={18} aria-hidden="true" />
        </Link>
        <button type="button" onClick={sortir} style={{ all: 'unset', boxSizing: 'border-box', ...lien, width: '100%', color: 'var(--danger)' }}>
          <LogOut size={20} aria-hidden="true" /> <span style={{ flex: 1 }}>Déconnexion</span>
        </button>
      </section>
    </div>
  );
}
