'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Swords, Plus, X, Trophy, Check } from 'lucide-react';
import { Avatar, nomAuteur } from '@/app/communaute/outils';
import { TempsRestant } from '@/components/Fuseau';
const image = (id, taille) => `/api/pages/${id}/image?s=${taille || 0}`;
const joueur = (c, cote) => cote === 'a'
  ? { user_id: c.createur, pseudo: c.pseudo_a, name: c.nom_a, a_avatar: c.avatar_a, avatar_maj: c.avatar_maj_a }
  : { user_id: c.adversaire, pseudo: c.pseudo_b, name: c.nom_b, a_avatar: c.avatar_b, avatar_maj: c.avatar_maj_b };

// Combats : deux coloriages s'affrontent, la communauté vote pendant 3 jours
export default function Combats({ inviter }) {
  const [donnees, setDonnees] = useState(null);
  const [mesFiches, setMesFiches] = useState(null);
  const [abonnements, setAbonnements] = useState([]);
  const [choix, setChoix] = useState(null); // { action: 'creer' | 'accepter', combat? }
  const [invite, setInvite] = useState(inviter || '');
  const [erreur, setErreur] = useState('');

  async function charger() {
    const r = await fetch('/api/combats');
    if (r.ok) setDonnees(await r.json());
  }
  useEffect(() => {
    charger();
    fetch('/api/abonnements?liste=abonnements').then((r) => r.json()).then((d) => setAbonnements(d.membres || []));
    if (inviter) ouvrirChoix({ action: 'creer' });
  }, []);

  async function ouvrirChoix(c) {
    setErreur('');
    if (!mesFiches) {
      const r = await fetch('/api/defis/participer?mes=1').then((x) => x.json());
      setMesFiches(r.fiches || []);
    }
    setChoix(c);
  }

  async function action(corps) {
    setErreur('');
    const r = await fetch('/api/combats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur'); return false; }
    setChoix(null); charger();
    return true;
  }

  function choisirFiche(f) {
    if (choix.action === 'creer') action({ action: 'creer', pageId: f.id, inviteId: invite || undefined });
    else action({ action: 'accepter', id: choix.combat.id, pageId: f.id });
  }

  if (!donnees) return <p style={{ padding: 'var(--espace-3)' }}>Chargement…</p>;
  const { combats, moi } = donnees;
  const invitations = combats.filter((c) => c.statut === 'ouvert' && String(c.invite) === moi);
  const ouverts = combats.filter((c) => c.statut === 'ouvert' && !c.invite && String(c.createur) !== moi);
  const enAttente = combats.filter((c) => ['ouvert', 'refuse'].includes(c.statut) && String(c.createur) === moi);
  const enCours = combats.filter((c) => c.statut === 'en_cours');
  const termines = combats.filter((c) => c.statut === 'termine');

  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const titre = (t) => <h3 style={{ margin: '16px 0 8px', fontSize: '1rem' }}>{t}</h3>;

  // Un côté du combat : image, auteur, votes
  const cote = (c, lettre, cliquable) => {
    const j = joueur(c, lettre);
    const pageId = lettre === 'a' ? c.page_a : c.page_b;
    const votes = lettre === 'a' ? c.votes_a : c.votes_b;
    const gagnant = c.statut === 'termine' && c.gagnant && String(c.gagnant) === String(j.user_id);
    const choisi = c.mon_vote === lettre;
    const contenu = (
      <>
        <span style={{ position: 'relative', display: 'block', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', overflow: 'hidden', background: 'var(--carte)',
          border: choisi || gagnant ? '3px solid var(--btn)' : '1px solid var(--bordure-carte)' }}>
          {pageId && <img src={image(pageId, lettre === 'a' ? c.img_a : c.img_b)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          {gagnant && <Trophy size={22} aria-label="Gagnant" style={{ position: 'absolute', top: 6, right: 6, color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />}
          {choisi && <Check size={22} aria-label="Mon vote" style={{ position: 'absolute', top: 6, left: 6, color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', minWidth: 0 }}>
          <Avatar x={j} taille={18} />
          <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomAuteur(j)}</small>
        </span>
        {(c.statut !== 'ouvert') && <small style={{ fontWeight: 700 }}>{votes} vote{votes > 1 ? 's' : ''}</small>}
      </>
    );
    return cliquable
      ? <button key={lettre} type="button" onClick={() => action({ action: 'voter', id: c.id, choix: lettre })} aria-label={`Voter pour ${nomAuteur(j)}`} style={{ all: 'unset', cursor: 'pointer', minWidth: 0, display: 'block' }}>{contenu}</button>
      : <div key={lettre} style={{ minWidth: 0 }}>{contenu}</div>;
  };

  const carteCombat = (c, boutons) => {
    const participant = [String(c.createur), String(c.adversaire)].includes(moi);
    const vote = c.statut === 'en_cours' && !participant;
    return (
      <div key={c.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
          {cote(c, 'a', vote)}
          <Swords size={22} aria-hidden="true" style={{ color: 'var(--btn)' }} />
          {c.page_b ? cote(c, 'b', vote) : (
            <div style={{ aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', border: '2px dashed var(--bordure-carte)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4px' }}>
              <small style={{ color: 'var(--texte-secondaire)' }}>
                {c.statut === 'refuse' ? 'Invitation refusée' : c.invite ? `En attente de @${c.pseudo_invite || 'membre'}` : 'Adversaire recherché'}
              </small>
            </div>
          )}
        </div>
        {c.statut === 'en_cours' && (
          <>
            <TempsRestant fin={c.fin} />
            {vote && <small style={{ color: 'var(--texte-secondaire)' }}>Touche le coloriage que tu préfères pour voter.</small>}
          </>
        )}
        {c.statut === 'termine' && <small style={{ color: 'var(--texte-secondaire)' }}>{c.gagnant ? 'Combat terminé' : 'Combat terminé : égalité'}</small>}
        {boutons && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{boutons}</div>}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Combats</h2>
      </div>
      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)', fontSize: '0.92rem' }}>
        Lance un combat avec un de tes coloriages publiés. Une autre personne l'accepte avec le sien, puis la communauté vote pendant 3 jours. Le coloriage gagnant rapporte 50 XP.
      </p>
      <button type="button" className="btn" onClick={() => ouvrirChoix({ action: 'creer' })}
        style={{ width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
        <Plus size={18} aria-hidden="true" /> Lancer un combat
      </button>
      {erreur && !choix && <small style={{ color: 'var(--danger)', display: 'block', marginTop: '6px' }}>{erreur}</small>}

      {invitations.length > 0 && <>{titre('Invitations reçues')}{invitations.map((c) => carteCombat(c, [
        <button key="a" type="button" className="btn" style={petit} onClick={() => ouvrirChoix({ action: 'accepter', combat: c })}>Accepter</button>,
        <button key="r" type="button" className="btn alt" style={petit} onClick={() => action({ action: 'refuser', id: c.id })}>Refuser</button>,
      ]))}</>}
      {enCours.length > 0 && <>{titre('Votes en cours')}{enCours.map((c) => carteCombat(c))}</>}
      {titre('Combats ouverts')}
      {!ouverts.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun combat ouvert pour l'instant.</small>}
      {ouverts.map((c) => carteCombat(c, [
        <button key="a" type="button" className="btn" style={petit} onClick={() => ouvrirChoix({ action: 'accepter', combat: c })}>Accepter le combat</button>,
      ]))}
      {enAttente.length > 0 && <>{titre('Mes combats en attente')}{enAttente.map((c) => carteCombat(c, [
        <button key="x" type="button" className="btn alt" style={petit} onClick={() => action({ action: 'annuler', id: c.id })}>{c.statut === 'refuse' ? 'Retirer' : 'Annuler'}</button>,
      ]))}</>}
      {termines.length > 0 && <>{titre('Terminés')}{termines.map((c) => carteCombat(c))}</>}

      {choix && (
        <div onClick={() => setChoix(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', maxHeight: '85dvh', overflowY: 'auto', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b>{choix.action === 'creer' ? 'Lancer un combat' : 'Choisis ton coloriage'}</b>
              <button type="button" className="btn alt" aria-label="Fermer" onClick={() => setChoix(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} aria-hidden="true" /></button>
            </div>
            {choix.action === 'creer' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>Adversaire
                <select value={invite} onChange={(e) => setInvite(e.target.value)}>
                  <option value="">Ouvert à tout le monde</option>
                  {inviter && !abonnements.some((a) => String(a.user_id) === inviter) && <option value={inviter}>Membre invité depuis son profil</option>}
                  {abonnements.map((a) => <option key={a.user_id} value={a.user_id}>Inviter {nomAuteur(a)}</option>)}
                </select>
                <small style={{ color: 'var(--texte-secondaire)', fontWeight: 400 }}>Tu peux inviter une personne que tu suis, ou laisser le combat ouvert.</small>
              </label>
            )}
            <small style={{ color: 'var(--texte-secondaire)' }}>Touche un de tes coloriages publiés :</small>
            {mesFiches && !mesFiches.length && <p style={{ color: 'var(--texte-secondaire)' }}>Publie d'abord un coloriage dans la Communauté.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
              {(mesFiches || []).map((f) => (
                <button key={f.id} type="button" onClick={() => choisirFiche(f)} style={{ all: 'unset', cursor: 'pointer', minWidth: 0 }}>
                  <span style={{ display: 'block', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
                    {f.img_size ? <img src={image(f.id, f.img_size)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </span>
                  <small style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</small>
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
