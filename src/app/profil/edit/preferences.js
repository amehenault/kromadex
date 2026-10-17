'use client';

import { useState, useEffect } from 'react';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';

// « Je fais du… » et « Je veux voir les… » : rien de coché dans « voir » = tout est montré
export default function Preferences() {
  const [pratiques, setPratiques] = useState([]);
  const [vus, setVus] = useState([]);
  const [message, setMessage] = useState('');
  const [pret, setPret] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    fetch('/api/user/preferences')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setPratiques(d.typesPratiques || []);
          setVus(d.typesVus || []);
        }

        setPret(true);
      });
  }, []);

  async function enregistrer() {
    setOccupe(true);
    setMessage('');

    const res = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typesPratiques: pratiques,
        typesVus: vus,
      }),
    });

    setOccupe(false);

    if (res.ok) {
      setModifie(false);
    }

    setMessage(
      res.ok
        ? 'Préférences enregistrées'
        : 'Erreur, réessaie.'
    );
  }

  const basculer = (liste, setListe, valeur) => {
    setListe(
      liste.includes(valeur)
        ? liste.filter((x) => x !== valeur)
        : [...liste, valeur]
    );

    setModifie(true);
    setMessage('');
  };

  const puce = (actif) => ({
    minHeight: '44px',
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    border: actif
      ? '2px solid var(--btn)'
      : '1px solid var(--bordure-carte)',
    background: actif ? 'var(--btn)' : 'var(--carte)',
    color: actif ? '#ffffff' : 'var(--texte-principal)',
    fontWeight: actif ? 'bold' : 'normal',
  });

  if (!pret) return null;

  return (
    <div
      className="carte"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--espace-3)',
        marginBottom: 'var(--espace-3)',
      }}
    >
      <h3 style={{ margin: 0 }}>Préférences</h3>

      <div>
        <b
          style={{
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Je fais du…
        </b>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {TYPES_COLORIAGE.map((t) => (
            <button
              key={t.valeur}
              type="button"
              style={puce(pratiques.includes(t.valeur))}
              onClick={() =>
                basculer(pratiques, setPratiques, t.valeur)
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <b
          style={{
            display: 'block',
            marginBottom: '2px',
          }}
        >
          Je veux voir les…
        </b>

        <small
          style={{
            display: 'block',
            color: 'var(--texte-secondaire)',
            marginBottom: '6px',
          }}
        >
          Les autres types sont cachés pour toi. Rien de coché = tu vois tout.
        </small>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {TYPES_COLORIAGE.map((t) => (
            <button
              key={t.valeur}
              type="button"
              style={puce(vus.includes(t.valeur))}
              onClick={() => basculer(vus, setVus, t.valeur)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-corail"
        disabled={!modifie || occupe}
        onClick={enregistrer}
        style={{
          minHeight: '46px',
          fontWeight: 'bold',
        }}
      >
        {occupe ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      {message && (
        <small
          style={{
            color: 'var(--texte-secondaire)',
            textAlign: 'center',
          }}
        >
          {message}
        </small>
      )}
    </div>
  );
}