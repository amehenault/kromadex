'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, UserPlus, UserCheck, X, Swords } from 'lucide-react';
import { Avatar, BoutonJaime, imagePage, poster } from '@/app/communaute/outils';
import FicheDetail from '@/app/communaute/ficheDetail';
import { calculerNiveau } from '@/lib/niveaux';
import { titreNiveau } from '@/lib/titres';
import { NOMS_POSTES, couleurPoste } from '@/lib/postes';
import MesRecompenses from '@/components/MesRecompenses';
import Pseudo from '@/components/Pseudo';

// Le poste n'est affiché que pour l'équipe (pas pour les coloristes)
const POSTE = { admin: NOMS_POSTES.admin, modo: NOMS_POSTES.modo, cheffe: NOMS_POSTES.cheffe };

export default function ProfilMembre({ membre, fiches: initiales, recompenses = [], moi }) {
  const router = useRouter();
  const [m, setM] = useState(membre);
  const [fiches, setFiches] = useState(initiales);
  const [ouverte, setOuverte] = useState(null);
  const [liste, setListe] = useState(null); // { titre, membres }

  async function suivre() {
    setM((x) => ({ ...x, abonne: !x.abonne, abonnes: x.abonnes + (x.abonne ? -1 : 1) }));
    const r = await poster('/api/abonnements', { id: m.id });
    if (r) setM((x) => ({ ...x, abonne: r.abonne, abonnes: r.abonnes }));
  }

  async function voirListe(type) {
    const r = await fetch(`/api/abonnements?id=${m.id}&liste=${type}`).then((x) => x.json());
    setListe({ titre: type === 'abonnes' ? 'Abonnés' : 'Abonnements', membres: r.membres || [] });
  }

  const majLike = (id, r) => setFiches((l) => l.map((f) => (f.id === id ? { ...f, aime: r.aime, likes: r.likes } : f)));
  async function aimer(f) {
    const r = await poster('/api/communaute', { id: f.id });
    if (r) majLike(f.id, r);
  }

  const compteur = { all: 'unset', cursor: 'pointer', textAlign: 'center', flex: 1, minHeight: '44px' };

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <button type="button" onClick={() => router.back()} className="btn alt" aria-label="Retour"
        style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 'var(--espace-3)' }}>
        <ArrowLeft size={16} />
      </button>

      <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--espace-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Une relique complète donne un cadre de profil exclusif */}
          <span title={recompenses.some((r) => r.genre === 'relique') ? 'Cadre de la relique' : undefined} style={{ borderRadius: '50%', display: 'inline-flex', flex: '0 0 auto',
            boxShadow: recompenses.some((r) => r.genre === 'relique') ? '0 0 0 3px #d4a017, 0 0 0 6px var(--fond-carte), 0 0 0 8px #d4a017' : 'none' }}>
            <Avatar x={m} taille={60} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b style={{ display: 'block', fontSize: '1.05rem', overflowWrap: 'break-word' }}><Pseudo x={m} /></b>
            {m.pseudo && m.name && <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>{m.name}</small>}
            <small style={{ display: 'block', fontWeight: 700 }}>
              Niveau {calculerNiveau(m.xp)}
              {POSTE[m.role] && <span style={{ color: couleurPoste(m.role) }}> · {POSTE[m.role]}</span>}
            </small>
            <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={13} aria-hidden="true" /> {titreNiveau(calculerNiveau(m.xp), m.genre)}</small>
          </div>
        </div>

        {m.bio && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.92rem' }}>{m.bio}</p>}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={compteur} onClick={() => voirListe('abonnes')}>
            <b style={{ display: 'block', fontSize: '1.1rem' }}>{m.abonnes}</b><small>abonné{m.abonnes > 1 ? 's' : ''}</small>
          </button>
          <button type="button" style={compteur} onClick={() => voirListe('abonnements')}>
            <b style={{ display: 'block', fontSize: '1.1rem' }}>{m.abonnements}</b><small>abonnement{m.abonnements > 1 ? 's' : ''}</small>
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <b style={{ display: 'block', fontSize: '1.1rem' }}>{fiches.length}</b><small>coloriage{fiches.length > 1 ? 's' : ''}</small>
          </div>
        </div>

        {moi ? (
          <Link href="/profil/edit" className="btn alt" style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Modifier mon profil
          </Link>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" onClick={suivre} className={m.abonne ? 'btn alt' : 'btn'}
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, minWidth: 0 }}>
              {m.abonne ? <><UserCheck size={18} aria-hidden="true" /> Suivi</> : <><UserPlus size={18} aria-hidden="true" /> Suivre</>}
            </button>
            <Link href={`/combats?inviter=${m.id}`} className="btn alt"
              style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, minWidth: 0 }}>
              <Swords size={18} aria-hidden="true" /> Combat
            </Link>
          </div>
        )}
      </div>

      <MesRecompenses recompenses={recompenses} titre={moi ? 'Mes récompenses' : 'Récompenses'} />

      <h3 style={{ margin: '0 0 10px' }}>Coloriages publiés</h3>
      {!fiches.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucun coloriage publié pour l'instant.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
        {fiches.map((f) => (
          <div key={f.id} role="button" tabIndex={0} onClick={() => setOuverte(f.id)} onKeyDown={(e) => e.key === 'Enter' && setOuverte(f.id)}
            style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', cursor: 'pointer' }}>
            {f.img_size ? <img src={imagePage(f)} alt={f.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
            <span style={{ position: 'absolute', right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--rayon-s) 0 0 0' }}>
              <BoutonJaime aime={f.aime} likes={f.likes} onClick={() => aimer(f)} petit />
            </span>
          </div>
        ))}
      </div>

      {ouverte && <FicheDetail id={ouverte} onFermer={() => setOuverte(null)} onLike={majLike} />}

      {liste && (
        <div onClick={() => setListe(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '80dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <b>{liste.titre}</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setListe(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
            </div>
            {!liste.membres.length && <p style={{ color: 'var(--texte-secondaire)' }}>Personne pour l'instant.</p>}
            {liste.membres.map((x) => (
              <Link key={x.user_id} href={`/membre/${x.user_id}`} onClick={() => setListe(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--bordure-carte)' }}>
                <Avatar x={x} taille={36} /> <Pseudo x={x} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
