'use client';

import { useState } from 'react';

export default function ListeTomes({ tomesInitiaux = [] }) {
  const [tomes, setTomes] = useState(tomesInitiaux);
  const [editionIndex, setEditionIndex] = useState(null);
  const [valeurTemp, setValeurTemp] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  if (!tomes.length) {
    return <p>Aucun tome enregistré pour l'instant.</p>;
  }

  const demarrerEdition = (index, nomActuel) => {
    setEditionIndex(index);
    setValeurTemp(nomActuel);
  };

  const sauvegarderEdition = async (index) => {
    const nouveauNom = valeurTemp.trim();
    const ancienNom = tomes[index];

    if (nouveauNom && nouveauNom !== ancienNom) {
      const maj = [...tomes];
      maj[index] = nouveauNom;
      setTomes(maj);

      await fetch('/api/tomes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienNom, nouveauNom }),
      });
    }

    setEditionIndex(null);
  };

  const deplacer = (index, direction) => {
    const nouvelIndex = index + direction;
    if (nouvelIndex < 0 || nouvelIndex >= tomes.length) return;

    const maj = [...tomes];
    const [element] = maj.splice(index, 1);
    maj.splice(nouvelIndex, 0, element);
    setTomes(maj);
  };

  const supprimer = async (index) => {
    const tomeASupprimer = tomes[index];
    if (!confirm(`Voulez-vous vraiment supprimer le tome "${tomeASupprimer}" ?`)) return;

    const maj = tomes.filter((_, i) => i !== index);
    setTomes(maj);

    await fetch('/api/tomes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tome: tomeASupprimer }),
    });
  };

  // Gestion du Drag & Drop
  const handleDragStart = (i) => {
    setDraggedIndex(i);
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === i) return;

    const maj = [...tomes];
    const [item] = maj.splice(draggedIndex, 1);
    maj.splice(i, 0, item);
    setTomes(maj);
    setDraggedIndex(i);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="liste-tomes">
      {tomes.map((tome, i) => {
        const estEnCours = editionIndex === i;

        return (
          <div
            key={i}
            className={`ligne ${draggedIndex === i ? 'en-glissement' : ''}`}
            draggable={!estEnCours}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
          >
            {/* Champ texte */}
            <input
              type="text"
              value={estEnCours ? valeurTemp : tome}
              readOnly={!estEnCours}
              onChange={(e) => setValeurTemp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sauvegarderEdition(i);
                if (e.key === 'Escape') setEditionIndex(null);
              }}
              style={{
                background: estEnCours ? 'var(--blanc)' : 'transparent',
                cursor: estEnCours ? 'text' : 'grab',
              }}
            />

            {/* Actions & Flèches alignées TOUTES À DROITE */}
            <div className="actions-ligne">
              {/* Flèches pour réordonner */}
              <button
                type="button"
                className="fleche"
                disabled={i === 0}
                onClick={() => deplacer(i, -1)}
                title="Monter"
              >
                ▲
              </button>
              <button
                type="button"
                className="fleche"
                disabled={i === tomes.length - 1}
                onClick={() => deplacer(i, 1)}
                title="Descendre"
              >
                ▼
              </button>

              {/* Bouton édition / validation */}
              {estEnCours ? (
                <button
                  type="button"
                  className="fleche"
                  style={{ fontSize: '1.1rem', color: 'var(--couleur-principale)' }}
                  onClick={() => sauvegarderEdition(i)}
                  title="Valider"
                >
                  ✓
                </button>
              ) : (
                <button
                  type="button"
                  className="fleche"
                  style={{ fontSize: '1rem', display: 'inline-block', transform: 'scaleX(-1)' }}
                  onClick={() => demarrerEdition(i, tome)}
                  title="Modifier"
                >
                  ✎
                </button>
              )}

              {/* Supprimer */}
              <button
                type="button"
                className="retirer"
                onClick={() => supprimer(i)}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}