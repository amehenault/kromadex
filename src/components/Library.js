'use client';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';

export default function Library({ pages = [] }) {
  const [q, setQ] = useState('');
  const [modeVue, setModeVue] = useState('toutes');
  const [tomeSelectionne, setTomeSelectionne] = useState(null);
  const [version, setVersion] = useState('');
  const [menuOuvert, setMenuOuvert] = useState(null);
  const fileInputRef = useRef(null);
  const [tomeEnEdition, setTomeEnEdition] = useState(null);

  useEffect(() => {
    setVersion(Date.now().toString());
  }, []);

  const elements = Array.isArray(pages) ? pages : [];

  const dossiersTomes = useMemo(() => {
    const mapTomes = new Map();

    elements.forEach((p) => {
      const nomTome = (p.tome || 'Sans tome').trim();
      if (!mapTomes.has(nomTome)) {
        mapTomes.set(nomTome, {
          nom: nomTome,
          nbPages: 0,
          premierePageId: p.has_image ? p.id : null,
          imgSize: p.img_size || 0,
        });
      }

      const t = mapTomes.get(nomTome);
      t.nbPages += 1;
      if (!t.premierePageId && p.has_image) {
        t.premierePageId = p.id;
        t.imgSize = p.img_size || 0;
      }
    });

    return Array.from(mapTomes.values()).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [elements]);

  const listePropre = useMemo(() => {
    const terme = q.trim().toLowerCase();

    return elements.filter((p) => {
      if (modeVue === 'tomes' && tomeSelectionne) {
        const nomTome = (p.tome || 'Sans tome').trim();
        if (nomTome !== tomeSelectionne) return false;
      }

      if (!terme) return true;

      const titreMatch = (p.title || p.titre || '').toString().toLowerCase().includes(terme);
      if (titreMatch) return true;
      if ((p.memo || '').toLowerCase().includes(terme)) return true;

      if (Array.isArray(p.codes)) {
        return p.codes.some((groupe) => {
          if (groupe?.rows && Array.isArray(groupe.rows)) {
            return groupe.rows.some((row) => (row.label || '').toLowerCase().includes(terme));
          }
          return false;
        });
      }

      return false;
    });
  }, [elements, q, modeVue, tomeSelectionne]);

  async function changerCouvertureTome(e) {
    const file = e.target.files[0];
    if (!file || !tomeEnEdition) return;

    const fd = new FormData();
    fd.append('tome', tomeEnEdition);
    fd.append('image', file);

    const res = await fetch('/api/tomes/cover', {
      method: 'POST',
      body: fd,
    });

    if (res.ok) {
      setVersion(Date.now().toString());
    } else {
      alert('Erreur lors du changement de couverture.');
    }

    setMenuOuvert(null);
    setTomeEnEdition(null);
  }

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={changerCouvertureTome} 
      />

      <div className="barre" style={{ gap: '10px', flexWrap: 'wrap' }}>
        <input 
          placeholder="Rechercher par titre ou par label (ex: Samy, Cheveux...)" 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          style={{ flex: 1, minWidth: '220px' }}
        />

        <select 
          value={modeVue} 
          onChange={(e) => {
            setModeVue(e.target.value);
            setTomeSelectionne(null);
          }}
          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
        >
          <option value="toutes">Voir toutes les pages</option>
          <option value="tomes">Voir les tomes</option>
        </select>
      </div>

      {modeVue === 'tomes' && !tomeSelectionne && (
        <div className="grille" style={{ marginTop: '16px' }}>
          {dossiersTomes.map((t) => (
            <div 
              key={t.nom} 
              className="tuile" 
              style={{ position: 'relative', cursor: 'pointer', border: '2px solid var(--primaire, #4a90e2)' }}
            >
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOuvert(menuOuvert === t.nom ? null : t.nom);
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ...
              </button>

              {menuOuvert === t.nom && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '8px',
                    zIndex: 20,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '6px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onClick={() => {
                      setTomeEnEdition(t.nom);
                      fileInputRef.current?.click();
                    }}
                  >
                    🖼️ Changer l&apos;image de couverture
                  </button>
                </div>
              )}

              <div onClick={() => setTomeSelectionne(t.nom)}>
                <img 
                  src={`/api/tomes/cover?name=${encodeURIComponent(t.nom)}&format=img&v=${version}`}
                  alt={t.nom}
                  onError={(e) => {
                    if (t.premierePageId) {
                      e.target.src = `/api/pages/${t.premierePageId}/image?s=${t.imgSize}&v=${version}`;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                <b>📚 {t.nom}</b>
                <small>{t.nbPages} page{t.nbPages > 1 ? 's' : ''}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {modeVue === 'tomes' && tomeSelectionne && (
        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn alt" 
            onClick={() => setTomeSelectionne(null)}
          >
            ← Retour aux tomes
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Tome : <b>{tomeSelectionne}</b></h2>
        </div>
      )}

      {(modeVue === 'toutes' || (modeVue === 'tomes' && tomeSelectionne)) && (
        <div className="grille">
          {listePropre.map((p) => (
            <Link key={p.id} href={`/pages/${p.id}`} className="tuile">
              {p.has_image ? (
                <img 
                  src={`/api/pages/${p.id}/image?s=${p.img_size || 0}&v=${version}`} 
                  alt="" 
                />
              ) : (
                <div className="vide" />
              )}
              <b>{p.title || p.titre || 'Sans titre'}</b>
              <small>
                {[p.tome, p.page_no ? `page ${p.page_no}` : null].filter(Boolean).join(', ')}
              </small>
              {p.memo && (
                <small style={{ display: 'block', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📝 {p.memo}
                </small>
              )}
            </Link>
          ))}
        </div>
      )}

      {!listePropre.length && (modeVue === 'toutes' || tomeSelectionne) && (
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Aucun coloriage ne correspond à votre recherche.
        </p>
      )}

      <Link href="/pages/new" className="btn ajouter" aria-label="Ajouter un coloriage">+</Link>
    </>
  );
}