'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import SymbolPicker from './SymbolPicker';
import { LETTRES, SYMBOLES } from '@/lib/symboles';

const NOUVEAU = '__nouveau__';
const uid = () => crypto.randomUUID();
const groupeVide = () => ({ id: uid(), name: '', rows: [] });

const ORDRE_CHIFFRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const suivant = (v) => {
  if (!v) return 'A';

  if (LETTRES.includes(v)) {
    const idx = LETTRES.indexOf(v);
    return idx < LETTRES.length - 1 ? LETTRES[idx + 1] : LETTRES[0];
  }

  if (ORDRE_CHIFFRES.includes(v)) {
    const idx = ORDRE_CHIFFRES.indexOf(v);
    return idx < ORDRE_CHIFFRES.length - 1 ? ORDRE_CHIFFRES[idx + 1] : ORDRE_CHIFFRES[0];
  }

  if (v.startsWith('s:')) {
    const idActuel = v.slice(2);
    const idx = SYMBOLES.findIndex((s) => s.id === idActuel);
    if (idx !== -1) {
      const suivantSymbol = idx < SYMBOLES.length - 1 ? SYMBOLES[idx + 1] : SYMBOLES[0];
      return 's:' + suivantSymbol.id;
    }
  }

  return 'A';
};

function normaliser(codes) {
  if (!Array.isArray(codes) || !codes.length) return [groupeVide()];
  if (!codes[0].rows) {
    return [{ 
      id: uid(), 
      name: '', 
      rows: codes.map((c) => ({ 
        id: uid(), 
        sym: c.sym || '', 
        num: String(c.pencil || c.num || '') 
      })) 
    }];
  }
  return codes.map((g) => ({ 
    id: g.id || uid(), 
    name: g.name || '', 
    rows: (g.rows || []).map((r) => ({ 
      id: r.id || uid(), 
      sym: r.sym || '', 
      num: String(r.num || '') 
    })) 
  }));
}

async function reduire(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 1400 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.82));
}

function ChampCodeCouleur({ value, onChange, enExport }) {
  const [verrouille, setVerrouille] = useState(Boolean(value));

  const TenterModification = () => {
    if (verrouille) {
      const toutDaccord = window.confirm('Voulez-vous modifier le code de couleur ?');
      if (toutDaccord) {
        setVerrouille(false);
      }
    }
  };

  if (enExport) {
    return <div className="valeur-export-code">{value || ''}</div>;
  }

  return (
    <textarea
      rows={1}
      placeholder="ex: PC-242"
      aria-label="Code de couleur"
      value={value}
      readOnly={verrouille}
      onClick={TenterModification}
      onChange={(e) => onChange(e.target.value)}
      style={{
        cursor: verrouille ? 'pointer' : 'text',
        background: verrouille ? 'var(--carte)' : 'var(--blanc)',
      }}
    />
  );
}

