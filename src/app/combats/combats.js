'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Swords, Plus, Trophy, Image as ImageIcon, Gift, Crown, Users } from 'lucide-react';
import { Avatar, nomAuteur } from '@/app/communaute/outils';
import { TempsRestant } from '@/components/Fuseau';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import Verdict, { PastilleColoriste } from '@/components/Verdict';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { COMBATS, XP_COMBATS, THEMES_DUEL, VICTOIRES_EPEE, VICTOIRES_EXPERT_JOUTE } from '@/lib/activites';
import Tournois from './tournois';
import Pseudo from '@/components/Pseudo';
import TexteErreur from '@/components/TexteErreur';

const nomType = (v) => TYPES_COLORIAGE.find((t) => t.valeur === v)?.label || '';
const nomTheme = (v) => THEMES_DUEL.find((t) => t.valeur === v)?.label || '';
const STATUT = {
  invitation: 'En attente de réponse', soumission: 'Coloriages en préparation', ouvert: 'Ouverte aux coloristes',
  verdict: 'Verdict de l’Assemblée', termine: 'Terminé', refuse: 'Refusé', annule: 'Annulé',
};

// Combats : duels chromatiques et joutes ouvertes. Les coloriages restent anonymes pendant le verdict.
// integre : affiché dans l'onglet Combats des Épreuves (sans titre ni marge de page)
export default function Combats({ inviter, integre }) {
  const [onglet, setOnglet] = useState('combats');
  const [combats, setCombats] = useState(null);
  const [abonnements, setAbonnements] = useState([]);
  const [form, setForm] = useState(inviter ? { genre: 'duel', categorie: 'mystere', themeType: 'couleur', theme: '', inviteId: inviter } : null);
  const [choix, setChoix] = useState(null); // { combat } : choisir le coloriage à soumettre
  const [verdict, setVerdict] = useState(null);
  const [erreur, setErreur] = useState('');

  async function charger() {
    const r = await fetch('/api/combats');
    if (r.ok) setCombats((await r.json()).combats || []);
  }
  useEffect(() => {
    charger();
    fetch('/api/abonnements?liste=abonnements').then((r) => r.json()).then((d) => setAbonnements(d.membres || [])).catch(() => {});
  }, []);

  async function action(corps) {
    setErreur('');
    const r = await fetch('/api/combats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur'); return false; }
    setChoix(null); setForm(null); charger();
    return true;
  }
  // Duel : on invite d'abord ; joute : on lance l'appel, le coloriage se soumet ensuite (même délai pour tout le monde)
  function creer() {
    action({ action: 'creer', ...form });
  }
  function choisir(f) {
    action({ action: 'soumettre', id: choix.combat.id, pageId: f.id });
  }

  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const titre = (t) => <h3 style={{ margin: '16px 0 8px', fontSize: '1rem' }}>{t}</h3>;
  const champ = { display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '0.9rem' };

  const carte = (c, boutons) => {
    const xp = XP_COMBATS[c.genre];
    return (
      <div key={c.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {c.genre === 'duel' ? <Swords size={14} aria-hidden="true" /> : <Users size={14} aria-hidden="true" />} {c.genre === 'duel' ? 'Duel chromatique' : 'Joute ouverte'}
          </small>
          <small style={{ fontWeight: 700 }}>{nomType(c.categorie)}</small>
        </div>
        <b style={{ overflowWrap: 'anywhere' }}>{nomTheme(c.theme_type)} : {c.theme}</b>
        <small style={{ color: 'var(--texte-secondaire)' }}>
          {STATUT[c.statut]} · {c.coloriages} coloriage{c.coloriages > 1 ? 's' : ''}{c.genre === 'joute' ? ` · ${c.participants} / ${c.places || COMBATS.maxJoute} coloristes` : ''}
        </small>
        {/* Joute : anonyme pour tout le monde, chaque personne est « Coloriste N » */}
        {c.coloristes?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {c.coloristes.map((x) => (
              <span key={x.numero} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <PastilleColoriste n={x.numero} taille={24} />
                <small style={{ color: 'var(--texte-secondaire)' }}>{x.moi ? '(toi)' : ''}{x.soumis ? ' · coloriage soumis' : ''}</small>
              </span>
            ))}
          </div>
        )}
        {/* Duel : les deux personnes se connaissent ; les autres membres ne voient jamais qui participe */}
        {c.genre === 'duel' && c.adversaires?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {c.adversaires.map((u) => (
              <span key={u.user_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Avatar x={u} taille={22} /><small><Pseudo x={u} />{u.soumis ? ' · coloriage soumis' : ''}</small>
              </span>
            ))}
          </div>
        )}
        {c.statut === 'invitation' && c.je_cree && <small>Invitation envoyée à @{c.pseudo_invite || 'membre'}</small>}
        {c.statut === 'invitation' && <TempsRestant fin={c.acceptation_fin} />}
        {['soumission', 'ouvert'].includes(c.statut) && <TempsRestant fin={c.soumission_fin} />}
        {c.statut === 'termine' && (
          <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}>
            <Trophy size={16} aria-hidden="true" /> {c.j_ai_gagne ? `Tu as gagné ce combat : +${xp.victoire} XP` : c.a_gagnant ? 'Combat terminé' : 'Combat terminé : égalité'}
          </small>
        )}
        {c.je_participe && ['soumission', 'ouvert'].includes(c.statut) && c.ma_page && (
          <small style={{ fontWeight: 700 }}>Ton coloriage est soumis{c.genre === 'duel' ? ' : le verdict commence dès que les deux coloriages sont là.' : '.'}</small>
        )}
        {c.je_participe && ['soumission', 'ouvert'].includes(c.statut) && !c.ma_page && (
          <small style={{ fontWeight: 700, color: 'var(--danger)' }}>Coloriage à soumettre avant la date limite, sinon tu ne participes pas au verdict.</small>
        )}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {boutons}
          {['verdict', 'termine'].includes(c.statut) && (
            <button type="button" className="btn alt" style={petit} onClick={() => setVerdict(verdict === c.id ? null : c.id)}>
              {verdict === c.id ? 'Masquer' : c.statut === 'verdict' ? (c.je_participe ? 'Voir les coloriages' : 'Rendre mon verdict') : 'Voir les coloriages'}
            </button>
          )}
        </div>
        {verdict === c.id && <Verdict activite={`combat:${c.id}`} onVote={charger} />}
      </div>
    );
  };

  const liste = combats || [];
  const invitations = liste.filter((c) => c.statut === 'invitation' && c.je_suis_invite);
  const mes = liste.filter((c) => c.je_participe && ['invitation', 'soumission', 'ouvert'].includes(c.statut));
  const joutes = liste.filter((c) => c.statut === 'ouvert' && !c.je_participe);
  const verdicts = liste.filter((c) => c.statut === 'verdict');
  const termines = liste.filter((c) => ['termine', 'refuse', 'annule'].includes(c.statut));

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: integre ? 0 : 'var(--espace-3)' }}>
      {!integre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Combats</h2>
        </div>
      )}
      <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {[['combats', 'Duels et joutes', Swords], ['tournois', 'Tournois', Crown]].map(([cle, label, Icone]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} className={onglet === cle ? 'btn' : 'btn alt'} onClick={() => setOnglet(cle)}
            style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, minWidth: 0 }}>
            <Icone size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {onglet === 'tournois' ? <Tournois /> : (
        <>
          <small style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--texte-secondaire)' }}>
            <Gift size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} />
            <span>
              Duel : {XP_COMBATS.duel.participation} XP chacun, +{XP_COMBATS.duel.victoire} XP pour la victoire, Épée chromatique après {VICTOIRES_EPEE} victoires.
              Joute : {XP_COMBATS.joute.participation} XP chacun, +{XP_COMBATS.joute.victoire} XP et une joute par victoire, titre Expert de la joute après {VICTOIRES_EXPERT_JOUTE} victoires.
              {` ${COMBATS.joursSoumission} jours pour soumettre les coloriages, puis ${COMBATS.joursVerdict} jours de verdict.`}
            </span>
          </small>
          <button type="button" className="btn" onClick={() => setForm({ genre: 'duel', categorie: 'mystere', themeType: 'couleur', theme: '', inviteId: '' })}
            style={{ width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, marginTop: '10px' }}>
            <Plus size={18} aria-hidden="true" /> Lancer un combat
          </button>
          {erreur && !form && !choix && <small style={{ color: 'var(--danger)', display: 'block', marginTop: '6px' }}><TexteErreur texte={erreur} /></small>}

          {invitations.length > 0 && <>{titre('Invitations reçues')}{invitations.map((c) => carte(c, [
            <button key="a" type="button" className="btn" style={petit} onClick={() => action({ action: 'accepter', id: c.id })}>Accepter le duel</button>,
            <button key="r" type="button" className="btn alt" style={petit} onClick={() => action({ action: 'refuser', id: c.id })}>Refuser</button>,
          ]))}</>}
          {mes.length > 0 && <>{titre('Mes combats')}{mes.map((c) => carte(c, [
            (c.statut === 'soumission' || c.statut === 'ouvert') && (
              <button key="s" type="button" className="btn" style={petit} onClick={() => setChoix({ combat: c })}>
                <ImageIcon size={16} aria-hidden="true" /> {c.ma_page ? 'Changer mon coloriage' : 'Soumettre mon coloriage'}
              </button>
            ),
            c.je_cree && (c.statut === 'invitation' || (c.statut === 'ouvert' && c.participants <= 1)) && (
              <button key="x" type="button" className="btn alt" style={petit} onClick={() => action({ action: 'annuler', id: c.id })}>Annuler</button>
            ),
            !c.je_cree && c.statut === 'ouvert' && (
              <button key="q" type="button" className="btn alt" style={petit} onClick={() => action({ action: 'quitter', id: c.id })}>Quitter la joute</button>
            ),
          ]))}</>}
          {verdicts.length > 0 && <>{titre('Verdicts en cours')}{verdicts.map((c) => carte(c))}</>}
          {titre('Joutes ouvertes')}
          {!joutes.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucune joute ouverte pour l’instant.</small>}
          {joutes.map((c) => carte(c, [
            <button key="j" type="button" className="btn" style={petit} onClick={() => action({ action: 'rejoindre', id: c.id })}><Swords size={16} aria-hidden="true" /> Accepter la joute</button>,
          ]))}
          {termines.length > 0 && <>{titre('Terminés')}{termines.map((c) => carte(c))}</>}
        </>
      )}

      {form && !choix && (
        <Feuille titre="Lancer un combat" onFermer={() => setForm(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[['duel', 'Duel chromatique'], ['joute', 'Joute ouverte']].map(([g, l]) => (
              <button key={g} type="button" className={form.genre === g ? 'btn' : 'btn alt'} onClick={() => setForm({ ...form, genre: g })} style={{ minHeight: '48px', fontWeight: 700 }}>{l}</button>
            ))}
          </div>
          <small style={{ color: 'var(--texte-secondaire)' }}>
            {form.genre === 'duel'
              ? `Tu invites une personne que tu suis et qui te suit. Elle a ${COMBATS.joursAcceptation} jours pour accepter, puis vous réalisez chacun un coloriage sur le même thème.`
              : `Tu lances un appel : les coloristes acceptent la joute, puis chaque personne, toi comprise ou compris, a ${COMBATS.joursSoumission} jours pour soumettre un coloriage sur le même thème. Tout est anonyme, et le verdict commence dès que tous les coloriages sont là.`}
          </small>
          <label style={champ}>Type de coloriage
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              {TYPES_COLORIAGE.map((t) => <option key={t.valeur} value={t.valeur}>{t.label}</option>)}
            </select>
          </label>
          <label style={champ}>Thème
            <select value={form.themeType} onChange={(e) => setForm({ ...form, themeType: e.target.value })}>
              {THEMES_DUEL.map((t) => <option key={t.valeur} value={t.valeur}>{t.label}</option>)}
            </select>
          </label>
          <label style={champ}>{nomTheme(form.themeType)} choisi.e
            <input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} maxLength={80}
              placeholder={THEMES_DUEL.find((t) => t.valeur === form.themeType)?.aide} />
          </label>
          {form.genre === 'joute' && (
            <label style={champ}>Nombre de coloristes (toi comprise ou compris)
              <select value={form.places || 4} onChange={(e) => setForm({ ...form, places: Number(e.target.value) })}>
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n} coloristes</option>)}
              </select>
            </label>
          )}
          {form.genre === 'duel' && (
            <label style={champ}>Adversaire
              <select value={form.inviteId} onChange={(e) => setForm({ ...form, inviteId: e.target.value })}>
                <option value="">Choisir une personne</option>
                {inviter && !abonnements.some((a) => String(a.user_id) === inviter) && <option value={inviter}>Membre invité depuis son profil</option>}
                {abonnements.map((a) => <option key={a.user_id} value={a.user_id}>{nomAuteur(a)}</option>)}
              </select>
              <small style={{ color: 'var(--texte-secondaire)', fontWeight: 400 }}>Vous devez vous suivre mutuellement.</small>
            </label>
          )}
          <button type="button" className="btn" onClick={creer} disabled={!form.theme.trim() || (form.genre === 'duel' && !form.inviteId)} style={{ minHeight: '48px', fontWeight: 700 }}>
            {form.genre === 'duel' ? 'Envoyer l’invitation' : 'Lancer la joute'}
          </button>
          {erreur && <small style={{ color: 'var(--danger)' }}><TexteErreur texte={erreur} /></small>}
        </Feuille>
      )}
      {choix && (
        <ChoixColoriage type={choix.combat.categorie} onChoisir={choisir} onFermer={() => setChoix(null)} erreur={erreur}
          aide={`Coloriage de type ${nomType(choix.combat.categorie)}, sur le thème « ${choix.combat.theme} ».`} />
      )}
    </div>
  );
}
