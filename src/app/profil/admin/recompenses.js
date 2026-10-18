'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import IMAGES from '@/lib/manifesteRecompenses.json';
import { colonne, champ, aide } from './outils';

// Types de récompenses (filtre), dans l'ordre d'affichage ; un type sans image l'indique
const TYPES = [
  'Épreuve mensuelle', 'Épreuve des Sentinelles', 'Épreuve des chef.fes', 'Épreuve de groupe', 'Bingo',
  'Duel', 'Joute', 'Tournoi du royaume', 'Combat', 'Expédition', 'Épopée', 'Prophétie',
  'Pionnières et Pionniers', 'Inventaire', 'Autres',
];
// Tailles où les icônes sont affichées dans l'application
const TAILLES = [
  { px: 40, label: 'Liste (40)' },
  { px: 56, label: 'Profil (56)' },
  { px: 72, label: 'Inventaire (72)' },
  { px: 120, label: 'Grande (120)' },
];
const ko = (octets) => `${Math.max(1, Math.round(octets / 1024))} Ko`;

// Récompenses : toutes les icônes du jeu (dossiers public/recompenses-activites, pionniers, inventaire),
// triées par type, avec recherche et filtre, pour vérifier ce qui existe et la taille de chaque icône
export default function Recompenses() {
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('');
  const [taille, setTaille] = useState(72);

  const groupes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const liste = IMAGES.filter((i) => (!filtre || i.type === filtre) && (!q || `${i.fichier} ${i.type}`.toLowerCase().includes(q)));
    return TYPES.filter((t) => !filtre || t === filtre)
      .map((t) => ({ type: t, images: liste.filter((i) => i.type === t) }))
      .filter((g) => g.images.length || (!q && filtre === g.type) || (!q && !filtre));
  }, [recherche, filtre]);

  return (
    <div style={colonne}>
      <div className="carte" style={colonne}>
        <b>Récompenses du jeu ({IMAGES.length} images)</b>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Search size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un nom de fichier"
            aria-label="Rechercher une récompense" style={{ margin: 0, flex: 1, minWidth: 0 }} />
        </label>
        <label style={champ}>Type
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">Tous les types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t} ({IMAGES.filter((i) => i.type === t).length})</option>)}
          </select>
        </label>
        <div role="group" aria-label="Taille d’affichage" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
          {TAILLES.map((t) => (
            <button key={t.px} type="button" onClick={() => setTaille(t.px)} aria-pressed={taille === t.px}
              className={taille === t.px ? 'btn' : 'btn alt'} style={{ minHeight: '44px', fontSize: '0.85rem', minWidth: 0 }}>
              {t.label}
            </button>
          ))}
        </div>
        <small style={aide}>
          Le cadre pointillé montre la place réservée à l’icône : une icône bien dimensionnée remplit le cadre sans le dépasser.
          La liste se met à jour à chaque mise en ligne.
        </small>
      </div>

      {groupes.map((g) => (
        <div key={g.type} className="carte" style={colonne}>
          <b>{g.type} <small style={{ ...aide, fontWeight: 400 }}>({g.images.length})</small></b>
          {g.images.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px 8px' }}>
              {g.images.map((i) => (
                <a key={i.chemin} href={i.chemin} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0, textAlign: 'center', color: 'inherit', textDecoration: 'none' }}>
                  <span style={{ width: taille, height: taille, maxWidth: '100%', aspectRatio: '1 / 1', outline: '1px dashed var(--btn-secondaire-bordure)', display: 'grid', placeItems: 'center' }}>
                    <img src={i.chemin} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </span>
                  <small style={{ fontWeight: 600, fontSize: '0.7rem', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{i.fichier}</small>
                  <small style={{ ...aide, fontSize: '0.68rem' }}>{i.largeur && i.hauteur ? `${i.largeur} × ${i.hauteur} · ` : ''}{ko(i.octets)}</small>
                </a>
              ))}
            </div>
          ) : (
            <small style={aide}>Aucune image pour l’instant.</small>
          )}
        </div>
      ))}
      {!groupes.length && <p style={aide}>Aucune récompense ne correspond à cette recherche.</p>}
    </div>
  );
}
