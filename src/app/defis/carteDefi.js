'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Image as ImageIcon, X, Trash2, Pencil } from 'lucide-react';
import { nomCategorie, pageConvient } from '@/lib/defis';
import { Avatar, BoutonJaime, nomAuteur, imagePage, poster } from '@/app/communaute/outils';
import FicheDetail from '@/app/communaute/ficheDetail';
import { TempsRestant } from '@/components/Fuseau';
import { NOMS_POSTES } from '@/lib/postes';

const ETIQUETTE = { officiel: 'Épreuve du mois', modo: 'Épreuve de sentinelle', cheffe: 'Épreuve de chef·fe', groupe: 'Épreuve de groupe' };
const ROLE = NOMS_POSTES;
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Un défi : infos, participer, envoyer un coloriage, voir les coloriages des autres
export default function CarteDefi({ defi: d, onChange, monId, onModifier }) {
  const [choix, setChoix] = useState(null);       // mes coloriages publiés (feuille de choix)
  const [galerie, setGalerie] = useState(null);   // coloriages envoyés pour ce défi
  const [ouverte, setOuverte] = useState(null);
  const [erreur, setErreur] = useState('');
  const termine = d.fin_instant && new Date(d.fin_instant).getTime() <= Date.now();

  async function participer() {
    setErreur('');
    const r = await fetch('/api/defis/participer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defiId: d.id }) });
    if (r.ok) onChange(); else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }
  async function quitter() {
    if (!confirm('Quitter cette épreuve ?')) return;
    await poster('/api/defis/participer', { defiId: d.id }, 'DELETE');
    onChange();
  }
  async function ouvrirChoix() {
    const r = await fetch('/api/defis/participer?mes=1').then((x) => x.json());
    setChoix((r.fiches || []).filter((f) => pageConvient(d.categorie, f.type_coloriage)));
  }
  async function envoyer(f) {
    setErreur('');
    const r = await fetch('/api/defis/participer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defiId: d.id, pageId: f.id }) });
    if (r.ok) { setChoix(null); onChange(); } else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }
  async function voirGalerie() {
    if (galerie) { setGalerie(null); return; }
    const r = await fetch(`/api/defis/participer?defi=${d.id}`).then((x) => x.json());
    setGalerie(r.fiches || []);
  }
  async function supprimer() {
    if (!confirm(`Supprimer l’épreuve « ${d.titre} » ?`)) return;
    await poster('/api/defis', { id: d.id }, 'DELETE');
    onChange();
  }
  const majLike = (id, r) => setGalerie((l) => l?.map((f) => (f.id === id ? { ...f, aime: r.aime, likes: r.likes } : f)));

  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: d.genre === 'officiel' ? '2px solid var(--btn)' : undefined, opacity: termine ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>{ETIQUETTE[d.genre]}</small>
        <small style={{ fontWeight: 700 }}>{nomCategorie(d.categorie)}</small>
      </div>
      <b style={{ fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{d.titre}</b>
      {/* Qui a créé l'épreuve */}
      {d.createur_id && (
        <Link href={`/membre/${d.createur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', color: 'inherit', textDecoration: 'none', alignSelf: 'flex-start' }}>
          <Avatar x={{ user_id: d.createur_id, a_avatar: d.a_avatar, avatar_maj: d.avatar_maj }} taille={28} />
          <small>
            Créée par <b>{nomAuteur({ pseudo: d.choisi_par, name: d.nom_createur })}</b>
            <span style={{ color: 'var(--texte-secondaire)' }}> · {ROLE[d.role_createur] || 'Membre'}</span>
          </small>
        </Link>
      )}
      {d.description && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{d.description}</p>}
      <small style={{ color: 'var(--texte-secondaire)' }}>
        {d.debut && d.fin ? `Du ${jour(d.debut)} au ${jour(d.fin)}${termine ? ' · terminée' : ''} · ` : ''}
        {d.participants} participant{d.participants > 1 ? 's' : ''} · {d.coloriages} coloriage{d.coloriages > 1 ? 's' : ''}
      </small>
      {!termine && <TempsRestant fin={d.fin_instant} />}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {!d.je_participe && !termine && <button type="button" className="btn" style={petit} onClick={participer}>Participer</button>}
        {d.je_participe && (
          <>
            {!termine && (
              <button type="button" className="btn" style={petit} onClick={ouvrirChoix}>
                <ImageIcon size={16} /> {d.ma_page ? 'Changer mon coloriage' : 'Envoyer mon coloriage'}
              </button>
            )}
            <span style={{ ...petit, fontWeight: 700, color: 'var(--btn)' }}><Check size={16} /> Je participe</span>
          </>
        )}
        {d.coloriages > 0 && (
          <button type="button" className="btn alt" style={petit} onClick={voirGalerie}>{galerie ? 'Masquer' : 'Voir les coloriages'}</button>
        )}
        {d.je_participe && !termine && String(d.createur_id) !== monId && (
          <button type="button" className="btn alt" style={petit} onClick={quitter}>Quitter</button>
        )}
        {onModifier && String(d.createur_id) === monId && (
          <>
            <button type="button" className="btn alt" style={petit} onClick={() => onModifier(d)}><Pencil size={14} /> Modifier</button>
            <button type="button" className="btn alt danger" style={petit} onClick={supprimer}><Trash2 size={14} /> Supprimer</button>
          </>
        )}
      </div>
      {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}

      {galerie && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {galerie.map((f) => (
            <div key={f.id} role="button" tabIndex={0} onClick={() => setOuverte(f.id)} onKeyDown={(e) => e.key === 'Enter' && setOuverte(f.id)}
              style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', cursor: 'pointer' }}>
              {f.img_size ? <img src={imagePage(f)} alt={f.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.85)', padding: '0 2px' }}>
                <Avatar x={f} taille={18} />
                <BoutonJaime aime={f.aime} likes={f.likes} petit onClick={async () => { const r = await poster('/api/communaute', { id: f.id }); if (r) majLike(f.id, r); }} />
              </span>
            </div>
          ))}
        </div>
      )}
      {ouverte && <FicheDetail id={ouverte} onFermer={() => setOuverte(null)} onLike={majLike} />}

      {choix && (
        <div onClick={() => setChoix(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '85dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b>Choisis ton coloriage</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setChoix(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            <small style={{ display: 'block', color: 'var(--texte-secondaire)', marginBottom: '8px' }}>
              Seuls tes coloriages publiés dans la communauté{d.categorie !== 'tous' ? ` de type ${nomCategorie(d.categorie)}` : ''} peuvent être envoyés.
            </small>
            {!choix.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucun coloriage publié qui convient. Coche « Publier dans la communauté » dans ta fiche.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
              {choix.map((f) => (
                <button key={f.id} type="button" onClick={() => envoyer(f)}
                  style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <span style={{ aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', border: d.ma_page === f.id ? '3px solid var(--btn)' : 'none' }}>
                    {f.img_size ? <img src={imagePage(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </span>
                  <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</small>
                </button>
              ))}
            </div>
            {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}
          </div>
        </div>
      )}
    </div>
  );
}
