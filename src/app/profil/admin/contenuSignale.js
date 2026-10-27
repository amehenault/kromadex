'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Check, ExternalLink } from 'lucide-react';
import { nomPoste, couleurPoste } from '@/lib/postes';
import { GENRES_SIGNALEMENT } from '@/lib/signalements';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';
import Pseudo from '@/components/Pseudo';
import { Avatar } from '@/app/communaute/outils';
import Deroulant from '@/components/Deroulant';

const SANCTIONS = [[0, 'Avertir'], [7, 'Suspendre 7 jours'], [30, 'Suspendre 30 jours'], [36500, 'Bannir']];
const RETIRER = {
  coloriage: 'Retirer de la communauté', commentaire: 'Supprimer le commentaire', commentaire_missive: 'Supprimer le commentaire',
  publication: 'Supprimer la publication', commentaire_publication: 'Supprimer le commentaire',
};
const SUR = { commentaire: 'le coloriage', commentaire_missive: 'la missive', commentaire_publication: 'la publication' };

export default function ContenuSignale() {
  const [liste, setListe] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/signalements');
    if (r.ok) setListe((await r.json()).signalements || []);
  }
  useEffect(() => { charger(); }, []);

  async function traiter(s, action) {
    if (action === 'retirer' && !confirm(`${RETIRER[s.genre]} ?`)) return;
    const r = await envoyer('/api/signalements', 'PUT', { genre: s.genre, cible: s.cible, action });
    setMessage(r.ok ? (action === 'retirer' ? 'Contenu retiré' : 'Signalement ignoré') : r.error);
    if (r.ok) { charger(); window.dispatchEvent(new Event('kromadex-lu')); }
  }
  async function sanctionner(s, jours) {
    const libelle = SANCTIONS.find(([j]) => j === jours)[1].toLowerCase();
    const qui = s.contenu?.pseudo ? `@${s.contenu.pseudo}` : s.contenu?.name || 'cette personne';
    if (!confirm(`Confirmer : ${libelle} ${qui} ?`)) return;
    const raisons = [...new Set(s.signalements.map((x) => x.raison))].join(', ');
    const r = await envoyer('/api/moderation', 'POST', { userId: s.contenu.auteur_id, motif: `${GENRES_SIGNALEMENT[s.genre]} signalé : ${raisons}`, jours });
    setMessage(r.ok ? 'Sanction envoyée' : r.error);
  }

  if (!liste) return <p>Chargement…</p>;
  return (
    <div className="carte" style={{ ...colonne, marginBottom: 'var(--espace-3)' }}>
      <b>Contenu signalé ({liste.length})</b>
      <p style={aide}>Un membre trouve que ce contenu contrevient aux règles d’utilisation.</p>
      {message && <small>{message}</small>}
      {!liste.length && <p style={aide}>Aucun contenu signalé à traiter.</p>}
      {liste.map((s) => {
        const c = s.contenu;
        return (
          <div key={`${s.genre}-${s.cible}`} style={{ ...ligneCarte, border: '2px solid var(--danger)' }}>
            <small style={{ color: 'var(--danger)', fontWeight: 700 }}>
              {GENRES_SIGNALEMENT[s.genre]} · {s.nombre} signalement{s.nombre > 1 ? 's' : ''}
            </small>

            {!c && <p style={aide}>Ce contenu n’existe plus.</p>}
            {c && s.genre === 'coloriage' && (
              <>
                <b style={{ overflowWrap: 'anywhere' }}>{c.title || 'Sans titre'}{!c.publiee && ' (déjà retiré de la communauté)'}</b>
                {c.img_size > 0 && <img src={`/api/pages/${c.cible}/image?s=${c.img_size}`} alt="" loading="lazy"
                  style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: 'var(--rayon-s)', background: 'var(--carte)' }} />}
              </>
            )}
            {c && SUR[s.genre] && (
              <>
                <small style={aide}>Sur {SUR[s.genre]} « {c.title || c.titre} »</small>
                <p style={{ margin: 0, padding: '6px 10px', background: 'var(--carte)', borderRadius: 'var(--rayon-m)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.texte}</p>
              </>
            )}
            {c && s.genre === 'publication' && (
              <>
                {c.texte && <p style={{ margin: 0, padding: '6px 10px', background: 'var(--carte)', borderRadius: 'var(--rayon-m)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.texte}</p>}
                {c.nb_images > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                    {Array.from({ length: c.nb_images }, (_, i) => (
                      <img key={i} src={`/api/publications/${c.cible}/image?no=${i}`} alt="" loading="lazy"
                        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 'var(--rayon-s)', background: 'var(--carte)' }} />
                    ))}
                  </div>
                )}
              </>
            )}
            {c && s.genre === 'membre' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Avatar x={{ ...c, user_id: c.auteur_id }} taille={40} />
                {c.bio ? <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.9rem' }}>{c.bio}</p>
                  : <small style={aide}>Aucune présentation.</small>}
              </div>
            )}
            {c && (
              <small style={{ overflowWrap: 'anywhere' }}>
                Par <Pseudo x={c} role={c.role} />
                {['admin', 'modo', 'cheffe', 'menestrel'].includes(c.role) && <span style={{ color: couleurPoste(c.role), fontWeight: 700 }}> · {nomPoste(c.role, c.genre)}</span>}
                {' · '}<Link href={`/membre/${c.auteur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Voir le profil <ExternalLink size={12} aria-hidden="true" /></Link>
              </small>
            )}

            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem' }}>
              {s.signalements.map((x, i) => (
                <li key={i} style={{ overflowWrap: 'anywhere' }}>
                  <b>{x.raison}</b>{x.details && ` : ${x.details}`}
                  <small style={{ color: 'var(--texte-secondaire)' }}> — {x.pseudo ? `@${x.pseudo}` : x.name || 'membre'}</small>
                </li>
              ))}
            </ul>

            <div style={actions}>
              {c && RETIRER[s.genre] && (s.genre !== 'coloriage' || c.publiee) && (
                <button type="button" className="btn alt danger" style={petitBtn} onClick={() => traiter(s, 'retirer')}>
                  <Trash2 size={14} aria-hidden="true" /> {RETIRER[s.genre]}
                </button>
              )}
              <button type="button" className="btn alt" style={petitBtn} onClick={() => traiter(s, 'ignorer')}>
                <Check size={14} aria-hidden="true" /> {c ? 'Rien à reprocher' : 'Retirer de la liste'}
              </button>
            </div>
            {c && !['admin', 'modo'].includes(c.role) && (
              <label style={champ}>Sanctionner la personne
                <Deroulant titre="Sanctionner la personne" placeholder="Choisir une sanction" value="" onChange={(v) => sanctionner(s, Number(v))}
                  options={SANCTIONS.map(([j, l]) => ({ valeur: j, label: l }))} />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
