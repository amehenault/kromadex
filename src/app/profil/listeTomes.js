'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Save, Pencil, X } from 'lucide-react';

export default function ListeTomes({ tomesInitiaux = [] }) {
  const [tomes, setTomes] = useState(tomesInitiaux);
  const [covers, setCovers] = useState({});
  const [edition, setEdition] = useState(null);
  const [nouveauNom, setNouveauNom] = useState('');
  const [fileSelectionne, setFileSelectionne] = useState({});
  const [previewUrl, setPreviewUrl] = useState({});
  const [chargement, setChargement] = useState({});
  const fileInputRef = useRef({});

  // Charger la couverture de chaque tome de façon garantie au montage
  useEffect(() => {
    tomesInitiaux.forEach(async (tome) => {
      try {
        const res = await fetch(`/api/tomes/cover?name=${encodeURIComponent(tome.nom)}`);
        const data = await res.json();
        if (data.cover) {
          setCovers((prev) => ({ ...prev, [tome.nom]: data.cover }));
        }
      } catch (err) {
        console.error('Erreur chargement couverture', err);
      }
    });
  }, [tomesInitiaux]);

  function handleFileSelect(tomeNom, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileSelectionne((prev) => ({ ...prev, [tomeNom]: file }));
    setPreviewUrl((prev) => ({ ...prev, [tomeNom]: url }));
  }

  async function sauvegarderEdition(tomeNom) {
    setChargement((prev) => ({ ...prev, [tomeNom]: true }));
    const nomFinal = nouveauNom.trim() || tomeNom;

    if (nouveauNom && nouveauNom !== tomeNom) {
      await fetch('/api/tomes/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienNom: tomeNom, nouveauNom: nomFinal }),
      });
    }

    const file = fileSelectionne[tomeNom];
    if (file) {
      const formData = new FormData();
      formData.append('tome', nomFinal);
      formData.append('image', file);

      const res = await fetch('/api/tomes/cover', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.cover) {
        setCovers((prev) => ({ ...prev, [nomFinal]: data.cover }));
      }
    }

    setTomes((prev) =>
      prev.map((t) => (t.nom === tomeNom ? { ...t, nom: nomFinal } : t))
    );

    setChargement((prev) => ({ ...prev, [tomeNom]: false }));
    setEdition(null);
    setFileSelectionne((prev) => ({ ...prev, [tomeNom]: null }));
    setPreviewUrl((prev) => ({ ...prev, [tomeNom]: null }));
  }

  async function supprimerTome(nom) {
    if (!confirm(`Supprimer le tome "${nom}" ?`)) return;

    const res = await fetch('/api/tomes/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom }),
    });

    if (res.ok) {
      setTomes((prev) => prev.filter((t) => t.nom !== nom));
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 'var(--espace-3)'
    }}>
      {tomes.map((tome) => {
        const estEnEdition = edition === tome.nom;
        const imageAffichee = previewUrl[tome.nom] || covers[tome.nom] || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" fill="%239BD7C6"><rect width="300" height="400"/><text x="150" y="200" font-family="sans-serif" font-size="20" fill="%230E322A" text-anchor="middle">Chargement...</text></svg>';

        return (
          <div 
            key={tome.nom} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: 'var(--espace-3)',
              background: 'var(--fond-carte)',
              borderRadius: 'var(--rayon-m)',
              border: '1px solid var(--bordure-carte)',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            {/* Zone Couverture */}
            <div style={{
              width: '100%',
              aspectRatio: '3 / 4',
              borderRadius: 'var(--rayon-s)',
              overflow: 'hidden',
              marginBottom: 'var(--espace-2)',
              background: 'var(--carte)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--bordure-carte)'
            }}>
              <img 
                src={imageAffichee}
                alt={tome.nom}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {chargement[tome.nom] && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}>
                  Sauvegarde...
                </div>
              )}
            </div>

            <input 
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={(el) => (fileInputRef.current[tome.nom] = el)}
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(tome.nom, e.target.files[0])}
            />

            {estEnEdition ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)', width: '100%' }}>
                <input 
                  value={nouveauNom} 
                  onChange={(e) => setNouveauNom(e.target.value)}
                  placeholder="Nom du tome"
                  style={{ textAlign: 'center', width: '100%' }}
                />

                <button 
                  type="button" 
                  className="btn alt" 
                  style={{ minHeight: '32px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => fileInputRef.current[tome.nom]?.click()}
                >
                  <Camera size={14} /> Choisir une couverture
                </button>

                <button 
                  type="button" 
                  className="btn btn-save" 
                  style={{ minHeight: '36px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => sauvegarderEdition(tome.nom)}
                >
                  <Save size={16} /> Enregistrer
                </button>
              </div>
            ) : (
              <>
                <b style={{ color: 'var(--texte-principal)', fontSize: '1rem', wordBreak: 'break-word' }}>
                  {tome.nom}
                </b>

                <small style={{ 
                  color: 'var(--texte-secondaire)', 
                  fontWeight: 'bold',
                  margin: 'var(--espace-1) 0 var(--espace-2)',
                  fontSize: '0.85rem'
                }}>
                  {tome.nbPages || 0} / {tome.totalTomePages || 100} complétées
                </small>

                <div style={{ display: 'flex', gap: 'var(--espace-2)', marginTop: 'auto' }}>
                  <button 
                    type="button"
                    className="btn alt" 
                    style={{ minHeight: '32px', height: '32px', padding: '0 10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => { 
                      setEdition(tome.nom); 
                      setNouveauNom(tome.nom); 
                    }}
                    title="Modifier"
                  >
                    <Pencil size={15} />
                  </button>
                  <button 
                    type="button"
                    className="btn danger" 
                    style={{ minHeight: '32px', height: '32px', padding: '0 10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => supprimerTome(tome.nom)}
                    title="Supprimer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {!tomes.length && (
        <p style={{ color: 'var(--texte-secondaire)', margin: 0, gridColumn: '1 / -1' }}>
          Aucun tome répertorié pour le moment.
        </p>
      )}
    </div>
  );
}