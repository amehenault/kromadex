'use client';
import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import SymbolPicker, { Glyph } from './SymbolPicker';
import MotsClesColoriage from './MotsClesColoriage';
import ChoixTome from './ChoixTome';
import ChoixCrayon from './ChoixCrayon';
import { useAccord } from '@/components/Genre';
import { useGardeQuitter } from '@/components/GardeQuitter';
import { LETTRES, SYMBOLES } from '@/lib/symboles';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { compresserImage } from '@/lib/compressionImage';
import { appliquerCode, codeDuSymbole } from '@/lib/codesCouleurs';
import { X, Camera, AlertTriangle, Check } from 'lucide-react';

const uid = () => crypto.randomUUID();
const groupeVide = () => ({ id: uid(), name: '', rows: [{ id: uid(), label: '', sym: 'A', num: '' }] });

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
        id: c.id || uid(), 
        label: c.label || '',
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
      label: r.label || '',
      sym: r.sym || '', 
      num: String(r.num || ''),
      hex: String(r.hex || '')
    })) 
  }));
}

// Photo réduite dans le navigateur avant l'envoi (le serveur revérifie et limite de son côté)
const reduire = (file) => compresserImage(file, 1400, 0.82);

// Le champ grandit avec son texte (étiquette ou code long sur 2 ou 3 lignes en colonne étroite)
function useHauteurAuto(deps) {
  const champ = useRef(null);
  useEffect(() => {
    const t = champ.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight + 2}px`;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return champ;
}

// Petit cercle de la couleur du crayon choisi dans un coffret
const Pastille = ({ hex }) => (hex ? (
  <span aria-hidden="true" style={{ width: 16, height: 16, flex: '0 0 auto', borderRadius: '50%', background: hex, border: '1px solid rgba(0,0,0,0.15)' }} />
) : null);

// Largeur de l'image exportée (px) selon le nombre de colonnes de codes
const LARGEUR_EXPORT = { 2: 390, 3: 560, 4: 740 };

// Code couleur d'une ligne : une liste « Choisir dans mes packs de couleurs » ou « Écrire manuellement ».
// Un code déjà rempli est protégé : on confirme avant de le changer.
function ChampCodeCouleur({ value, hex, onChange, enExport, sym, label }) {
  const [mode, setMode] = useState(value ? 'rempli' : 'choix'); // choix | manuel | rempli
  const [packs, setPacks] = useState(false);
  const champ = useHauteurAuto([value, mode, enExport]);
  // Code rempli (ou vidé) depuis une autre ligne du même symbole : l'affichage suit
  useEffect(() => {
    setMode((m) => (value ? (m === 'choix' ? 'rempli' : m) : (m === 'rempli' ? 'choix' : m)));
  }, [value]);

  if (enExport) {
    return (
      <div className="valeur-export-code" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <Pastille hex={hex} />{value || ''}
      </div>
    );
  }

  const choisirMode = (v) => {
    if (v === 'packs') setPacks(true);
    else if (v === 'manuel') { onChange(hex ? '' : value, ''); setMode('manuel'); }
    else if (v === 'garder') setMode('rempli');
  };

  return (
    <>
      {mode === 'rempli' && (
        <button type="button" className="code-rempli" aria-label={`Code de couleur : ${value}. Toucher pour le modifier`}
          onClick={() => { if (window.confirm('Voulez-vous modifier le code de couleur ?')) setMode('choix'); }}>
          <Pastille hex={hex} /><span>{value}</span>
        </button>
      )}
      {mode === 'choix' && (
        <select value="" onChange={(e) => choisirMode(e.target.value)} aria-label="Code de couleur" className="code-choix">
          <option value="" disabled>Code…</option>
          <option value="packs">Choisir dans mes packs de couleurs</option>
          <option value="manuel">Écrire manuellement</option>
          {value && <option value="garder">Garder : {value}</option>}
        </select>
      )}
      {mode === 'manuel' && (
        <textarea
          ref={champ}
          rows={1}
          autoFocus
          maxLength={120}
          placeholder="ex: PC-242"
          aria-label="Code de couleur"
          value={value}
          onChange={(e) => onChange(e.target.value, '')}
          onBlur={() => value.trim() && setMode('rempli')}
        />
      )}
      {packs && (
        <ChoixCrayon
          // Rappel de la ligne qu'on remplit : symbole, lettre ou numéro, et nom de la couleur
          rappel={<>Couleur pour <span style={{ fontSize: '1.4rem', fontFamily: 'var(--typo-code)', minWidth: '28px', textAlign: 'center', lineHeight: 1 }}><Glyph v={sym} /></span>{label?.trim() ? <span style={{ fontWeight: 400, overflowWrap: 'anywhere' }}>· {label}</span> : null}</>}
          onFermer={() => setPacks(false)}
          onManuel={() => { setPacks(false); choisirMode('manuel'); }}
          onChoisir={(c) => { onChange(`${c.code} ${c.marque}`.trim(), c.hex || ''); setPacks(false); setMode('rempli'); }}
        />
      )}
    </>
  );
}

// Étiquette d'une couleur (ex. Ombre de la casquette) : passe à la ligne et grandit, jusqu'à 100 caractères
function ChampEtiquette({ value, onChange }) {
  const champ = useHauteurAuto([value]);
  return (
    <textarea ref={champ} rows={1} maxLength={100} className="champ-etiquette"
      placeholder="ex: Cheveux, Pelage..." aria-label="Nom de la couleur"
      value={value} onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))} />
  );
}

// colonnes : nombre de colonnes de codes dans l'image exportée (2 à l'écran)
function Groupe({ g, maj, retirer, enExport, colonnes = 2, changerCode, codePour = () => null }) {
  const [glisserIndex, setGlisserIndex] = useState(null);

  // Nouveau symbole choisi pour une ligne sans code : elle reçoit tout de suite le code de ce symbole dans ce coloriage
  const setRow = (id, k, v) => maj({ ...g, rows: g.rows.map((r) => {
    if (r.id !== id) return r;
    const code = k === 'sym' && !r.num ? codePour(v, id) : null;
    return code ? { ...r, [k]: v, num: code.num, hex: code.hex } : { ...r, [k]: v };
  }) });

  // Nouvelle ligne : symbole suivant, avec son code s'il est déjà choisi ailleurs dans ce coloriage
  const ajouter = () => {
    const sym = suivant(g.rows.at(-1)?.sym);
    const code = codePour(sym);
    maj({ ...g, rows: [...g.rows, { id: uid(), label: '', sym, num: code?.num || '', hex: code?.hex || '' }] });
  };

  const deplacer = (from, to) => {
    if (to < 0 || to >= g.rows.length) return;
    const nvlRows = [...g.rows];
    const [element] = nvlRows.splice(from, 1);
    nvlRows.splice(to, 0, element);
    maj({ ...g, rows: nvlRows });
  };

  const retirerLigne = (rowId) => {
    if (window.confirm('Es-tu sûr de vouloir supprimer cette couleur ?')) {
      maj({ ...g, rows: g.rows.filter((x) => x.id !== rowId) });
    }
  };

  // Les codes se lisent colonne par colonne : on remplit la première, puis la suivante
  const nbColonnes = enExport ? colonnes : 2;
  const parColonne = Math.ceil(g.rows.length / nbColonnes);
  const colonnesCodes = Array.from({ length: nbColonnes }, (_, c) => g.rows.slice(c * parColonne, (c + 1) * parColonne));

  // Image exportée : une ligne compacte (symbole à gauche, nom de la couleur et code à droite) pour que l'image reste courte
  const RendreLigneExport = (r) => (
    <div className="code-export" key={r.id}>
      <SymbolPicker value={r.sym} onChange={() => {}} />
      <div style={{ minWidth: 0 }}>
        {r.label?.trim() && <div className="code-export-nom">{r.label}</div>}
        <ChampCodeCouleur value={r.num} hex={r.hex} enExport />
      </div>
    </div>
  );

  const RendreLigne = (r, reelIdx) => enExport ? RendreLigneExport(r) : (
    <div 
      className={`item-code-bloc ${glisserIndex === reelIdx ? 'glisser' : ''}`} 
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
      style={{ display: 'flex', flexDirection: enExport ? 'column' : 'row', alignItems: 'stretch', gap: '2px', margin: '6px 0', minWidth: 0 }}
    >
      {/* Nom de la couleur au-dessus, puis le symbole et le code (comme dans l'image exportée) ;
          en modification, les flèches et le X sont en colonne à droite pour laisser toute la largeur au nom,
          ce qui permet 2 colonnes même sur un petit téléphone */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {enExport ? (
          r.label?.trim() ? (
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: '4px 0 2px 0', textTransform: 'capitalize' }}>
              {r.label}
            </div>
          ) : null
        ) : (
          <ChampEtiquette value={r.label || ''} onChange={(v) => setRow(r.id, 'label', v)} />
        )}

        <div className="ligne">
          <SymbolPicker value={r.sym} onChange={(v) => setRow(r.id, 'sym', v)} />
          <ChampCodeCouleur value={r.num} hex={r.hex} enExport={enExport} sym={r.sym} label={r.label}
            onChange={(num, hex) => changerCode(r.id, num, hex)} />
        </div>
      </div>

      {!enExport && (
        <div className="actions-code">
          <button type="button" className="fleche" disabled={reelIdx === 0} aria-label="Monter" onClick={() => deplacer(reelIdx, reelIdx - 1)}>▲</button>
          <button type="button" className="fleche" disabled={reelIdx === g.rows.length - 1} aria-label="Descendre" onClick={() => deplacer(reelIdx, reelIdx + 1)}>▼</button>
          <button type="button" className="retirer" aria-label="Retirer la ligne" onClick={() => retirerLigne(r.id)}><X size={14} aria-hidden="true" /></button>
        </div>
      )}
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
        <button type="button" className="retirer" aria-label="Retirer la sous-catégorie" onClick={retirer}><X size={14} aria-hidden="true" /></button>
      </div>

      <div className="grille-codes-deux-colonnes">
        {colonnesCodes.map((liste, c) => (
          <div className="colonne-codes" key={c}>
            {liste.map((r, i) => RendreLigne(r, c * parColonne + i))}
          </div>
        ))}
      </div>

      <button type="button" className="plus" aria-label="Ajouter une ligne" onClick={ajouter}>+</button>
    </section>
  );
}

export default function Editor({ page, initial, bibliotheque = [], mesTypes = [], tomeCatalogue = null, palette: paletteInitiale = null }) {
  const acc = useAccord(); // accord au genre de la personne connectée (le féminin prime)
  // Palette de couleurs dont s'inspire le coloriage (affichée dans la Communauté)
  const [palette, setPalette] = useState(paletteInitiale);
  const pageRef = useRef(null);

  // initial : pré-remplissage d'une nouvelle fiche (ex. depuis la grille d'un tome)
  const [f, setF] = useState({ title: page?.title ?? '', tome: page?.tome ?? initial?.tome ?? '', page_no: page?.page_no ?? initial?.page_no ?? '', memo: page?.memo ?? '' });
  // Tome choisi dans la bibliothèque (type et nombre de pages connus, ou tome perso)
  const tomeChoisi = bibliotheque.find((t) => t.nom.toLowerCase() === (f.tome || '').toLowerCase());
  // Publication dans la communauté : le type vient du tome ; le choix ne s'affiche qu'aux personnes qui font plusieurs types
  const typesProposes = TYPES_COLORIAGE.filter((t) => !mesTypes.length || mesTypes.includes(t.valeur));
  const [publiee, setPubliee] = useState(Boolean(page?.publiee));
  const [typeColo, setTypeColo] = useState(page?.type_coloriage || '');
  const typeDuTome = ['mystere', 'cozy', 'autre'].includes(tomeChoisi?.type) ? tomeChoisi.type : '';
  const typeFinal = typeColo || typeDuTome || (typesProposes.length === 1 ? typesProposes[0].valeur : '');
  const [groupes, setGroupes] = useState(() => normaliser(page?.codes));
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(page?.has_image ? `/api/pages/${page.id}/image?s=${page.img_size || 0}` : null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');
  const [enExport, setEnExport] = useState(false);
  // Mots-clefs d'un nouveau coloriage, enregistrés avec lui
  const [motsAttente, setMotsAttente] = useState([]);
  // Message « Coloriage enregistré » après un enregistrement (?enregistre=1), puis l'adresse est nettoyée
  const [enregistre, setEnregistre] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('enregistre')) {
      setEnregistre(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  // Contenu non enregistré : on demande avant de quitter la page (lien, touche Retour, fermeture de l'onglet)
  const etatPage = JSON.stringify({ f, groupes, publiee, typeColo, palette: palette?.id || null, image: Boolean(image) });
  const etatDepart = useRef(etatPage);
  const { confirmer: confirmerQuitter, liberer: libererPage } = useGardeQuitter(etatPage !== etatDepart.current,
    `Es-tu ${acc('sûre', 'sûr')} de vouloir quitter cette page ? Tu perdras tout le contenu de cette page.`);
  // Logo de Kromadex déjà converti en image intégrée : html-to-image n'a rien à télécharger pendant l'export,
  // donc le logo apparaît toujours en bas de l'image
  const [logoExport, setLogoExport] = useState('/logo.svg');
  useEffect(() => {
    fetch('/logo.svg').then((r) => r.text())
      .then((svg) => setLogoExport(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`))
      .catch(() => {});
  }, []);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  // Changer de tome vide la page si elle dépasse le nombre de pages du nouveau tome
  function choisirTome(nom) {
    const t = bibliotheque.find((x) => x.nom.toLowerCase() === nom.toLowerCase());
    setF((s) => ({ ...s, tome: nom, page_no: t?.total && Number(s.page_no) > t.total ? '' : s.page_no }));
  }

  // Pages déjà coloriées du tome choisi : on les signale dans la liste et on demande avant de créer un doublon
  const pagesFaites = new Set(tomeChoisi?.faites || []);
  function choisirPage(n) {
    const v = String(n).trim();
    if (v && pagesFaites.has(v) && !confirm(`Tu as déjà fait cette page, es-tu ${acc('sûre', 'sûr')} de vouloir créer un doublon ?`)) {
      if (!tomeChoisi?.total) set('page_no', ''); // la liste garde la page d'avant
      return;
    }
    set('page_no', v);
  }

  async function choisir(e) {
    const x = e.target.files[0]; if (!x) return;
    const b = await reduire(x); setImage(b); setApercu(URL.createObjectURL(b));
  }

  const majGroupe = (g) => setGroupes((l) => l.map((x) => (x.id === g.id ? g : x)));
  // Code couleur d'une ligne : les autres lignes du même symbole de ce coloriage suivent (lib/codesCouleurs.js)
  const changerCode = (rowId, num, hex) => setGroupes((l) => appliquerCode(l, rowId, num, hex));
  const retirerGroupe = (g) => {
    if (g.rows.length && !confirm('Retirer cette sous-catégorie et ses codes?')) return;
    setGroupes((l) => l.filter((x) => x.id !== g.id));
  };

  // Image exportée : plus il y a de codes, plus elle s'élargit (2, 3 ou 4 colonnes) pour rester à peu près carrée
  const nbCodes = groupes.reduce((n, g) => n + (g.rows?.length || 0), 0);
  const exportColonnes = nbCodes <= 12 ? 2 : nbCodes <= 30 ? 3 : 4;

  // L'image est faite à partir d'une copie hors de l'écran : la page visible ne bouge pas pendant l'export
  async function exporterEnImage() {
    setEnExport(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      if (!pageRef.current) throw new Error('Copie introuvable');
      // Attendre que la photo et le logo de la copie soient chargés avant de faire l'image
      await Promise.all([...pageRef.current.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
      const dataUrl = await toPng(pageRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${f.title || 'coloriage'}-kromadex.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors de l’export :', err);
      alert('Impossible d’exporter l’image.');
    } finally {
      setEnExport(false);
    }
  }

  async function enregistrer() {
    if (!f.title.trim()) return;
    setBusy(true); setErreur('');
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v));
    const groupesPropres = groupes.map((g) => ({
      ...g,
      rows: (g.rows || []).map((row) => ({ id: row.id || uid(), label: row.label || '', sym: row.sym || '', num: row.num || '', hex: /^#[0-9a-f]{6}$/i.test(row.hex || '') ? row.hex : '' })),
    }));
    fd.append('codes', JSON.stringify(groupesPropres));
    fd.append('publiee', publiee ? '1' : '0');
    fd.append('type_coloriage', typeFinal);
    fd.append('palette_id', palette ? String(palette.id) : '');
    if (image) fd.append('image', image, 'image.jpg');
    // Nouveau coloriage : les mots-clefs ajoutés avant l'enregistrement partent avec lui
    if (!page) fd.append('mots_cles_attente', JSON.stringify(motsAttente));

    const res = await fetch(page ? `/api/pages/${page.id}` : '/api/pages', { method: page ? 'PUT' : 'POST', body: fd, cache: 'no-store' });
    // Enregistré : on reste sur ce coloriage (rechargé depuis la base, avec un message de confirmation)
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      libererPage();
      window.location.replace(`/pages/${page?.id || d.id}?enregistre=1`);
      return;
    }
    const reponseJson = await res.json().catch(() => ({}));
    const message = reponseJson.error || `Erreur ${res.status} ${res.statusText || 'API/PAGES'}`;
    setErreur(`Attention, l'application n'est pas en mesure de sauvegarder, ${message}`);
    setBusy(false);
  }

  async function supprimer() {
    if (!confirm('Supprimer ce coloriage pour toujours?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pages/${page.id}`, { method: 'DELETE', cache: 'no-store' });
      if (res.ok) {
        libererPage();
        window.location.href = '/coloriages';
      } else {
        const json = await res.json().catch(() => ({}));
        alert(`Erreur de suppression : ${json.error || res.statusText}`);
        setBusy(false);
      }
    } catch {
      alert('Impossible de joindre le serveur pour supprimer.');
      setBusy(false);
    }
  }

  // Contenu de la fiche ; exp = version image (sans champs ni boutons)
  const contenu = (exp) => (
    <>
      <div className="haut">
        <div className="gauche">
          <div className="cadre-image">
            {apercu ? <img key={apercu} src={apercu} alt="" /> : <span>Ajoute ton image</span>}
          </div>
          {!exp && <label className="btn alt">Choisir une photo<input type="file" accept="image/*" hidden onChange={choisir} /></label>}
        </div>
        <div className="droite">
          {exp ? (
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
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.8rem' }}>Tome ou livre</span>
                  <ChoixTome valeur={f.tome} bibliotheque={bibliotheque} onChange={choisirTome} />
                </div>
                {/* Page : liste des pages quand le nombre de pages du tome est connu, sinon champ libre */}
                <label>Page
                  {tomeChoisi?.total ? (
                    <select value={f.page_no} onChange={(e) => choisirPage(e.target.value)}>
                      <option value="">Choisir</option>
                      {Array.from({ length: tomeChoisi.total }, (_, i) => String(i + 1)).map((n) => (
                        <option key={n} value={n}>{pagesFaites.has(n) ? `${n} - Page déjà faite` : n}</option>
                      ))}
                    </select>
                  ) : (
                    <input inputMode="numeric" value={f.page_no} onChange={(e) => set('page_no', e.target.value)}
                      onBlur={(e) => e.target.value && choisirPage(e.target.value)} />
                  )}
                </label>
              </div>

              {palette && (
                <div style={{ border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <small style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>Inspiré de la palette de couleurs : {palette.nom || 'Sans titre'}</small>
                    <button type="button" className="btn alt" aria-label="Retirer la palette" onClick={() => setPalette(null)} style={{ minWidth: '44px', minHeight: '44px', padding: 0, flex: '0 0 auto' }}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', borderRadius: 'var(--rayon-s)', overflow: 'hidden', height: '28px', border: '1px solid var(--bordure-carte)' }}>
                    {palette.couleurs.map((c, i) => <span key={i} style={{ flex: 1, background: c }} />)}
                  </div>
                </div>
              )}

              <label>Mémo
                <textarea rows={3} maxLength={1000} placeholder="ex: fond fait au Ohuhu, reste les cheveux…" value={f.memo}
                  onChange={(e) => set('memo', e.target.value)} style={{ width: '100%', resize: 'vertical', font: 'inherit' }} />
              </label>

              {/* Partage dans la communauté (le mémo reste privé) */}
              <div style={{ border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={publiee} onChange={(e) => setPubliee(e.target.checked)} style={{ width: '22px', height: '22px', margin: 0 }} />
                  Publier dans la communauté
                </label>
                {publiee && (
                  <>
                    {typesProposes.length > 1 && (
                      <>
                        <small style={{ color: 'var(--texte-secondaire)' }}>Type de coloriage</small>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {typesProposes.map((t) => (
                            <button key={t.valeur} type="button" onClick={() => setTypeColo(t.valeur)}
                              className={typeFinal === t.valeur ? 'btn' : 'btn alt'}
                              style={{ minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem' }}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                        {!typeFinal && <small style={{ color: 'var(--danger)' }}>Choisis le type pour publier.</small>}
                      </>
                    )}
                    <small style={{ color: 'var(--texte-secondaire)' }}>Ta photo, le titre, le tome, la page et tes codes couleurs seront visibles. Ton mémo reste privé.</small>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="titre-codes">Codes couleurs</h3>

      <div className="liste-sous-categories">
        {groupes.map((g) => (
          <Groupe key={g.id} g={g} maj={majGroupe} retirer={() => retirerGroupe(g)} enExport={exp} colonnes={exportColonnes} changerCode={changerCode} codePour={(sym, saufId) => codeDuSymbole(groupes, sym, saufId)} />
        ))}
        {!exp && (
          <button type="button" className="btn alt ajout-groupe ajout-groupe-bas" onClick={() => setGroupes((l) => { const g = groupeVide(); Object.assign(g.rows[0], codeDuSymbole(l, g.rows[0].sym) || {}); return [...l, g]; })}>
            + Sous-catégorie
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="barre">
        <button className="btn alt" onClick={() => { if (confirmerQuitter()) { libererPage(); window.location.href = '/coloriages'; } }}>Retour</button>
        <button type="button" className="btn alt" onClick={exporterEnImage} disabled={enExport}>
          <Camera size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }} />{enExport ? 'Export…' : 'Exporter en image'}
        </button>
        {page && <button className="btn danger" onClick={supprimer}>Supprimer</button>}
        <button className="btn btn-save" onClick={enregistrer} disabled={busy || !f.title.trim() || (publiee && !typeFinal)}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>

      {/* Coloriage déjà enregistré : mots-clefs du coloriage (et de sa page dans le tome) */}
      {/* Nouveau coloriage : les mots-clefs sont gardés et enregistrés avec lui */}
      {page
        ? <MotsClesColoriage pageId={page.id} tome={tomeCatalogue} pageNo={page.page_no} image={page.has_image ? `/api/pages/${page.id}/image?s=${page.img_size || 0}` : null} />
        : <MotsClesColoriage tomeNom={f.tome} pageNo={f.page_no} image={apercu} enAttente={motsAttente} onAttente={setMotsAttente} />}

      {enregistre && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-doux)', padding: '4px 4px 4px 16px', borderRadius: '8px', margin: '12px 0', fontWeight: 'bold' }}>
          <Check size={18} aria-hidden="true" /> <span style={{ flex: 1 }}>Coloriage enregistré</span>
          <button type="button" aria-label="Fermer" onClick={() => setEnregistre(false)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', minWidth: '44px', minHeight: '44px', color: 'inherit' }}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {erreur && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5', margin: '12px 0', fontWeight: 'bold', textAlign: 'center' }}>
          <AlertTriangle size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          {erreur}
        </div>
      )}

      <div className="zone-export-conteneur" style={{ background: 'var(--arriere-plan, #e4f0ec)', padding: 'var(--espace-2)' }}>
        {contenu(false)}
      </div>

      {/* Copie pour l'image, hors de l'écran, avec le logo et l'adresse de Kromadex en bas */}
      {enExport && (
        <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}>
          <div ref={pageRef} className="zone-export-conteneur mode-export"
            style={{ background: 'var(--arriere-plan, #e4f0ec)', '--largeur-export': `${LARGEUR_EXPORT[exportColonnes]}px` }}>
            {contenu(true)}
            <div className="pied-export">
              {/* Le logo (4228 x 732) a une taille fixe : sans largeur ni hauteur propres, il pouvait disparaître de l'image */}
              <img src={logoExport} alt="Kromadex" width={162} height={28} style={{ width: '162px', height: '28px' }} />
              <span>app.kromadex.com</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
