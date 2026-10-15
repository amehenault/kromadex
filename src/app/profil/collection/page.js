'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, Plus, Trash2, ArrowLeft, Search, Check, Folder } from 'lucide-react';

export default function CollectionCrayonsPage() {
  const [toutesMarques, setToutesMarques] = useState([]);
  const [mesSetsIds, setMesSetsIds] = useState(new Set());
  const [setActif, setSetActif] = useState('');
  
  const [couleurs, setCouleurs] = useState([]);
  const [mesCrayons, setMesCrayons] = useState(new Set());
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  // Modal / Formulaire d'ajout
  const [afficherModalAjout, setAfficherModalAjout] = useState(false);
  const [setAAjouter, setSetAAjouter] = useState('');
  const [modeCreationCustom, setModeCreationCustom] = useState(false);
  const [customMarque, setCustomMarque] = useState('');
  const [customNomSet, setCustomNomSet] = useState('');

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  async function chargerDonneesInitiales() {
    try {
      const res = await fetch('/api/markers');
      if (res.ok) {
        const data = await res.json();
        setToutesMarques(data.allBrands || []);
        
        const setsPossedes = new Set((data.userSets || []).map(Number));
        setMesSetsIds(setsPossedes);

        if (setsPossedes.size > 0 && data.allBrands) {
          const premierSet = data.allBrands.find((b) => setsPossedes.has(Number(b.id)));
          if (premierSet) setSetActif(Number(premierSet.id));
        } else if (data.allBrands?.length > 0) {
          setSetActif(Number(data.allBrands[0].id));
        }

        setMesCrayons(new Set((data.userMarkerIds || []).map(Number)));
      }
    } catch (err) {
      console.error('Erreur chargement :', err);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    if (!setActif) return;
    async function chargerCouleurs() {
      try {
        const res = await fetch(`/api/markers/colors?brandId=${setActif}`);
        if (res.ok) {
          const data = await res.json();
          setCouleurs(data.colors || []);
        }
      } catch (err) {
        console.error('Erreur chargement couleurs :', err);
      }
    }
    chargerCouleurs();
  }, [setActif]);

  async function toggleCrayon(colorId) {
    const nouveauSet = new Set(mesCrayons);
    const idNum = Number(colorId);
    const possede = nouveauSet.has(idNum);

    if (possede) {
      nouveauSet.delete(idNum);
    } else {
      nouveauSet.add(idNum);
    }
    setMesCrayons(nouveauSet);

    await fetch('/api/markers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colorId: idNum, possede: !possede }),
    });
  }

  async function ajouterNouveauSet() {
    if (modeCreationCustom) {
      if (!customMarque.trim() || !customNomSet.trim()) return;

      const res = await fetch('/api/markers/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_CUSTOM',
          customBrandName: customMarque.trim(),
          customRangeName: customNomSet.trim()
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await chargerDonneesInitiales();
        if (data.newBrandId) setSetActif(Number(data.newBrandId));
      }
    } else {
      if (!setAAjouter) return;

      const idNum = Number(setAAjouter);
      const res = await fetch('/api/markers/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD', brandId: idNum }),
      });

      if (res.ok) {
        setMesSetsIds((prev) => new Set([...prev, idNum]));
        setSetActif(idNum);
      }
    }

    setAfficherModalAjout(false);
    setModeCreationCustom(false);
    setCustomMarque('');
    setCustomNomSet('');
    setSetAAjouter('');
  }

  async function retirerSetActif(brandId) {
    if (!confirm('Retirer ce kit de vos sets possédés ?')) return;

    const idNum = Number(brandId);
    const res = await fetch('/api/markers/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE', brandId: idNum }),
    });

    if (res.ok) {
      const maj = new Set(mesSetsIds);
      maj.delete(idNum);
      setMesSetsIds(maj);

      const reste = toutesMarques.filter((b) => maj.has(Number(b.id)));
      if (reste.length > 0) {
        setSetActif(Number(reste[0].id));
      } else {
        setSetActif('');
        setCouleurs([]);
      }
    }
  }

  const marquesAffichees = toutesMarques.filter((b) => mesSetsIds.has(Number(b.id)));
  const setActifInfo = toutesMarques.find((b) => Number(b.id) === Number(setActif));

  const couleursFiltrees = couleurs.filter(
    (c) => c.color_code.toLowerCase().includes(recherche.toLowerCase())
  );

  const nbCochees = couleurs.filter((c) => mesCrayons.has(Number(c.id))).length;

  const structureMarques = toutesMarques.reduce((acc, item) => {
    const brand = item.brand_name || 'Autre';
    const subType = item.sub_type || 'Général';

    if (!acc[brand]) acc[brand] = {};
    if (!acc[brand][subType]) acc[brand][subType] = [];

    acc[brand][subType].push(item);
    return acc;
  }, {});

  if (chargement) {
    return (
      <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-4)' }}>
        <p>Chargement de KROMADEX...</p>
      </div>
    );
  }

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-4)' }}>
      
      <div className="barre" style={{ marginBottom: 'var(--espace-4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/profil" className="btn alt" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Profil
        </Link>
        <h2 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={24} /> KROMADEX — Nuancier de Collection
        </h2>
      </div>

      <div className="carte" style={{ marginBottom: 'var(--espace-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espace-3)', flexWrap: 'wrap', gap: 'var(--espace-2)' }}>
          <h3 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={20} /> Mes Coffrets / Kits Possédés ({marquesAffichees.length})
          </h3>
          
          <button 
            type="button" 
            className="btn" 
            onClick={() => setAfficherModalAjout(true)}
            style={{ fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} /> Ajouter un coffret à ma collection
          </button>
        </div>

        {marquesAffichees.length > 0 ? (
          <div style={{ display: 'flex', gap: 'var(--espace-2)', overflowX: 'auto', paddingBottom: '6px' }}>
            {marquesAffichees.map((b) => {
              const estActif = Number(setActif) === Number(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSetActif(Number(b.id))}
                  className={estActif ? 'btn' : 'btn alt'}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.85rem',
                    padding: '8px 14px'
                  }}
                >
                  {b.brand_name} — {b.sub_type ? `${b.sub_type} ` : ''}{b.range_name}
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--texte-secondaire)', margin: '8px 0 0' }}>
            Aucun coffret dans votre collection.
          </p>
        )}
      </div>

      {setActifInfo && (
        <div className="carte" style={{ marginBottom: 'var(--espace-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--espace-3)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                {setActifInfo.brand_name} — {setActifInfo.sub_type ? `${setActifInfo.sub_type} ` : ''}{setActifInfo.range_name}
              </h3>
              <small style={{ color: 'var(--texte-secondaire)' }}>
                {couleurs.length} couleurs disponibles au total dans ce pack ({nbCochees} cochées)
              </small>
            </div>

            <div style={{ display: 'flex', gap: 'var(--espace-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
                <input 
                  type="text" 
                  placeholder="Filtrer par code..." 
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  style={{ minWidth: '220px', paddingLeft: '32px' }}
                />
              </div>

              <button 
                type="button" 
                className="btn danger alt" 
                style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => retirerSetActif(Number(setActif))}
              >
                <Trash2 size={16} /> Retirer le pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grille d'affichage des couleurs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 'var(--espace-2)'
      }}>
        {couleursFiltrees.map((c) => {
          const possede = mesCrayons.has(Number(c.id));

          return (
            <div
              key={c.id}
              onClick={() => toggleCrayon(c.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 6px',
                background: possede ? '#ffffff' : '#f5f5f5',
                border: possede ? '2px solid #2d3748' : '1px solid #e2e8f0',
                borderRadius: 'var(--rayon-s)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: c.hex_value || '#808080',
                border: '1px solid rgba(0,0,0,0.15)',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                filter: possede ? 'none' : 'brightness(0.9) grayscale(25%)',
                opacity: 1
              }}>
                {possede && <Check size={18} strokeWidth={3} />}
              </div>

              <b style={{ fontSize: '0.95rem', color: '#1a202c', letterSpacing: '0.5px' }}>
                {c.color_code}
              </b>
            </div>
          );
        })}
      </div>

      {afficherModalAjout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--espace-3)'
        }}>
          <div className="carte" style={{ width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--fond-carte)' }}>
            <h3 style={{ marginTop: 0 }}>Ajouter un coffret</h3>

            <div style={{ display: 'flex', gap: 'var(--espace-2)', marginBottom: 'var(--espace-3)' }}>
              <button 
                type="button" 
                className={!modeCreationCustom ? 'btn' : 'btn alt'}
                onClick={() => setModeCreationCustom(false)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              >
                Catalogue Officiel
              </button>
              <button 
                type="button" 
                className={modeCreationCustom ? 'btn' : 'btn alt'}
                onClick={() => setModeCreationCustom(true)}
                style={{ flex: 1, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Plus size={16} /> Kit Personnalisé
              </button>
            </div>

            {!modeCreationCustom ? (
              <div style={{ marginBottom: 'var(--espace-4)' }}>
                {Object.keys(structureMarques).map((marque) => (
                  <div key={marque} style={{ marginBottom: '18px' }}>
                    <h2 style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: '800', 
                      margin: '12px 0 6px 0', 
                      color: 'var(--texte-principal)'
                    }}>
                      {marque}
                    </h2>

                    {Object.keys(structureMarques[marque]).map((subType) => (
                      <div key={subType} style={{ marginLeft: '4px', marginBottom: '12px' }}>
                        <div style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: '700', 
                          color: 'var(--texte-principal)',
                          margin: '6px 0 6px 0'
                        }}>
                          {subType}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {structureMarques[marque][subType].map((b) => {
                            const estSelectionne = Number(setAAjouter) === Number(b.id);
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSetAAjouter(Number(b.id))}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.95rem',
                                  borderRadius: '6px',
                                  border: estSelectionne ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
                                  background: estSelectionne ? 'var(--btn)' : 'var(--carte)',
                                  color: estSelectionne ? '#ffffff' : 'var(--texte-principal)',
                                  fontWeight: estSelectionne ? 'bold' : 'normal',
                                  cursor: 'pointer'
                                }}
                              >
                                {b.range_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)', marginBottom: 'var(--espace-4)' }}>
                <label><b>Marque / Fabricant :</b></label>
                <input 
                  type="text" 
                  placeholder="ex: Action, Faber-Castell..." 
                  value={customMarque}
                  onChange={(e) => setCustomMarque(e.target.value)}
                />

                <label><b>Nom du coffret / kit :</b></label>
                <input 
                  type="text" 
                  placeholder="ex: Twinmarkers 80..." 
                  value={customNomSet}
                  onChange={(e) => setCustomNomSet(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--espace-2)', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn alt" 
                onClick={() => setAfficherModalAjout(false)}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={ajouterNouveauSet}
                style={{ fontWeight: 'bold' }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}