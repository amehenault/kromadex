'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Palette as IconePalette, Users, RefreshCw, Save, Share2, Trash2, Plus, Minus, X, Pencil, ImagePlus } from 'lucide-react';
import { genererPalettes, crayonLePlusProche, MIN_COULEURS, MAX_COULEURS } from '@/lib/palettes';
import { Avatar, BoutonJaime, imagePage } from '@/app/communaute/outils';
import FicheDetail from '@/app/communaute/ficheDetail';
import Pseudo from '@/components/Pseudo';
import TexteErreur from '@/components/TexteErreur';

const json = (url, method = 'GET', corps) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: corps && JSON.stringify(corps) }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

const nomPack = (p) => [p.marque, p.sorte, p.gamme].filter(Boolean).join(' ');

// Crayons à utiliser pour une palette : le plus proche de chaque couleur, dans les packs choisis, sans doublon
function codesPour(couleurs, packs, crayons) {
  const dispo = crayons.filter((c) => packs.includes(c.pack));
  if (!dispo.length) return [];
  const vus = new Set();
  return couleurs.map((hex) => crayonLePlusProche(hex, dispo)).filter((c) => {
    const cle = `${c.pack}:${c.code || c.nom}`;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  }).map((c) => ({ hex: c.hex, code: c.code || '', nom: c.nom || '' }));
}

// Une suggestion dans des packs précis : chaque couleur devient le crayon le plus proche (une seule fois chaque crayon)
function ajusterAuxPacks(palette, packs, crayons) {
  const codes = codesPour(palette.couleurs, packs, crayons);
  return codes.length >= MIN_COULEURS ? { ...palette, couleurs: codes.map((c) => c.hex) } : palette;
}

