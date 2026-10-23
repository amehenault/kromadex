'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, ChevronRight, Pin, PinOff } from 'lucide-react';
import Feuille from './Feuille';
import { IconeQuantite, LigneRecompense } from './Recompense';
import { regrouperRecompenses, nomRecompense, MAX_EPINGLES } from '@/lib/recompenses';

const cle = (g) => `${g.genre}|${g.detail}`;

// Récompenses du profil : 6 badges (2 rangées de 3), et le détail complet avec « Voir plus ».
// La personne peut épingler les 6 badges de son choix ; sans épingle, Kromadex montre les 6 plus récents.
// vide : texte affiché quand il n'y a encore aucune récompense (sinon l'encadré est caché)
// epingles : clés des badges épinglés ; modifiable : la personne regarde son propre profil
export default function MesRecompenses({ recompenses, titre = 'Mes récompenses', vide, epingles: initiales = [], modifiable = false }) {
  const router = useRouter();
  const [tout, setTout] = useState(false);
  const [epingles, setEpingles] = useState(initiales);
  const [message, setMessage] = useState('');
  if (!recompenses?.length) {
    if (!vide) return null;
    return (
      <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre}</h3>
        <small style={{ color: 'var(--texte-secondaire)' }}>{vide}</small>
      </section>
    );
  }
  const groupes = regrouperRecompenses(recompenses);
  // Badges épinglés encore possédés, dans l'ordre choisi ; sinon les 6 plus récents
  const choisis = epingles.map((k) => groupes.find((g) => cle(g) === k)).filter(Boolean);
  const recents = [...groupes].sort((a, b) => new Date(b.cree_le || 0) - new Date(a.cree_le || 0));
  const affiches = (choisis.length ? choisis : recents).slice(0, MAX_EPINGLES);

  async function enregistrer(liste) {
    const avant = epingles;
    setEpingles(liste);
    setMessage('');
    const r = await fetch('/api/user/parametres', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ badges: liste }),
    });
    if (r.ok) router.refresh();
    else { setEpingles(avant); setMessage('Erreur, réessaie.'); }
  }
  function basculer(g) {
    const k = cle(g);
    if (epingles.includes(k)) return enregistrer(epingles.filter((x) => x !== k));
    if (choisis.length >= MAX_EPINGLES) { setMessage(`Tu peux épingler ${MAX_EPINGLES} badges au maximum. Retire une épingle d’abord.`); return; }
    enregistrer([...choisis.map(cle), k]);
  }

  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre}</h3>
        <button type="button" onClick={() => setTout(true)}
          style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem' }}>
          Voir plus <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 8px' }}>
        {affiches.map((g) => (
          <div key={cle(g)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center', minWidth: 0 }}>
            <IconeQuantite r={g} nombre={g.nombre} taille={56} />
            <small style={{ fontWeight: 600, overflowWrap: 'anywhere', fontSize: '0.75rem' }}>{nomRecompense(g, g.nombre)}</small>
          </div>
        ))}
      </div>
      {tout && (
        <Feuille titre={titre} onFermer={() => setTout(false)}>
          {modifiable && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <small style={{ color: 'var(--texte-secondaire)' }}>
                {choisis.length
                  ? `${choisis.length} / ${MAX_EPINGLES} badges épinglés sur ton profil.`
                  : `Kromadex affiche tes ${MAX_EPINGLES} badges les plus récents. Épingle jusqu’à ${MAX_EPINGLES} badges pour choisir toi-même.`}
              </small>
              {choisis.length > 0 && (
                <button type="button" className="btn alt" onClick={() => enregistrer([])} style={{ minHeight: '44px' }}>
                  Laisser Kromadex choisir (les {MAX_EPINGLES} plus récents)
                </button>
              )}
              {message && <small role="alert" style={{ color: 'var(--danger)', fontWeight: 600 }}>{message}</small>}
            </div>
          )}
          {groupes.map((g) => {
            const epingle = epingles.includes(cle(g));
            return (
              <div key={cle(g)} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}><LigneRecompense r={g} nombre={g.nombre} /></div>
                {modifiable && (
                  <button type="button" onClick={() => basculer(g)} aria-pressed={epingle}
                    aria-label={epingle ? `Retirer l’épingle : ${nomRecompense(g, g.nombre)}` : `Épingler : ${nomRecompense(g, g.nombre)}`}
                    className={epingle ? 'btn' : 'btn alt'}
                    style={{ minWidth: '44px', minHeight: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    {epingle ? <PinOff size={18} aria-hidden="true" /> : <Pin size={18} aria-hidden="true" />}
                  </button>
                )}
              </div>
            );
          })}
        </Feuille>
      )}
    </section>
  );
}
