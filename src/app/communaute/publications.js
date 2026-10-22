'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, MessageCircle, HelpCircle, Brush, ImagePlus, Images, Trash2, Plus } from 'lucide-react';
import { Avatar, BoutonJaime, poster } from './outils';
import CommentairesFiche from './commentairesFiche';
import Pseudo from '@/components/Pseudo';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import BoutonSignaler from '@/components/BoutonSignaler';
import TexteErreur from '@/components/TexteErreur';
import { compresserImage } from '@/lib/compressionImage';
import { GENRES_PUBLICATION, MAX_IMAGES_PUBLICATION, MAX_TEXTE_PUBLICATION } from '@/lib/publications';

export const imagePublication = (p, no = 0) => `/api/publications/${p.id}/image?no=${no}`;
const ICONES = { question: HelpCircle, en_cours: Brush };
const quand = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Carte d'une publication (question ou coloriage en cours) dans une liste
export function CartePublication({ p, onOuvrir, onLike }) {
  const Icone = ICONES[p.genre] || HelpCircle;
  return (
    <div role="button" tabIndex={0} onClick={() => onOuvrir(p.id)} onKeyDown={(e) => e.key === 'Enter' && onOuvrir(p.id)}
      style={{ cursor: 'pointer', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <Link href={`/membre/${p.auteur_id}`} onClick={(e) => e.stopPropagation()} aria-label="Voir le profil"><Avatar x={p} taille={28} /></Link>
        <span style={{ flex: 1, minWidth: 0 }}>
          <small style={{ display: 'block' }}><Pseudo x={p} /></small>
          <small style={{ color: 'var(--texte-secondaire)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Icone size={13} aria-hidden="true" /> {GENRES_PUBLICATION[p.genre]?.label} · {quand(p.date)}
          </small>
        </span>
      </div>
      {p.texte && (
        <p style={{ margin: 0, fontSize: '0.92rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.texte}</p>
      )}
      {p.nb_images > 0 && (
        <div style={{ position: 'relative', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', aspectRatio: '4 / 3' }}>
          <img src={imagePublication(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {p.nb_images > 1 && (
            <small style={{ position: 'absolute', right: 6, bottom: 6, background: 'rgba(0,0,0,0.6)', color: '#ffffff', borderRadius: '999px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Images size={12} aria-hidden="true" /> {p.nb_images}
            </small>
          )}
        </div>
      )}
      {p.title && <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{p.title}{p.tome ? ` · ${p.tome}` : ''}{p.page_no ? `, p. ${p.page_no}` : ''}</small>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <BoutonJaime aime={p.aime} likes={p.likes} onClick={() => onLike(p)} petit />
        <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--texte-secondaire)', fontWeight: 700 }}>
          <MessageCircle size={16} aria-hidden="true" /> {p.nb_commentaires || 0}
        </small>
      </div>
    </div>
  );
}

// Aimer une publication : mise à jour immédiate, corrigée par la réponse du serveur
export async function aimerPublication(p, maj) {
  maj(p.id, { aime: !p.aime, likes: p.likes + (p.aime ? -1 : 1) });
  const r = await fetch('/api/publications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ like: p.id }) });
  if (r.ok) maj(p.id, await r.json());
}

// Fenêtre d'une publication : texte complet, toutes les images, J'aime, commentaires, signaler ou retirer
export function PublicationDetail({ id, onFermer, onMaj, onRetiree }) {
  const [p, setP] = useState(null);
  useEffect(() => {
    fetch(`/api/publications?id=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setP(d.publication));
  }, [id]);

  const maj = (_, champs) => { setP((x) => ({ ...x, ...champs })); onMaj?.(id, champs); };
  async function retirer() {
    if (!confirm('Retirer cette publication ?')) return;
    if (await poster('/api/publications', { id }, 'DELETE')) { onRetiree?.(id); onFermer(); }
  }

  return (
    <Feuille titre={p ? GENRES_PUBLICATION[p.genre]?.label : 'Publication'} onFermer={onFermer} haute>
      {!p ? <p style={{ margin: 0 }}>Chargement…</p> : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/membre/${p.auteur_id}`} aria-label="Voir le profil"><Avatar x={p} taille={32} /></Link>
            <span style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/membre/${p.auteur_id}`} style={{ color: 'inherit' }}><Pseudo x={p} /></Link>
              <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>{quand(p.date)}</small>
            </span>
            <BoutonJaime aime={p.aime} likes={p.likes} onClick={() => aimerPublication(p, maj)} />
          </div>
          {p.texte && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{p.texte}</p>}
          {p.title && <small style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{p.title}{p.tome ? ` · ${p.tome}` : ''}{p.page_no ? `, page ${p.page_no}` : ''}</small>}
          {Array.from({ length: p.nb_images }, (_, i) => (
            <img key={i} src={imagePublication(p, i)} alt="" style={{ width: '100%', borderRadius: 'var(--rayon-m)', background: 'var(--carte)' }} />
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {(p.mienne || p.peut_retirer) && (
              <button type="button" onClick={retirer}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)', fontWeight: 700, fontSize: '0.85rem', minHeight: '44px' }}>
                <Trash2 size={16} aria-hidden="true" /> Retirer
              </button>
            )}
            {!p.mienne && <BoutonSignaler genre="publication" cible={p.id} />}
          </div>
          <CommentairesFiche publicationId={p.id} />
        </>
      )}
    </Feuille>
  );
}

// Nouvelle publication : texte, photos du téléphone (jusqu'à 4) et, pour un coloriage en cours, un de ses coloriages
export function NouvellePublication({ genre, onFermer, onPublie }) {
  const [texte, setTexte] = useState('');
  const [photos, setPhotos] = useState([]); // { fichier, apercu }
  const [page, setPage] = useState(null);
  const [choix, setChoix] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const entree = useRef(null);
  const enCours = genre === 'en_cours';
  const place = MAX_IMAGES_PUBLICATION - photos.length - (page ? 1 : 0);

  async function ajouterPhotos(e) {
    const fichiers = [...(e.target.files || [])].slice(0, place);
    e.target.value = '';
    const prets = await Promise.all(fichiers.map(async (f) => {
      const fichier = await compresserImage(f);
      return { fichier, apercu: URL.createObjectURL(fichier) };
    }));
    setPhotos((l) => [...l, ...prets]);
  }

  const pret = enCours ? (photos.length > 0 || page) : texte.trim().length >= 3;

  async function publier(e) {
    e.preventDefault();
    setEnvoi(true); setErreur('');
    const fd = new FormData();
    fd.append('genre', genre);
    fd.append('texte', texte);
    if (page) fd.append('page_id', page.id);
    photos.forEach((p, i) => fd.append('images', p.fichier, `photo-${i}.jpg`));
    const r = await fetch('/api/publications', { method: 'POST', body: fd });
    setEnvoi(false);
    if (r.ok) { onPublie(); return; }
    setErreur((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.');
  }

  const vignette = { position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' };
  const retirerVignette = (onClick) => (
    <button type="button" onClick={onClick} aria-label="Retirer cette image"
      style={{ position: 'absolute', top: 2, right: 2, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#ffffff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
      <X size={14} aria-hidden="true" />
    </button>
  );

  return (
    <Feuille titre={GENRES_PUBLICATION[genre].action} onFermer={onFermer}>
      <form onSubmit={publier} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '0.9rem' }}>
          {enCours ? 'Un mot sur ton coloriage (facultatif)' : 'Ta question'}
          <textarea rows={4} maxLength={MAX_TEXTE_PUBLICATION} value={texte} onChange={(e) => setTexte(e.target.value)}
            placeholder={enCours ? 'ex. Je bloque sur le ciel, des idées ?' : 'ex. Quels crayons utilisez-vous pour la peau ?'}
            style={{ resize: 'vertical', font: 'inherit' }} />
        </label>

        {(photos.length > 0 || page) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px' }}>
            {page && (
              <span style={vignette}>
                <img src={`/api/pages/${page.id}/image?s=${page.img_size || 0}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {retirerVignette(() => setPage(null))}
              </span>
            )}
            {photos.map((p, i) => (
              <span key={p.apercu} style={vignette}>
                <img src={p.apercu} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {retirerVignette(() => setPhotos((l) => l.filter((_, j) => j !== i)))}
              </span>
            ))}
          </div>
        )}

        {place > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: enCours && !page ? '1fr 1fr' : '1fr', gap: '6px' }}>
            <button type="button" className="btn alt" onClick={() => entree.current?.click()} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ImagePlus size={16} aria-hidden="true" /> Photo du téléphone
            </button>
            {enCours && !page && (
              <button type="button" className="btn alt" onClick={() => setChoix(true)} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Images size={16} aria-hidden="true" /> Mes coloriages
              </button>
            )}
          </div>
        )}
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Jusqu’à {MAX_IMAGES_PUBLICATION} images. Ta publication est visible par les membres connectés de Kromadex.
        </small>
        <input ref={entree} type="file" accept="image/*" multiple hidden onChange={ajouterPhotos} />

        {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
        <button type="submit" className="btn" disabled={!pret || envoi} style={{ minHeight: '48px', fontWeight: 700 }}>
          {envoi ? 'Publication…' : 'Publier'}
        </button>
      </form>
      {choix && (
        <ChoixColoriage titre="Choisis ton coloriage en cours" avertissement={false}
          onChoisir={(f) => { setPage(f); setChoix(false); }} onFermer={() => setChoix(false)} />
      )}
    </Feuille>
  );
}

// Section Questions ou Coloriages en cours : bouton pour publier, puis les publications (20 à la fois)
export default function Publications({ genre }) {
  const [liste, setListe] = useState([]);
  const [fin, setFin] = useState(false);
  const [charge, setCharge] = useState(false);
  const [ouverte, setOuverte] = useState(null);
  const [nouvelle, setNouvelle] = useState(false);

  async function charger(reinit) {
    setCharge(true);
    const avant = !reinit && liste.length ? `&avant=${encodeURIComponent(liste.at(-1).date)}` : '';
    const r = await fetch(`/api/publications?genre=${genre}${avant}`);
    const d = r.ok ? (await r.json()).publications || [] : [];
    setListe((l) => (reinit ? d : [...l, ...d]));
    setFin(d.length < 20);
    setCharge(false);
  }
  useEffect(() => { charger(true); }, [genre]);

  const maj = (id, champs) => setListe((l) => l.map((p) => (p.id === id ? { ...p, ...champs } : p)));

  return (
    <>
      <button type="button" className="btn" onClick={() => setNouvelle(true)}
        style={{ width: '100%', minHeight: '48px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
        <Plus size={18} aria-hidden="true" /> {GENRES_PUBLICATION[genre].action}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {liste.map((p) => <CartePublication key={p.id} p={p} onOuvrir={setOuverte} onLike={(x) => aimerPublication(x, maj)} />)}
      </div>
      {!charge && !liste.length && (
        <p style={{ color: 'var(--texte-secondaire)', textAlign: 'center' }}>
          {genre === 'question' ? 'Aucune question pour l’instant. Pose la première !' : 'Aucun coloriage en cours pour l’instant. Montre le tien !'}
        </p>
      )}
      {!fin && liste.length > 0 && (
        <button type="button" className="btn alt" disabled={charge} onClick={() => charger(false)} style={{ width: '100%', marginTop: '10px', minHeight: '44px' }}>
          {charge ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
      {ouverte && <PublicationDetail id={ouverte} onFermer={() => setOuverte(null)} onMaj={maj} onRetiree={(id) => setListe((l) => l.filter((p) => p.id !== id))} />}
      {nouvelle && <NouvellePublication genre={genre} onFermer={() => setNouvelle(false)} onPublie={() => { setNouvelle(false); charger(true); }} />}
    </>
  );
}
