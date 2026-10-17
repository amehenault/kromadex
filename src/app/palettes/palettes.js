'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Palette as IconePalette, Users, RefreshCw, Save, Share2, Trash2, Plus, Minus, X } from 'lucide-react';
import { genererPalettes, crayonLePlusProche, MIN_COULEURS, MAX_COULEURS } from '@/lib/palettes';
import { Avatar, BoutonJaime, nomAuteur } from '@/app/communaute/outils';

const json = (url, method = 'GET', corps) =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: corps && JSON.stringify(corps) }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

// Palettes de couleurs (Cozy colo) : suggestions, mes palettes et palettes partagées par la communauté
export default function Palettes() {
  const [onglet, setOnglet] = useState('suggestions');
  const [crayons, setCrayons] = useState([]);
  const [nombre, setNombre] = useState(5);
  const [suggestions, setSuggestions] = useState([]);
  const [mes, setMes] = useState([]);
  const [communaute, setCommunaute] = useState([]);
  const [message, setMessage] = useState('');
  const [creation, setCreation] = useState(null); // { nom, couleurs }

  async function chargerMes() { const r = await json('/api/palettes?vue=mes'); if (r.ok) setMes(r.palettes || []); }
  async function chargerCommunaute() { const r = await json('/api/palettes?vue=communaute'); if (r.ok) setCommunaute(r.palettes || []); }

  useEffect(() => {
    json('/api/palettes?vue=crayons').then((r) => r.ok && setCrayons(r.crayons || []));
    chargerMes();
    chargerCommunaute();
  }, []);
  useEffect(() => { setSuggestions(genererPalettes(nombre)); }, [nombre]);

  async function enregistrer(p, partagee = false) {
    const r = await json('/api/palettes', 'POST', { nom: p.nom, couleurs: p.couleurs, partagee });
    setMessage(r.ok ? (partagee ? 'Palette enregistrée et partagée' : 'Palette enregistrée dans Mes palettes') : r.error);
    if (r.ok) { chargerMes(); if (partagee) chargerCommunaute(); }
    return r.ok;
  }
  async function basculerPartage(p) {
    const r = await json('/api/palettes', 'PUT', { id: p.id, partagee: !p.partagee });
    if (r.ok) { chargerMes(); chargerCommunaute(); setMessage(p.partagee ? 'Palette retirée de la communauté' : 'Palette partagée avec la communauté'); }
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

  // Une palette : bandes de couleurs et crayon le plus proche de chaque couleur
  const Bandes = ({ couleurs }) => (
    <div style={{ display: 'flex', borderRadius: 'var(--rayon-m)', overflow: 'hidden', height: '56px', border: '1px solid var(--bordure-carte)' }}>
      {couleurs.map((c, i) => <span key={i} title={c} style={{ flex: 1, background: c }} />)}
    </div>
  );
  const Crayons = ({ couleurs }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 10px' }}>
      {couleurs.map((c, i) => {
        const proche = crayonLePlusProche(c, crayons);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid var(--bordure-carte)', flex: '0 0 auto' }} />
            {proche ? (
              <>
                <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', background: proche.hex, border: '1px solid var(--bordure-carte)', flex: '0 0 auto' }} />
                <small style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${proche.marque} ${proche.gamme} - ${proche.nom}`}>
                  {proche.code} {proche.nom}
                </small>
              </>
            ) : <small style={{ color: 'var(--texte-secondaire)' }}>{c}</small>}
          </div>
        );
      })}
    </div>
  );

  const ONGLETS = [['suggestions', 'Suggestions', Sparkles], ['mes', 'Mes palettes', IconePalette], ['communaute', 'Communauté', Users]];
  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px' };

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
      {message && <p className="carte" style={{ margin: '0 0 var(--espace-3)', fontWeight: 700 }}>{message}</p>}
      {!crayons.length && onglet !== 'communaute' && (
        <p style={{ color: 'var(--texte-secondaire)', marginTop: 0, fontSize: '0.9rem' }}>
          Ajoute tes kits dans <Link href="/profil/collection">Ma collection de crayons</Link> pour voir quels crayons utiliser pour chaque couleur.
        </p>
      )}

      {onglet === 'suggestions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="carte" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', margin: 0 }}>
            <b>Nombre de couleurs</b>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="btn alt" aria-label="Moins de couleurs" disabled={nombre <= MIN_COULEURS} onClick={() => setNombre(nombre - 1)} style={{ minWidth: '44px', minHeight: '44px', padding: 0 }}><Minus size={18} aria-hidden="true" /></button>
              <b style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>{nombre}</b>
              <button type="button" className="btn alt" aria-label="Plus de couleurs" disabled={nombre >= MAX_COULEURS} onClick={() => setNombre(nombre + 1)} style={{ minWidth: '44px', minHeight: '44px', padding: 0 }}><Plus size={18} aria-hidden="true" /></button>
            </div>
            <button type="button" className="btn" onClick={() => setSuggestions(genererPalettes(nombre))} style={{ ...petit, width: '100%' }}>
              <RefreshCw size={16} aria-hidden="true" /> Plus de suggestions
            </button>
          </div>
          {suggestions.map((p, i) => (
            <div key={i} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <b style={{ textTransform: 'capitalize' }}>{p.nom}</b>
              <Bandes couleurs={p.couleurs} />
              <Crayons couleurs={p.couleurs} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" className="btn alt" style={petit} onClick={() => enregistrer(p)}><Save size={16} aria-hidden="true" /> Enregistrer</button>
                <button type="button" className="btn alt" style={petit} onClick={() => setCreation({ nom: p.nom, couleurs: [...p.couleurs] })}><IconePalette size={16} aria-hidden="true" /> Modifier</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === 'mes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button type="button" className="btn btn-corail" onClick={() => setCreation({ nom: '', couleurs: ['#F4C7C3', '#B5D8CC', '#F9E2AE'] })}
            style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} aria-hidden="true" /> Créer ma palette
          </button>
          {!mes.length && <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucune palette enregistrée pour l’instant.</p>}
          {mes.map((p) => (
            <div key={p.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <b>{p.nom || 'Sans nom'}{p.partagee ? ' · partagée' : ''}</b>
              <Bandes couleurs={p.couleurs} />
              <Crayons couleurs={p.couleurs} />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" className={p.partagee ? 'btn alt' : 'btn'} style={petit} onClick={() => basculerPartage(p)}>
                  <Share2 size={16} aria-hidden="true" /> {p.partagee ? 'Ne plus partager' : 'Partager'}
                </button>
                <button type="button" className="btn alt danger" style={petit} onClick={() => supprimer(p)}><Trash2 size={16} aria-hidden="true" /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === 'communaute' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!communaute.length && <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucune palette partagée pour l’instant. Partage la tienne depuis « Mes palettes » !</p>}
          {communaute.map((p) => (
            <div key={p.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href={`/membre/${p.auteur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'inherit', flex: 1, minWidth: 0, minHeight: '44px' }}>
                  <Avatar x={{ user_id: p.auteur_id, a_avatar: p.a_avatar, avatar_maj: p.avatar_maj }} taille={28} />
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{p.nom || 'Sans nom'}</b>
                    <small style={{ color: 'var(--texte-secondaire)' }}>{nomAuteur(p)}</small>
                  </span>
                </Link>
                <BoutonJaime aime={p.aime} likes={p.likes} onClick={() => aimer(p)} />
              </div>
              <Bandes couleurs={p.couleurs} />
              <Crayons couleurs={p.couleurs} />
              <button type="button" className="btn alt" style={{ ...petit, alignSelf: 'flex-start' }} onClick={() => enregistrer({ nom: p.nom, couleurs: p.couleurs })}>
                <Save size={16} aria-hidden="true" /> Enregistrer dans mes palettes
              </button>
            </div>
          ))}
        </div>
      )}

      {creation && (
        <div onClick={() => setCreation(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Ma palette</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setCreation(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} aria-hidden="true" /></button>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>Nom
              <input value={creation.nom} onChange={(e) => setCreation({ ...creation, nom: e.target.value })} maxLength={60} placeholder="ex. Chalet d'hiver" />
            </label>
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
            <Crayons couleurs={creation.couleurs} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button type="button" className="btn" style={petit} onClick={async () => { if (await enregistrer(creation)) setCreation(null); }}>
                <Save size={16} aria-hidden="true" /> Enregistrer
              </button>
              <button type="button" className="btn btn-corail" style={petit} onClick={async () => { if (await enregistrer(creation, true)) setCreation(null); }}>
                <Share2 size={16} aria-hidden="true" /> Enregistrer et partager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
