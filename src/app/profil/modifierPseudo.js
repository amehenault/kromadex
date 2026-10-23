'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import Pseudo from '@/components/Pseudo';
import TexteAjuste from '@/components/TexteAjuste';

// Pseudo du profil, dans la couleur du poste : modifiable à tout moment, avec vérification en direct
// qu'aucune autre personne ne l'utilise déjà
export default function ModifierPseudo({ pseudo, role }) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);
  const [valeur, setValeur] = useState(pseudo);
  const [etat, setEtat] = useState(null); // { libre, erreur }
  const [occupe, setOccupe] = useState(false);

  const propre = valeur.trim().replace(/^@/, '');
  const inchange = propre.toLowerCase() === pseudo.toLowerCase();

  // Disponibilité vérifiée 400 ms après la dernière frappe
  useEffect(() => {
    if (!edition || !propre || inchange) { setEtat(null); return; }
    const minuteur = setTimeout(() => {
      fetch(`/api/user/pseudo?q=${encodeURIComponent(propre)}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setEtat(d));
    }, 400);
    return () => clearTimeout(minuteur);
  }, [propre, edition, inchange]);

  function annuler() { setEdition(false); setValeur(pseudo); setEtat(null); }

  async function enregistrer(e) {
    e.preventDefault();
    if (inchange) { annuler(); return; }
    setOccupe(true);
    const res = await fetch('/api/user/pseudo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pseudo: propre }),
    });
    const d = await res.json().catch(() => ({}));
    setOccupe(false);
    if (!res.ok) { setEtat({ libre: false, erreur: d.error || 'Erreur, réessaie.' }); return; }
    setEdition(false);
    router.refresh();
  }

  if (!edition) {
    return (
      <button type="button" onClick={() => setEdition(true)} aria-label={pseudo ? `Modifier mon pseudo @${pseudo}` : 'Choisir un pseudo'}
        style={{
          all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          minHeight: '44px', width: '100%', boxSizing: 'border-box',
        }}>
        {pseudo
          // Toujours sur une seule ligne : un pseudo long devient plus petit au lieu de passer à la ligne
          ? <span style={{ flex: '0 1 auto', minWidth: 0 }}><TexteAjuste taille={0.95} min={0.5}><Pseudo x={{ pseudo }} role={role} /></TexteAjuste></span>
          : <small style={{ color: 'var(--texte-secondaire)', fontWeight: 700 }}>Choisir un pseudo</small>}
        <Pencil size={15} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
      </button>
    );
  }

  const bouton = { minHeight: '44px', minWidth: '44px', padding: '0 10px', flex: '0 0 auto' };
  return (
    <form onSubmit={enregistrer} style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0', minWidth: 0 }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
        <label style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span aria-hidden="true" style={{ fontWeight: 700 }}>@</span>
          <input value={valeur} onChange={(e) => setValeur(e.target.value)} maxLength={31} autoFocus autoComplete="nickname"
            aria-label="Nouveau pseudo" aria-invalid={etat?.libre === false} style={{ flex: 1, minWidth: 0, width: '100%' }} />
        </label>
        <button type="submit" className="btn" aria-label="Enregistrer le pseudo" style={bouton}
          disabled={occupe || !propre || etat?.libre === false}>
          <Check size={16} aria-hidden="true" />
        </button>
        <button type="button" className="btn alt" aria-label="Annuler" style={bouton} onClick={annuler}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {etat && (
        <small role="status" style={{ color: etat.libre ? 'var(--texte-secondaire)' : 'var(--danger)', fontWeight: 600 }}>
          {etat.libre ? 'Ce pseudo est disponible' : etat.erreur}
        </small>
      )}
    </form>
  );
}
