'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, Plus, Trash2, ArrowLeft, Search, ChevronRight, Check, X, ShoppingCart, Heart } from 'lucide-react';
import CrayonsUnite from '@/components/CrayonsUnite';
import OngletsCollections from '@/components/OngletsCollections';
import Feuille from '@/components/Feuille';

export default function CollectionCrayonsPage() {
  const [toutesMarques, setToutesMarques] = useState([]);
  const [mesSetsIds, setMesSetsIds] = useState(new Set());
  const [setActif, setSetActif] = useState('');
  
  const [couleurs, setCouleurs] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  const [afficherModalAjout, setAfficherModalAjout] = useState(false);
  const [setAAjouter, setSetAAjouter] = useState('');
  const [modeCreationCustom, setModeCreationCustom] = useState(false);
  const [customMarque, setCustomMarque] = useState('');
  const [customNomSet, setCustomNomSet] = useState('');
  const [marqueOuverte, setMarqueOuverte] = useState(null);
  const [rechercheMarque, setRechercheMarque] = useState('');
  const [aRacheter, setARacheter] = useState([]);
  const [couleurTouchee, setCouleurTouchee] = useState(null);
  const [voirRacheter, setVoirRacheter] = useState(false);
  const [souhaitsCoffrets, setSouhaitsCoffrets] = useState(new Set());

  useEffect(() => {
    chargerDonneesInitiales();
    chargerRacheter();
    fetch('/api/souhaits').then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSouhaitsCoffrets(new Set((d.coffrets || []).map((c) => Number(c.id))))).catch(() => {});
  }, []);

  async function chargerRacheter() {
    const r = await fetch('/api/racheter').catch(() => null);
    if (r?.ok) setARacheter((await r.json()).crayons || []);
  }
  const idsRacheter = new Set(aRacheter.map((c) => Number(c.id)));

  async function changerRacheter(colorId, retirer) {
    await fetch('/api/racheter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colorId, action: retirer ? 'REMOVE' : 'ADD' }),
    }).catch(() => {});
    chargerRacheter();
  }

  async function basculerSouhaitCoffret(idNum) {
    const voulu = souhaitsCoffrets.has(idNum);
    setSouhaitsCoffrets((prev) => { const m = new Set(prev); if (voulu) m.delete(idNum); else m.add(idNum); return m; });
    await fetch('/api/souhaits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId: idNum, action: voulu ? 'REMOVE' : 'ADD' }),
    }).catch(() => {});
  }

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
        }
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

  function fermerModal() {
    setAfficherModalAjout(false);
    setModeCreationCustom(false);
    setMarqueOuverte(null);
    setRechercheMarque('');
  }

  async function ajouterSet(idNum) {
    setMesSetsIds((prev) => new Set([...prev, idNum]));
    if (!setActif) setSetActif(idNum);
    const res = await fetch('/api/markers/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD', brandId: idNum }),
    });
    if (!res.ok) setMesSetsIds((prev) => { const m = new Set(prev); m.delete(idNum); return m; });
  }

  async function retirerSet(idNum) {
    setMesSetsIds((prev) => { const m = new Set(prev); m.delete(idNum); return m; });
    const res = await fetch('/api/markers/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE', brandId: idNum }),
    });
    if (!res.ok) setMesSetsIds((prev) => new Set([...prev, idNum]));
    else if (Number(setActif) === idNum) setSetActif('');
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

  const parNumero = (a, b) => {
    const na = parseInt(a.range_name.match(/\d+/)?.[0] ?? '0', 10);
    const nb = parseInt(b.range_name.match(/\d+/)?.[0] ?? '0', 10);
    return na - nb || a.range_name.localeCompare(b.range_name, 'fr');
  };

  const marquesAffichees = toutesMarques.filter((b) => mesSetsIds.has(Number(b.id))).sort(parNumero);
  const setActifInfo = toutesMarques.find((b) => Number(b.id) === Number(setActif));

  const couleursFiltrees = couleurs.filter(
    (c) => c.color_code.toLowerCase().includes(recherche.toLowerCase())
  );

  const structureMarques = toutesMarques.reduce((acc, item) => {
    const brand = item.brand_name || 'Autre';
    const subType = item.sub_type || 'Général';

    if (!acc[brand]) acc[brand] = {};
    if (!acc[brand][subType]) acc[brand][subType] = [];

    acc[brand][subType].push(item);
    return acc;
  }, {});
  Object.values(structureMarques).forEach((sousTypes) =>
    Object.values(sousTypes).forEach((kits) => kits.sort(parNumero))
  );

  if (chargement) {
    return (
      <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-4)' }}>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-4)' }}>
      
      <OngletsCollections actif="crayons" />

      <div className="carte" style={{ marginBottom: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: 'var(--espace-3)' }}>
        <button 
          type="button" 
          className="btn btn-corail" 
          onClick={() => setAfficherModalAjout(true)}
          style={{ fontWeight: 'bold', display: 'flex', width: '100%', minHeight: '48px', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Plus size={18} aria-hidden="true" /> Ajouter un coffret de crayons
        </button>
        <button
          type="button"
          className="btn alt"
          onClick={() => setVoirRacheter(true)}
          style={{ fontWeight: 'bold', display: 'flex', width: '100%', minHeight: '48px', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <ShoppingCart size={18} aria-hidden="true" /> Crayons à racheter ({aRacheter.length})
        </button>

        {marquesAffichees.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)' }}>
            {marquesAffichees.map((b) => {
              const estActif = Number(setActif) === Number(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSetActif(Number(b.id))}
                  className={estActif ? 'btn' : 'btn alt'}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    fontSize: '0.9rem',
                    padding: '10px 14px',
                    minHeight: '48px'
                  }}
                >
                  {b.brand_name} - {b.sub_type ? `${b.sub_type} ` : ''}{b.range_name}
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>
            Aucun coffret dans ta collection pour l’instant.
          </p>
        )}
      </div>

      <CrayonsUnite />

      {setActifInfo && (
        <div className="carte" style={{ marginBottom: 'var(--espace-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--espace-3)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, overflowWrap: 'anywhere', minWidth: 0 }}>
              {setActifInfo.brand_name} - {setActifInfo.sub_type ? `${setActifInfo.sub_type} ` : ''}{setActifInfo.range_name}
            </h3>

            <div style={{ display: 'flex', gap: 'var(--espace-2)', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 200px', minWidth: 0 }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
                <input 
                  type="text" 
                  placeholder="Filtrer par code..." 
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  style={{ width: '100%', minWidth: 0, paddingLeft: '32px' }}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 'var(--espace-2)'
      }}>
        {couleursFiltrees.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCouleurTouchee(c)}
            aria-label={`${c.color_code}${idsRacheter.has(Number(c.id)) ? ', dans la liste à racheter' : ''}`}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 6px',
              background: '#ffffff',
              border: idsRacheter.has(Number(c.id)) ? '2px solid var(--couleur-principale)' : '1px solid #e2e8f0',
              borderRadius: 'var(--rayon-s)',
              textAlign: 'center',
              font: 'inherit',
              cursor: 'pointer',
              minWidth: 0
            }}
          >
            {idsRacheter.has(Number(c.id)) && (
              <ShoppingCart size={14} aria-hidden="true" style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--couleur-principale)' }} />
            )}
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: c.hex_value || '#808080',
              border: '1px solid rgba(0,0,0,0.15)',
              marginBottom: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
            }} />

            <b style={{ fontSize: '0.95rem', color: '#1a202c', letterSpacing: '0.5px' }}>
              {c.color_code}
            </b>
          </button>
        ))}
      </div>

      {couleurTouchee && (() => {
        const dejaLa = idsRacheter.has(Number(couleurTouchee.id));
        return (
          <Feuille titre="Crayons à racheter" onFermer={() => setCouleurTouchee(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span aria-hidden="true" style={{ width: '40px', height: '40px', flex: '0 0 auto', borderRadius: '50%', background: couleurTouchee.hex_value || '#808080', border: '1px solid rgba(0,0,0,0.15)' }} />
              <span style={{ minWidth: 0 }}>
                <b style={{ display: 'block' }}>{couleurTouchee.color_code}</b>
                {couleurTouchee.color_name && <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{couleurTouchee.color_name}</small>}
              </span>
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {dejaLa ? 'Veux-tu le retirer de la liste de crayons à racheter ?' : 'Veux-tu l’ajouter à la liste de crayons à racheter ?'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" className="btn" style={{ minHeight: '48px', fontWeight: 700 }}
                onClick={() => { changerRacheter(couleurTouchee.id, dejaLa); setCouleurTouchee(null); }}>
                Oui
              </button>
              <button type="button" className="btn alt" style={{ minHeight: '48px', fontWeight: 700 }} onClick={() => setCouleurTouchee(null)}>
                Non
              </button>
            </div>
          </Feuille>
        );
      })()}

      {voirRacheter && (
        <Feuille titre={`Crayons à racheter (${aRacheter.length})`} onFermer={() => setVoirRacheter(false)} haute>
          {!aRacheter.length && (
            <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
              Ta liste est vide. Touche une couleur de tes coffrets pour l’ajouter.
            </p>
          )}
          {Object.entries(aRacheter.reduce((g, c) => ((g[c.nom_pack] ||= []).push(c), g), {})).map(([pack, liste]) => (
            <div key={pack} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <b style={{ fontSize: '0.9rem', color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{pack}</b>
              {liste.map((c) => (
                <div key={c.id} className="deroulant-choix" style={{ cursor: 'default' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span aria-hidden="true" style={{ width: '30px', height: '30px', flex: '0 0 auto', borderRadius: '50%', background: c.hex || '#808080', border: '1px solid rgba(0,0,0,0.15)' }} />
                    <span style={{ minWidth: 0 }}>
                      <b style={{ display: 'block' }}>{c.code}</b>
                      {c.nom && <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{c.nom}</small>}
                    </span>
                  </span>
                  <button type="button" className="btn alt" aria-label={`Retirer ${c.code} de la liste`} onClick={() => changerRacheter(c.id, true)}
                    style={{ minWidth: '44px', minHeight: '44px', padding: 0, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </Feuille>
      )}

      {afficherModalAjout && (
        <div
          data-feuille
          onClick={fermerModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="carte"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '560px', height: '92dvh', overflowY: 'auto', overscrollBehavior: 'contain',
              background: 'var(--fond-carte)', margin: 0, borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', paddingTop: 0
            }}
          >
            <div style={{
              position: 'sticky', top: 0, zIndex: 2, background: 'var(--fond-carte)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 10px'
            }}>
              <h3 style={{ margin: 0 }}>Ajouter un coffret</h3>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={fermerModal} style={{ minHeight: '44px', minWidth: '44px', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

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
              !marqueOuverte ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' }}>
                  <input
                    type="search"
                    placeholder="Rechercher une marque..."
                    value={rechercheMarque}
                    onChange={(e) => setRechercheMarque(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  {Object.keys(structureMarques)
                    .sort((a, b) => a.localeCompare(b, 'fr'))
                    .filter((m) => m.toLowerCase().includes(rechercheMarque.trim().toLowerCase()))
                    .map((marque) => {
                      const kits = Object.values(structureMarques[marque]).flat();
                      const nbPossedes = kits.filter((k) => mesSetsIds.has(Number(k.id))).length;
                      return (
                        <button
                          key={marque}
                          type="button"
                          onClick={() => setMarqueOuverte(marque)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                            width: '100%', minHeight: '54px', padding: '10px 14px', borderRadius: 'var(--rayon-m)',
                            border: '1px solid var(--bordure-carte)', background: 'var(--carte)',
                            color: 'var(--texte-principal)', cursor: 'pointer', textAlign: 'left'
                          }}
                        >
                          <span>
                            <b style={{ fontSize: '1.05rem' }}>{marque}</b>
                            <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>
                              {kits.length} kit{kits.length > 1 ? 's' : ''}{nbPossedes ? ` · ${nbPossedes} dans ma collection` : ''}
                            </small>
                          </span>
                          <ChevronRight size={20} />
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div style={{ marginBottom: 'var(--espace-3)' }}>
                  <button
                    type="button"
                    className="btn alt"
                    onClick={() => setMarqueOuverte(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginBottom: '8px' }}
                  >
                    <ArrowLeft size={16} /> Marques
                  </button>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '4px 0 10px', color: 'var(--texte-principal)' }}>
                    {marqueOuverte}
                  </h2>

                  {Object.keys(structureMarques[marqueOuverte] || {}).sort((a, b) => a.localeCompare(b, 'fr')).map((subType) => (
                    <div key={subType} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--texte-secondaire)', margin: '0 0 6px' }}>
                        {subType}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
                        {structureMarques[marqueOuverte][subType].map((b) => {
                          const possede = mesSetsIds.has(Number(b.id));
                          const voulu = souhaitsCoffrets.has(Number(b.id));
                          return (
                            <div key={b.id} style={{ display: 'flex', gap: '4px', minWidth: 0 }}>
                            <button
                              type="button"
                              onClick={() => (possede ? retirerSet(Number(b.id)) : ajouterSet(Number(b.id)))}
                              style={{
                                minHeight: '44px', padding: '8px 10px', fontSize: '0.9rem', borderRadius: '8px',
                                border: possede ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
                                background: possede ? 'var(--btn)' : 'var(--carte)',
                                color: possede ? '#ffffff' : 'var(--texte-principal)',
                                fontWeight: possede ? 'bold' : 'normal', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center',
                                flex: 1, minWidth: 0
                              }}
                            >
                              {possede ? <Check size={14} /> : <Plus size={14} />} {b.range_name}
                            </button>
                            {!possede && (
                              <button type="button" onClick={() => basculerSouhaitCoffret(Number(b.id))}
                                aria-label={voulu ? `Retirer ${b.range_name} de ma liste de souhaits` : `Je veux ${b.range_name}`} aria-pressed={voulu}
                                style={{ flex: '0 0 auto', minWidth: '44px', minHeight: '44px', borderRadius: '8px', cursor: 'pointer',
                                  border: '1px solid var(--bordure-carte)', background: 'var(--carte)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  color: voulu ? '#e0457b' : 'var(--texte-secondaire)' }}>
                                <Heart size={18} fill={voulu ? '#e0457b' : 'none'} aria-hidden="true" />
                              </button>
                            )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
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

            {modeCreationCustom && (
              <div style={{ display: 'flex', gap: 'var(--espace-2)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={ajouterNouveauSet}
                  style={{ fontWeight: 'bold', minHeight: '44px' }}
                >
                  Créer le kit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}