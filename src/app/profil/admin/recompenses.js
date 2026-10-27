'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Feuille from '@/components/Feuille';
import IMAGES from '@/lib/manifesteRecompenses.json';
import { colonne, champ, aide } from './outils';
import Deroulant from '@/components/Deroulant';

const TYPES = [
  'Épreuve mensuelle', 'Épreuve des Sentinelles', 'Épreuve des cheffes', 'Épreuve de groupe', 'Bingo',
  'Duel', 'Joute', 'Tournoi du royaume', 'Combat', 'Expédition', 'Épopée', 'Prophétie',
  'Pionnières', 'Inventaire', 'Autres',
];
const TAILLES = [
  { px: 40, label: 'Liste (40)' },
  { px: 56, label: 'Profil (56)' },
  { px: 72, label: 'Inventaire (72)' },
  { px: 120, label: 'Grande (120)' },
];
const ko = (octets) => `${Math.max(1, Math.round(octets / 1024))} Ko`;

export default function Recompenses() {
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('');
  const [taille, setTaille] = useState(72);
  const [ouverte, setOuverte] = useState(null);

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
          <Deroulant titre="Type" value={filtre} onChange={(v) => setFiltre(v)}
            options={[{ valeur: '', label: 'Tous les types' }, ...TYPES.map((t) => ({ valeur: t, label: `${t} (${IMAGES.filter((i) => i.type === t).length})` }))]} />
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
                <button key={i.chemin} type="button" onClick={() => setOuverte(i)} aria-label={`Voir ${i.fichier}`}
                  style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0, textAlign: 'center' }}>
                  <span style={{
                    position: 'relative', display: 'block', flex: '0 0 auto', width: `min(${taille}px, 100%)`, aspectRatio: '1 / 1',
                    overflow: 'hidden', outline: '1px dashed var(--btn-secondaire-bordure)',
                  }}>
                    <img src={i.chemin} alt="" loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  </span>
                  <small style={{ fontWeight: 600, fontSize: '0.7rem', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{i.fichier}</small>
                  <small style={{ ...aide, fontSize: '0.68rem' }}>{i.largeur && i.hauteur ? `${i.largeur} × ${i.hauteur} · ` : ''}{ko(i.octets)}</small>
                </button>
              ))}
            </div>
          ) : (
            <small style={aide}>Aucune image pour l’instant.</small>
          )}
        </div>
      ))}
      {!groupes.length && <p style={aide}>Aucune récompense ne correspond à cette recherche.</p>}

      {ouverte && (
        <Feuille titre={ouverte.fichier} onFermer={() => setOuverte(null)}>
          <span style={{ position: 'relative', display: 'block', width: 'min(240px, 100%)', aspectRatio: '1 / 1', margin: '0 auto', overflow: 'hidden', outline: '1px dashed var(--btn-secondaire-bordure)' }}>
            <img src={ouverte.chemin} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
          </span>
          <small style={aide}>
            {ouverte.type}{ouverte.largeur && ouverte.hauteur ? ` · ${ouverte.largeur} × ${ouverte.hauteur}` : ''} · {ko(ouverte.octets)}
          </small>
          <small style={{ ...aide, overflowWrap: 'anywhere' }}>public{ouverte.chemin}</small>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {TAILLES.map((t) => (
              <span key={t.px} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ position: 'relative', display: 'block', width: t.px, height: t.px, overflow: 'hidden', outline: '1px dashed var(--btn-secondaire-bordure)' }}>
                  <img src={ouverte.chemin} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                </span>
                <small style={{ ...aide, fontSize: '0.68rem' }}>{t.px} px</small>
              </span>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setOuverte(null)} style={{ minHeight: '48px', fontWeight: 700 }}>
            Retour aux récompenses
          </button>
        </Feuille>
      )}
    </div>
  );
}