function Groupe({ g, maj, retirer, enExport }) {
  const [glisserIndex, setGlisserIndex] = useState(null);

  const setRow = (id, k, v) => maj({ ...g, rows: g.rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  
  const ajouter = () => {
    const dernierSym = g.rows.at(-1)?.sym;
    maj({ ...g, rows: [...g.rows, { id: uid(), sym: suivant(dernierSym), num: '' }] });
  };

  const deplacer = (from, to) => {
    if (to < 0 || to >= g.rows.length) return;
    const nvlRows = [...g.rows];
    const [element] = nvlRows.splice(from, 1);
    nvlRows.splice(to, 0, element);
    maj({ ...g, rows: nvlRows });
  };

  const totalCodes = g.rows.length;
  const milieu = Math.ceil(totalCodes / 2);
  const codesGauche = g.rows.slice(0, milieu);
  const codesDroite = g.rows.slice(milieu);

  const RendreLigne = (r, reelIdx) => (
    <div 
      className={`ligne ${glisserIndex === reelIdx ? 'glisser' : ''}`} 
      key={r.id}
      draggable={!enExport}
      onDragStart={() => setGlisserIndex(reelIdx)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (glisserIndex !== null && glisserIndex !== reelIdx) {
          deplacer(glisserIndex, reelIdx);
        }
        setGlisserIndex(null);
      }}
    >
      <SymbolPicker value={r.sym} onChange={(v) => setRow(r.id, 'sym', v)} />
      <ChampCodeCouleur value={r.num} onChange={(v) => setRow(r.id, 'num', v)} enExport={enExport} />
      
      <div className="actions-ligne">
        <div className="fleches">
          <button type="button" className="fleche" disabled={reelIdx === 0} aria-label="Monter" onClick={() => deplacer(reelIdx, reelIdx - 1)}>▲</button>
          <button type="button" className="fleche" disabled={reelIdx === g.rows.length - 1} aria-label="Descendre" onClick={() => deplacer(reelIdx, reelIdx + 1)}>▼</button>
        </div>
        <button type="button" className="retirer" aria-label="Retirer la ligne" onClick={() => maj({ ...g, rows: g.rows.filter((x) => x.id !== r.id) })}>✕</button>
      </div>
    </div>
  );

  return (
    <section className="groupe">
      <div className="groupe-tete">
        {enExport ? (
          <div className="valeur-export-titre-groupe">{g.name || 'Sans nom'}</div>
        ) : (
          <input placeholder="Sous-catégorie" aria-label="Nom de la sous-catégorie" value={g.name} onChange={(e) => maj({ ...g, name: e.target.value })} />
        )}
        <button type="button" className="retirer" aria-label="Retirer la sous-catégorie" onClick={retirer}>✕</button>
      </div>

      <div className="grille-codes-deux-colonnes">
        <div className="colonne-codes">
          {codesGauche.map((r, i) => RendreLigne(r, i))}
        </div>
        <div className="colonne-codes">
          {codesDroite.map((r, i) => RendreLigne(r, milieu + i))}
        </div>
      </div>

      <button type="button" className="plus" aria-label="Ajouter une ligne" onClick={ajouter}>+</button>
    </section>
  );
}

export default function Editor({ page, tomes: tomesInitiaux }) {
  const r = useRouter();
  const pageRef = useRef(null);
  
  const [f, setF] = useState({ title: page?.title ?? '', tome: page?.tome ?? '', page_no: page?.page_no ?? '' });
  const [tomes, setTomes] = useState(tomesInitiaux || []);
  const [ecritTome, setEcritTome] = useState(false);
  const [groupes, setGroupes] = useState(() => normaliser(page?.codes));
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(page?.has_image ? `/api/pages/${page.id}/image` : null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const [erreurServeur, setErreurServeur] = useState(null);
  const [enExport, setEnExport] = useState(false);

  // Vérification préventive du serveur dès l'ouverture de l'éditeur
  useEffect(() => {
    async function verifierConnexionAPI() {
      try {
        const urlTest = page ? `/api/pages/${page.id}` : '/api/pages';
        const methodeTest = page ? 'PUT' : 'POST';
        
        // Envoie une requête test pour vérifier que la route accepte la méthode
        const res = await fetch(urlTest, { method: 'OPTIONS' });
        
        if (!res.ok && res.status !== 204 && res.status !== 200) {
          // Si OPTIONS échoue, on vérifie via GET
          const resGet = await fetch('/api/pages', { method: 'GET' });
          if (!resGet.ok) {
            setErreurServeur(`Attention, l'application n'est pas en mesure de sauvegarder, Erreur ${resGet.status} ${resGet.statusText || 'API/PAGES'}`);
          }
        }
      } catch (err) {
        setErreurServeur("Attention, l'application n'est pas en mesure de sauvegarder, Erreur de connexion réseau");
      }
    }
    verifierConnexionAPI();
  }, [page]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const choisirTome = (v) => { if (v === NOUVEAU) { set('tome', ''); setEcritTome(true); } else set('tome', v); };
  const validerTome = () => {
    const t = f.tome.trim();
    if (t) setTomes((l) => (l.includes(t) ? l : [...l, t].sort()));
    set('tome', t); setEcritTome(false);
  };

  async function choisir(e) {
    const x = e.target.files[0]; if (!x) return;
    const b = await reduire(x); setImage(b); setApercu(URL.createObjectURL(b));
  }

  const majGroupe = (g) => setGroupes((l) => l.map((x) => (x.id === g.id ? g : x)));
  const retirerGroupe = (g) => {
    if (g.rows.length && !confirm('Retirer cette sous-catégorie et ses codes?')) return;
    setGroupes((l) => l.filter((x) => x.id !== g.id));
  };

  async function exporterEnImage() {
    if (!pageRef.current) return;
    setEnExport(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const dataUrl = await toPng(pageRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `${f.title || 'coloriage'}-export.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors de l export:', err);
      alert('Impossible d exporter l image.');
    } finally {
      setEnExport(false);
    }
  }

  async function enregistrer() {
    if (!f.title.trim()) return;
    setBusy(true); setErreur('');
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    fd.append('codes', JSON.stringify(groupes));
    if (image) fd.append('image', image, 'image.jpg');
    
    const cible = page ? `/api/pages/${page.id}` : '/api/pages';
    const methode = page ? 'PUT' : 'POST';

    const res = await fetch(cible, { method: methode, body: fd });
    if (res.ok) { r.push('/'); r.refresh(); return; }
    
    const reponseJson = await res.json().catch(() => ({}));
    const message = reponseJson.error || `Erreur ${res.status} ${res.statusText || 'API/PAGES'}`;
    setErreur(`Attention, l'application n'est pas en mesure de sauvegarder, ${message}`);
    setBusy(false);
  }

  async function supprimer() {
    if (!confirm('Supprimer ce coloriage pour toujours?')) return;
    await fetch(`/api/pages/${page.id}`, { method: 'DELETE' });
    r.push('/'); r.refresh();
  }

  return (
    <>
      <div className="barre">
        <button className="btn alt" onClick={() => r.push('/')}>Retour</button>
        <button type="button" className="btn alt" onClick={exporterEnImage}>Exporter en image 📷</button>
        {page && <button className="btn danger" onClick={supprimer}>Supprimer</button>}
        <button className="btn btn-save" onClick={enregistrer} disabled={busy || !f.title.trim()}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>

      {/* Alerte rouge si le serveur signale une erreur au chargement ou à l'enregistrement */}
      {(erreurServeur || erreur) && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #fca5a5',
          margin: '12px 0',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          ⚠️ {erreurServeur || erreur}
        </div>
      )}

      <div 
        ref={pageRef} 
        className={`zone-export-conteneur ${enExport ? 'mode-export' : ''}`}
        style={{ background: 'var(--arriere-plan, #e4f0ec)', padding: 'var(--espace-2)' }}
      >
        <div className="haut">
          <div className="gauche">
            <div className="cadre-image">{apercu ? <img src={apercu} alt="" /> : <span>Ajoute ton image</span>}</div>
            <label className="btn alt">Choisir une photo<input type="file" accept="image/*" hidden onChange={choisir} /></label>
          </div>
          <div className="droite">
            {enExport ? (
              <div className="meta-export-compact">
                <h2 className="titre-export-page">{f.title || 'Coloriage'}</h2>
                <div className="sous-meta-export">
                  {f.tome && <span>Tome : <b>{f.tome}</b></span>}
                  {f.page_no && <span>Page : <b>{f.page_no}</b></span>}
                </div>
              </div>
            ) : (
              <>
                <label>Titre de la page *
                  <input placeholder="ex: Scooby-Doo" value={f.title} onChange={(e) => set('title', e.target.value)} required />
                </label>

                <div className="deux">
                  <div>
                    {ecritTome ? (
                      <>
                        <label htmlFor="nom-tome">Nom du tome</label>
                        <div className="tome-nouveau">
                          <input id="nom-tome" autoFocus value={f.tome} onChange={(e) => set('tome', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && validerTome()} />
                          <button type="button" className="btn" onClick={validerTome}>OK</button>
                        </div>
                      </>
                    ) : (
                      <label>Tome
                        <select value={f.tome} onChange={(e) => choisirTome(e.target.value)}>
                          <option value="">Choisir</option>
                          {f.tome && !tomes.includes(f.tome) && <option value={f.tome}>{f.tome}</option>}
                          {tomes.map((t) => <option key={t} value={t}>{t}</option>)}
                          <option value={NOUVEAU}>+ Nouveau tome</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <label>Page<input inputMode="numeric" value={f.page_no} onChange={(e) => set('page_no', e.target.value)} /></label>
                </div>
              </>
            )}
          </div>
        </div>

        <h3 className="titre-codes">Codes couleurs</h3>
        
        <div className="liste-sous-categories">
          {groupes.map((g) => (
            <Groupe key={g.id} g={g} maj={majGroupe} retirer={() => retirerGroupe(g)} enExport={enExport} />
          ))}

          <button 
            type="button" 
            className="btn alt ajout-groupe ajout-groupe-bas" 
            onClick={() => setGroupes((l) => [...l, groupeVide()])}
          >
            + Sous-catégorie
          </button>
        </div>
      </div>
    </>
  );
}