// Palettes de couleurs (Cozy colo) : suggestions, mes palettes et palettes partagées par la communauté
export default function Palettes() {
  const [onglet, setOnglet] = useState('suggestions');
  const [crayons, setCrayons] = useState([]);
  const [packs, setPacks] = useState([]);
  const [packsChoisis, setPacksChoisis] = useState([]); // [] = sans pack précis
  const [nombre, setNombre] = useState(5);
  const [suggestions, setSuggestions] = useState([]);
  const [mes, setMes] = useState([]);
  const [communaute, setCommunaute] = useState([]);
  const [message, setMessage] = useState('');
  const [creation, setCreation] = useState(null); // { id?, nom, couleurs, packs, partagee? }
  const [erreurCreation, setErreurCreation] = useState('');
  const [fiche, setFiche] = useState(null);

  async function chargerMes() { const r = await json('/api/palettes?vue=mes'); if (r.ok) setMes(r.palettes || []); }
  async function chargerCommunaute() { const r = await json('/api/palettes?vue=communaute'); if (r.ok) setCommunaute(r.palettes || []); }

  useEffect(() => {
    json('/api/palettes?vue=crayons').then((r) => { if (r.ok) { setCrayons(r.crayons || []); setPacks(r.packs || []); } });
    chargerMes();
    chargerCommunaute();
  }, []);
  const generer = () => setSuggestions(genererPalettes(nombre).map((p) => (packsChoisis.length ? ajusterAuxPacks(p, packsChoisis, crayons) : p)));
  useEffect(generer, [nombre, packsChoisis, crayons]); // eslint-disable-line react-hooks/exhaustive-deps

  async function enregistrer(p, partagee = false) {
    const corps = { nom: p.nom, couleurs: p.couleurs, packs: p.packs || [], partagee };
    const r = p.id ? await json('/api/palettes', 'PUT', { id: p.id, ...corps, partagee: partagee || p.partagee }) : await json('/api/palettes', 'POST', corps);
    if (r.ok) {
      setMessage(p.id ? 'Palette modifiée.' : partagee ? 'Palette enregistrée et partagée.' : 'Palette enregistrée dans Mes palettes.');
      chargerMes(); chargerCommunaute();
    } else setMessage(r.error || 'Enregistrement impossible.');
    return r;
  }
  async function enregistrerCreation(partagee) {
    setErreurCreation('');
    // Dans des packs précis, la palette garde la couleur exacte des crayons
    const p = creation.packs.length ? ajusterAuxPacks(creation, creation.packs, crayons) : creation;
    const r = await enregistrer(p, partagee);
    if (r.ok) { setCreation(null); setOnglet('mes'); } else setErreurCreation(r.error || 'Enregistrement impossible.');
  }
  async function basculerPartage(p) {
    const r = await json('/api/palettes', 'PUT', { id: p.id, partagee: !p.partagee });
    if (r.ok) { chargerMes(); chargerCommunaute(); setMessage(p.partagee ? 'Palette retirée de la communauté.' : 'Palette partagée avec la communauté.'); }
  }
  async function supprimer(p) {
    if (!confirm('Supprimer cette palette ?')) return;
    await json('/api/palettes', 'DELETE', { id: p.id });
    chargerMes(); chargerCommunaute();
  }
  async function aimer(p) {
    const r = await json('/api/palettes', 'POST', { like: p.id });
    if (r.ok) setCommunaute((l) => l.map((x) => (x.id === p.id ? { ...x, aime: r.aime, likes: r.likes } : x)));
  }

  const Bandes = ({ couleurs }) => (
    <div style={{ display: 'flex', borderRadius: 'var(--rayon-m)', overflow: 'hidden', height: '56px', border: '1px solid var(--bordure-carte)' }}>
      {couleurs.map((c, i) => <span key={i} title={c} style={{ flex: 1, background: c }} />)}
    </div>
  );
  // Un cercle par crayon, avec son code (ou son nom s'il n'a pas de code)
  const Codes = ({ codes, nomsPacks }) => (
    codes?.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '8px' }}>
          {codes.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0, textAlign: 'center' }}>
              <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: c.hex, border: '1px solid var(--bordure-carte)' }} />
              <small style={{ fontWeight: 700, overflowWrap: 'anywhere', lineHeight: 1.2 }}>{c.code || c.nom || c.hex}</small>
            </div>
          ))}
        </div>
        {nomsPacks?.length > 0 && <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{nomsPacks.length > 1 ? 'Packs' : 'Pack'} : {nomsPacks.join(', ')}</small>}
      </div>
    ) : null
  );
  const nomsDe = (ids) => ids.map((id) => packs.find((p) => p.id === id)).filter(Boolean).map(nomPack);

  // Choix des packs de crayons : aucun = sans pack précis
  const ChoixPacks = ({ valeur, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <b>Pack de crayons à utiliser</b>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button type="button" className={!valeur.length ? 'btn' : 'btn alt'} aria-pressed={!valeur.length} onClick={() => onChange([])}
          style={{ minHeight: '44px', fontSize: '0.85rem', padding: '6px 10px' }}>Sans pack précis</button>
        {packs.map((p) => {
          const actif = valeur.includes(p.id);
          return (
            <button key={p.id} type="button" className={actif ? 'btn' : 'btn alt'} aria-pressed={actif}
              onClick={() => onChange(actif ? valeur.filter((x) => x !== p.id) : [...valeur, p.id])}
              style={{ minHeight: '44px', fontSize: '0.85rem', padding: '6px 10px', textAlign: 'left', overflowWrap: 'anywhere', maxWidth: '100%' }}>
              {nomPack(p)}
            </button>
          );
        })}
      </div>
      {!packs.length && (
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Ajoute tes coffrets dans <Link href="/profil/collection">Mes coffrets de crayons</Link> pour générer une palette avec tes crayons.
        </small>
      )}
    </div>
  );

  // Coloriages publiés qui s'inspirent de la palette
  const Coloriages = ({ liste }) => (
    liste?.length ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <b style={{ fontSize: '0.9rem' }}>Coloriages inspirés</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {liste.map((g) => (
            <button key={g.id} type="button" onClick={() => setFiche(g.id)} aria-label={`Voir ${g.titre || 'le coloriage'}`}
              style={{ padding: 0, border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', cursor: 'pointer', aspectRatio: '1' }}>
              <img src={imagePage(g)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </div>
    ) : null
  );
  const BoutonColoriage = ({ p }) => (
    <Link href={`/pages/new?palette=${p.id}`} className="btn alt" style={petit}><ImagePlus size={16} aria-hidden="true" /> Ajouter un coloriage avec cette palette</Link>
  );

  const codesCreation = useMemo(() => (creation ? codesPour(creation.couleurs, creation.packs, crayons) : []), [creation, crayons]);
  const ONGLETS = [['suggestions', 'Suggestions', Sparkles], ['mes', 'Mes palettes', IconePalette], ['communaute', 'Communauté', Users]];
  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', textAlign: 'left' };

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Palettes de couleurs</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone]) => (
          <button key={cle} type="button" onClick={() => { setOnglet(cle); setMessage(''); }} className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '54px', padding: '6px 4px', fontSize: '0.82rem', minWidth: 0 }}>
            <Icone size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {message && <p className="carte" style={{ margin: '0 0 var(--espace-3)', fontWeight: 700 }}><TexteErreur texte={message} /></p>}

      {onglet === 'suggestions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: 0 }}>
            <ChoixPacks valeur={packsChoisis} onChange={setPacksChoisis} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <b>Nombre de couleurs</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" className="btn alt" aria-label="Moins de couleurs" disabled={nombre <= MIN_COULEURS} onClick={() => setNombre(nombre - 1)} style={{ minWidth: '44px', minHeight: '44px', padding: 0 }}><Minus size={18} aria-hidden="true" /></button>
                <b style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>{nombre}</b>
                <button type="button" className="btn alt" aria-label="Plus de couleurs" disabled={nombre >= MAX_COULEURS} onClick={() => setNombre(nombre + 1)} style={{ minWidth: '44px', minHeight: '44px', padding: 0 }}><Plus size={18} aria-hidden="true" /></button>
              </div>
            </div>
            <button type="button" className="btn" onClick={generer} style={{ ...petit, width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={16} aria-hidden="true" /> Plus de suggestions
            </button>
          </div>
          {suggestions.map((p, i) => {
            const enPacks = { ...p, packs: packsChoisis };
            return (
              <div key={i} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <b style={{ textTransform: 'capitalize' }}>{p.nom}</b>
                <Bandes couleurs={p.couleurs} />
                <Codes codes={codesPour(p.couleurs, packsChoisis, crayons)} nomsPacks={nomsDe(packsChoisis)} />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn alt" style={petit} onClick={() => enregistrer(enPacks)}><Save size={16} aria-hidden="true" /> Enregistrer</button>
                  <button type="button" className="btn alt" style={petit} onClick={() => { setErreurCreation(''); setCreation({ nom: p.nom, couleurs: [...p.couleurs], packs: [...packsChoisis] }); }}>
                    <Pencil size={16} aria-hidden="true" /> Modifier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onglet === 'mes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button type="button" className="btn btn-corail" onClick={() => { setErreurCreation(''); setCreation({ nom: '', couleurs: ['#F4C7C3', '#B5D8CC', '#F9E2AE'], packs: [] }); }}
            style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} aria-hidden="true" /> Créer ma palette
          </button>
          {!mes.length && <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucune palette enregistrée pour l’instant.</p>}
          {mes.map((p) => (
            <div key={p.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <b style={{ overflowWrap: 'anywhere' }}>{p.nom || 'Sans titre'}{p.partagee ? ' · partagée' : ''}</b>
              <Bandes couleurs={p.couleurs} />
              <Codes codes={p.codes} nomsPacks={p.noms_packs} />
              <Coloriages liste={p.coloriages} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" className="btn alt" style={petit}
                  onClick={() => { setErreurCreation(''); setCreation({ id: p.id, nom: p.nom || '', couleurs: [...p.couleurs], packs: [...(p.packs || [])], partagee: p.partagee }); }}>
                  <Pencil size={16} aria-hidden="true" /> Modifier
                </button>
                <button type="button" className={p.partagee ? 'btn alt' : 'btn'} style={petit} onClick={() => basculerPartage(p)}>
                  <Share2 size={16} aria-hidden="true" /> {p.partagee ? 'Ne plus partager' : 'Partager'}
                </button>
                <BoutonColoriage p={p} />
                <button type="button" className="btn alt danger" style={petit} onClick={() => supprimer(p)}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === 'communaute' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!communaute.length && <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucune palette partagée pour l’instant. Partage la tienne depuis « Mes palettes ».</p>}
          {communaute.map((p) => (
            <div key={p.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href={`/membre/${p.auteur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'inherit', flex: 1, minWidth: 0, minHeight: '44px' }}>
                  <Avatar x={{ user_id: p.auteur_id, a_avatar: p.a_avatar, avatar_maj: p.avatar_maj }} taille={28} />
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{p.nom || 'Sans titre'}</b>
                    <small><Pseudo x={p} /></small>
                  </span>
                </Link>
                <BoutonJaime aime={p.aime} likes={p.likes} onClick={() => aimer(p)} />
              </div>
              <Bandes couleurs={p.couleurs} />
              <Codes codes={p.codes} nomsPacks={p.noms_packs} />
              <Coloriages liste={p.coloriages} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" className="btn alt" style={petit} onClick={() => enregistrer({ nom: p.nom, couleurs: p.couleurs, packs: p.packs || [] })}>
                  <Save size={16} aria-hidden="true" /> Enregistrer dans mes palettes
                </button>
                <BoutonColoriage p={p} />
              </div>
            </div>
          ))}
        </div>
      )}

      {creation && (
        <div data-feuille onClick={() => setCreation(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{creation.id ? 'Modifier ma palette' : 'Ma palette'}</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setCreation(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} aria-hidden="true" /></button>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>Titre
              <input value={creation.nom} onChange={(e) => setCreation({ ...creation, nom: e.target.value })} maxLength={60} placeholder="ex. Chalet d'hiver" />
            </label>
            <ChoixPacks valeur={creation.packs} onChange={(v) => setCreation({ ...creation, packs: v })} />
            <Bandes couleurs={creation.couleurs} />
            <small style={{ color: 'var(--texte-secondaire)' }}>Touche une couleur pour la changer ({creation.couleurs.length} / {MAX_COULEURS}).</small>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
              {creation.couleurs.map((c, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <input type="color" value={c} aria-label={`Couleur ${i + 1}`}
                    onChange={(e) => setCreation({ ...creation, couleurs: creation.couleurs.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)) })}
                    style={{ width: '100%', height: '48px', padding: 0, border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-s)' }} />
                  {creation.couleurs.length > MIN_COULEURS && (
                    <button type="button" aria-label={`Retirer la couleur ${i + 1}`} onClick={() => setCreation({ ...creation, couleurs: creation.couleurs.filter((_, j) => j !== i) })}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', minHeight: '44px', minWidth: '44px', color: 'var(--texte-secondaire)' }}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {creation.couleurs.length < MAX_COULEURS && (
              <button type="button" className="btn alt" style={petit} onClick={() => setCreation({ ...creation, couleurs: [...creation.couleurs, '#CCCCCC'] })}>
                <Plus size={16} aria-hidden="true" /> Ajouter une couleur
              </button>
            )}
            {codesCreation.length > 0 && (
              <>
                <b style={{ fontSize: '0.9rem' }}>Crayons à utiliser</b>
                <Codes codes={codesCreation} nomsPacks={nomsDe(creation.packs)} />
              </>
            )}
            {erreurCreation && <p style={{ margin: 0, color: 'var(--danger, #b3261e)', fontWeight: 700 }}><TexteErreur texte={erreurCreation} /></p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button type="button" className="btn" style={{ ...petit, justifyContent: 'center' }} onClick={() => enregistrerCreation(false)}>
                <Save size={16} aria-hidden="true" /> Enregistrer
              </button>
              <button type="button" className="btn btn-corail" style={{ ...petit, justifyContent: 'center' }} onClick={() => enregistrerCreation(true)}>
                <Share2 size={16} aria-hidden="true" /> Enregistrer et partager
              </button>
            </div>
          </div>
        </div>
      )}

      {fiche && <FicheDetail id={fiche} onFermer={() => setFiche(null)} />}
    </div>
  );
}
