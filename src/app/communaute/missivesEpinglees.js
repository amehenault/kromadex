'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pin, Mail, MessageCircle, Send, Trash2, Pencil, Check } from 'lucide-react';
import { jourQuebec } from '@/lib/temps';
import { Avatar, BoutonJaime, nomAuteur, poster } from './outils';
import Pseudo from '@/components/Pseudo';
import Sondage from '@/components/Sondage';
import BoutonSignaler from '@/components/BoutonSignaler';

const date = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Missives : « Non lue » tant qu'on ne l'a pas ouverte, puis « Lue ». Les épinglées passent en premier.
// seulementEpinglees : accueil, où seules les missives épinglées (jusqu'à leur échéance) s'affichent.
// J'aime toujours possible, commentaires selon la missive.
// gestion (Invocatrice) : une missive ouverte montre aussi Modifier, Épingler jusqu'au… et Supprimer
export default function MissivesEpinglees({ monId, seulementEpinglees, vide, gestion }) {
  const [missives, setMissives] = useState(null);
  const [ouverte, setOuverte] = useState(null);

  useEffect(() => {
    fetch('/api/missives').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      const liste = (d.missives || []).filter((m) => !seulementEpinglees || m.epinglee);
      setMissives([...liste.filter((m) => m.epinglee), ...liste.filter((m) => !m.epinglee)]);
      // Arrivée depuis l'accueil (#missive-12) : on défile jusqu'à elle
      const id = Number(window.location.hash.replace('#missive-', ''));
      if (id) setTimeout(() => document.getElementById(`missive-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    });
  }, []);

  const maj = (id, champs) => setMissives((l) => l.map((m) => (m.id === id ? { ...m, ...champs } : m)));

  function ouvrir(m) {
    setOuverte(ouverte === m.id ? null : m.id);
    if (!m.lue) {
      maj(m.id, { lue: true });
      // La pastille du menu se met à jour une fois la lecture enregistrée
      poster('/api/missives', { lue: m.id }).then(() => window.dispatchEvent(new Event('kromadex-lu')));
    }
  }

  async function aimer(m) {
    maj(m.id, { aime: !m.aime, likes: m.likes + (m.aime ? -1 : 1) });
    const r = await poster('/api/missives', { like: m.id });
    if (r) maj(m.id, { aime: r.aime, likes: r.likes });
  }

  if (!missives) return null;
  if (!missives.length) return vide ? <p style={{ color: 'var(--texte-secondaire)' }}>{vide}</p> : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: seulementEpinglees ? 'var(--espace-3)' : 0 }}>
      {missives.map((m) => (
        <div key={m.id} id={`missive-${m.id}`} style={{
          background: 'var(--fond-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', minWidth: 0,
          border: m.lue ? '1px solid var(--bordure-carte)' : '2px solid var(--btn)',
        }}>
          <button type="button" onClick={() => ouvrir(m)}
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
            {m.epinglee
              ? <Pin size={18} aria-label="Épinglée" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '2px' }} />
              : <Mail size={18} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)', marginTop: '2px' }} />}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <small style={{ color: 'var(--texte-secondaire)' }}>{date(m.cree_le)}</small>
                <small style={{
                  fontWeight: 700, padding: '0 8px', borderRadius: '999px',
                  background: m.lue ? 'transparent' : 'var(--btn)', color: m.lue ? 'var(--texte-secondaire)' : '#ffffff',
                }}>{m.lue ? 'Lue' : 'Non lue'}</small>
              </span>
              <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{m.titre}</b>
              {m.contenu && (
                <span style={{
                  display: ouverte === m.id ? 'block' : '-webkit-box', whiteSpace: 'pre-wrap', fontSize: '0.9rem', marginTop: '4px', overflowWrap: 'anywhere',
                  ...(ouverte === m.id ? {} : { WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
                }}>{m.contenu}</span>
              )}
              {!m.lue && <small style={{ display: 'block', marginTop: '4px', color: 'var(--btn)', fontWeight: 700 }}>Touche pour lire</small>}
            </span>
          </button>

          {/* Sondage : voter compte comme avoir lu la missive */}
          {m.sondage && (
            <Sondage missiveId={m.id} sondage={m.sondage}
              onVote={() => { if (!m.lue) { maj(m.id, { lue: true }); window.dispatchEvent(new Event('kromadex-lu')); } }} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <BoutonJaime aime={m.aime} likes={m.likes} onClick={() => aimer(m)} />
            {(m.commentaires || m.nb_commentaires > 0) && (
              <button type="button" onClick={() => ouvrir(m)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)', fontWeight: 700, minHeight: '44px' }}>
                <MessageCircle size={20} /> {m.nb_commentaires}
              </button>
            )}
          </div>

          {gestion && ouverte === m.id && (
            <OutilsMissive m={m} onMaj={(champs) => maj(m.id, champs)}
              onSupprimee={() => { setMissives((l) => l.filter((x) => x.id !== m.id)); setOuverte(null); }} />
          )}

          {ouverte === m.id && (m.commentaires || m.nb_commentaires > 0) && (
            <Commentaires missive={m} monId={monId} onNombre={(n) => maj(m.id, { nb_commentaires: n })} />
          )}
        </div>
      ))}
    </div>
  );
}

// Outils de l'Invocatrice sur une missive ouverte : modifier le titre et le texte, épingler jusqu'à une date, supprimer
function OutilsMissive({ m, onMaj, onSupprimee }) {
  const [edition, setEdition] = useState(false);
  const [titre, setTitre] = useState(m.titre);
  const [contenu, setContenu] = useState(m.contenu || '');
  const [message, setMessage] = useState('');
  const aujourdhui = jourQuebec();
  const envoyerPut = (corps) => fetch('/api/missives', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, ...corps }) });

  async function enregistrer() {
    const r = await envoyerPut({ titre, contenu });
    if (r.ok) { onMaj({ titre: titre.trim(), contenu }); setEdition(false); setMessage('Missive modifiée'); }
    else setMessage((await r.json().catch(() => ({}))).error || 'Erreur, réessaie.');
  }
  async function epingler(date) {
    const r = await envoyerPut({ epingleeJusqu: date });
    if (r.ok) { onMaj({ epinglee_jusqu: date, epinglee: Boolean(date && date >= aujourdhui) }); setMessage(date ? 'Épinglage enregistré' : 'Missive désépinglée'); }
  }
  async function supprimer() {
    if (!confirm(`Supprimer la missive « ${m.titre} » pour tout le monde ?`)) return;
    const r = await fetch('/api/missives', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
    if (r.ok) onSupprimee();
  }

  const bouton = { minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' };
  return (
    <div style={{ borderTop: '1px solid var(--bordure-carte)', marginTop: '6px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <small style={{ fontWeight: 700, color: 'var(--texte-secondaire)' }}>Gestion de la missive</small>
      {edition ? (
        <>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} aria-label="Titre de la missive" />
          <textarea rows={5} value={contenu} onChange={(e) => setContenu(e.target.value)} maxLength={4000} aria-label="Texte de la missive" style={{ resize: 'vertical', font: 'inherit' }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" className="btn" style={bouton} disabled={!titre.trim()} onClick={enregistrer}><Check size={14} aria-hidden="true" /> Enregistrer</button>
            <button type="button" className="btn alt" style={bouton} onClick={() => { setEdition(false); setTitre(m.titre); setContenu(m.contenu || ''); }}>Annuler</button>
          </div>
        </>
      ) : (
        <button type="button" className="btn alt" style={{ ...bouton, alignSelf: 'flex-start' }} onClick={() => setEdition(true)}><Pencil size={14} aria-hidden="true" /> Modifier</button>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontWeight: 600 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Pin size={14} aria-hidden="true" /> Épinglée sur l’accueil jusqu’au</span>
        <span style={{ display: 'flex', gap: '6px', minWidth: 0 }}>
          <input type="date" value={m.epinglee_jusqu || ''} min={aujourdhui} onChange={(e) => epingler(e.target.value || null)} style={{ flex: 1, minWidth: 0 }} />
          {m.epinglee_jusqu && <button type="button" className="btn alt" style={bouton} onClick={() => epingler(null)}>Désépingler</button>}
        </span>
      </label>
      <button type="button" className="btn alt danger" style={{ ...bouton, alignSelf: 'flex-start' }} onClick={supprimer}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
      {message && <small style={{ fontWeight: 700 }}>{message}</small>}
    </div>
  );
}

function Commentaires({ missive, monId, onNombre }) {
  const [liste, setListe] = useState(null);
  const [texte, setTexte] = useState('');
  const [erreur, setErreur] = useState('');

  async function charger() {
    const r = await fetch(`/api/missives/commentaires?missive=${missive.id}`);
    if (r.ok) { const d = (await r.json()).commentaires || []; setListe(d); onNombre(d.length); }
  }
  useEffect(() => { charger(); }, [missive.id]);

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    const res = await fetch('/api/missives/commentaires', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missiveId: missive.id, texte }),
    });
    if (res.ok) { setTexte(''); charger(); }
    else setErreur((await res.json().catch(() => ({}))).error || 'Erreur');
  }

  async function retirer(c) {
    if (!confirm('Retirer ce commentaire ?')) return;
    await poster('/api/missives/commentaires', { id: c.id }, 'DELETE');
    charger();
  }

  return (
    <div style={{ borderTop: '1px solid var(--bordure-carte)', marginTop: '6px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {liste === null && <small style={{ color: 'var(--texte-secondaire)' }}>Chargement…</small>}
      {liste?.map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Link href={`/membre/${c.user_id}`} aria-label={`Profil de ${nomAuteur(c)}`}><Avatar x={c} taille={28} /></Link>
          <div style={{ flex: 1, minWidth: 0, background: 'var(--carte)', borderRadius: 'var(--rayon-m)', padding: '6px 10px' }}>
            <Link href={`/membre/${c.user_id}`} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}><Pseudo x={c} /></Link>
            <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.texte}</p>
          </div>
          {String(c.user_id) === monId ? (
            <button type="button" aria-label="Retirer mon commentaire" onClick={() => retirer(c)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)', minHeight: '44px' }}>
              <Trash2 size={16} />
            </button>
          ) : <BoutonSignaler genre="commentaire_missive" cible={c.id} petit />}
        </div>
      ))}
      {missive.commentaires ? (
        <form onSubmit={envoyer} style={{ display: 'flex', gap: '6px' }}>
          <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000} placeholder="Écrire un commentaire" style={{ flex: 1, minWidth: 0 }} />
          <button type="submit" className="btn" disabled={!texte.trim()} aria-label="Envoyer" style={{ minWidth: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} />
          </button>
        </form>
      ) : <small style={{ color: 'var(--texte-secondaire)' }}>Les commentaires sont fermés pour cette missive.</small>}
      {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}
    </div>
  );
}
