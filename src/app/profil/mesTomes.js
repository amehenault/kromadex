'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Camera,
} from 'lucide-react';

// Grille de progression : 2 colonnes, couverture, nom, « 12 / 100 pages » et barre
export default function MesTomes({ tomes }) {
  const router = useRouter();

  const [menu, setMenu] = useState(null); // tome dont le menu est ouvert
  const [edition, setEdition] = useState(null); // { nom, nouveauNom, nbPages, fichier }
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');

  const lien = (t) => `/profil/tome?nom=${encodeURIComponent(t.nom)}`;

  async function retirer(t) {
    setMenu(null);

    if (
      !confirm(
        'Es-tu sûre de vouloir supprimer ce tome ? Tu perdras ta progression.'
      )
    ) {
      return;
    }

    const res = await fetch('/api/tomes/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: t.nom,
      }),
    });

    if (res.ok) {
      router.refresh();
    }
  }

  async function enregistrer() {
    setOccupe(true);
    setErreur('');

    try {
      const nom = edition.nouveauNom.trim() || edition.nom;

      const res = await fetch('/api/tomes/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ancienNom: edition.nom,
          nouveauNom: nom,
          nbPages: edition.nbPages,
        }),
      });

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErreur(d.error || 'Erreur');
        return;
      }

      if (edition.fichier) {
        const fd = new FormData();
        fd.append('tome', nom);
        fd.append('image', edition.fichier);

        await fetch('/api/tomes/cover', {
          method: 'POST',
          body: fd,
        });
      }

      setEdition(null);
      router.refresh();
    } finally {
      setOccupe(false);
    }
  }

  if (!tomes.length) {
    return (
      <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>
        Aucun tome pour le moment.{' '}
        <Link href="/profil/tomes">Ajoute tes tomes</Link> : ta progression
        se remplit toute seule quand tu enregistres un coloriage.
      </p>
    );
  }

  const feuille = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflowY: 'auto',
  };

  const panneau = {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90dvh',
    overflowY: 'auto',
    background: 'var(--fond-carte, #ffffff)',
    color: 'var(--noir, #273136)',
    border: '2px solid var(--couleur-secondaire, #4bbca1)',
    borderBottom: 0,
    borderRadius: 'var(--rayon-l, 16px) var(--rayon-l, 16px) 0 0',
    padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
  };

  const titrePanneau = {
    margin: 0,
    padding: '4px 0 12px',
    borderBottom: '1px solid var(--bordure-carte, #bacdc1)',
    color: 'var(--noir, #273136)',
    fontSize: '1.1rem',
    fontWeight: 700,
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  };

  const ligneMenu = {
    minHeight: '50px',
    justifyContent: 'flex-start',
    gap: '10px',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '14px',
        }}
      >
        {tomes.map((t) => {
          const pct = t.total
            ? Math.min(100, Math.round((t.faites / t.total) * 100))
            : 0;

          return (
            <div
              key={t.nom}
              style={{
                position: 'relative',
                minWidth: 0,
              }}
            >
              <Link
                href={lien(t)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    borderRadius: 'var(--rayon-m)',
                    overflow: 'hidden',
                    background: 'var(--carte)',
                    border: '1px solid var(--bordure-carte)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {t.couverture ? (
                    <img
                      src={t.couverture}
                      alt=""
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <BookOpen
                      size={40}
                      aria-hidden="true"
                      style={{
                        color: 'var(--texte-secondaire)',
                      }}
                    />
                  )}
                </div>

                <b
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.25,
                    color: 'var(--texte-principal)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {t.nom}
                </b>

                <small
                  style={{
                    color: 'var(--texte-secondaire)',
                    fontWeight: 'bold',
                  }}
                >
                  {t.total
                    ? `${t.faites} / ${t.total} pages`
                    : `${t.faites} page${t.faites > 1 ? 's' : ''}`}
                </small>

                <div
                  style={{
                    height: '8px',
                    borderRadius: '999px',
                    background: 'var(--carte)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background:
                        pct >= 100 ? 'var(--btn-save)' : 'var(--btn)',
                    }}
                  />
                </div>
              </Link>

              <button
                type="button"
                aria-label={`Options pour ${t.nom}`}
                onClick={() => setMenu(t)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#1a202c',
                }}
              >
                <MoreHorizontal size={20} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {menu && (
        <div style={feuille} onClick={() => setMenu(null)}>
          <div
            style={panneau}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={titrePanneau}>{menu.nom}</h3>

            {menu.perso && (
              <button
                type="button"
                className="btn alt"
                style={ligneMenu}
                onClick={() => {
                  setEdition({
                    nom: menu.nom,
                    nouveauNom: menu.nom,
                    nbPages: menu.total ?? '',
                    fichier: null,
                  });
                  setMenu(null);
                }}
              >
                <Pencil
                  size={18}
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                />
                <span>
                  Modifier le nom, la couverture ou le nombre de pages
                </span>
              </button>
            )}

            <button
              type="button"
              className="btn danger"
              style={{
                ...ligneMenu,
                background: 'var(--danger, #9c033b)',
                color: '#ffffff',
              }}
              onClick={() => retirer(menu)}
            >
              <Trash2
                size={18}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              <span>Supprimer de mon profil</span>
            </button>

            <button
              type="button"
              className="btn alt"
              style={{
                ...ligneMenu,
                justifyContent: 'center',
              }}
              onClick={() => setMenu(null)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {edition && (
        <div style={feuille} onClick={() => setEdition(null)}>
          <div
            style={panneau}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <h3
                style={{
                  ...titrePanneau,
                  padding: 0,
                  borderBottom: 0,
                }}
              >
                Modifier le tome
              </h3>

              <button
                type="button"
                className="btn alt"
                aria-label="Fermer"
                onClick={() => setEdition(null)}
                style={{
                  minWidth: '40px',
                  minHeight: '40px',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <label>
              Nom du tome
              <input
                value={edition.nouveauNom}
                onChange={(e) =>
                  setEdition({
                    ...edition,
                    nouveauNom: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Nombre de coloriages dans le livre
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={edition.nbPages}
                onChange={(e) =>
                  setEdition({
                    ...edition,
                    nbPages: e.target.value,
                  })
                }
                placeholder="ex: 100"
              />
            </label>

            <label
              className="btn alt"
              style={{
                minHeight: '44px',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Camera
                size={18}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              {edition.fichier
                ? edition.fichier.name
                : 'Choisir une couverture'}

              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                hidden
                onChange={(e) =>
                  setEdition({
                    ...edition,
                    fichier: e.target.files?.[0] || null,
                  })
                }
              />
            </label>

            {erreur && (
              <small style={{ color: 'var(--danger)' }}>
                {erreur}
              </small>
            )}

            <button
              type="button"
              className="btn btn-save"
              disabled={occupe}
              onClick={enregistrer}
              style={{
                minHeight: '46px',
                fontWeight: 'bold',
              }}
            >
              {occupe ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}