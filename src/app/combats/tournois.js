'use client';
import { useEffect, useState } from 'react';
import { Crown, Plus, Gift, Image as ImageIcon, Trophy, Check } from 'lucide-react';
import { TempsRestant, useFuseau } from '@/components/Fuseau';
import { formaterInstant } from '@/lib/temps';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import Verdict from '@/components/Verdict';
import { CATEGORIES_DEFI, nomCategorie } from '@/lib/defis';
import { TOURNOIS, XP_TOURNOI, GENRES_TOURNOI } from '@/lib/activites';

const nomGenre = (v) => GENRES_TOURNOI.find((g) => g.valeur === v)?.label || '';
const nomRonde = (ronde, taille) => {
  const restants = taille / 2 ** (ronde - 1);
  return restants === 2 ? 'Finale' : restants === 4 ? 'Demi-finales' : restants === 8 ? 'Quarts de finale' : `Ronde ${ronde}`;
};
const INFO = `La période d’inscription est de ${TOURNOIS.joursInscription} jours. Pour chaque ronde, les participant·es ont ${TOURNOIS.joursSoumission} jours pour soumettre leur coloriage, puis l’Assemblée a ${TOURNOIS.joursVerdict} jours pour rendre son verdict. Un tournoi dure en moyenne entre 31 et 39 jours et demande un nouveau coloriage à chaque ronde.`;

// Tournoi du royaume : 8 ou 16 coloristes, duos au hasard, élimination ronde après ronde jusqu'à la finale
export default function Tournois() {
  const [donnees, setDonnees] = useState(null);
  const [form, setForm] = useState(null);
  const [choix, setChoix] = useState(null); // { tournoi, match }
  const [verdict, setVerdict] = useState(null);
  const [erreur, setErreur] = useState('');
  const fuseau = useFuseau();

  async function charger() {
    const r = await fetch('/api/tournois');
    if (r.ok) setDonnees(await r.json());
  }
  useEffect(() => { charger(); }, []);

  async function action(corps, confirmation) {
    if (confirmation && !confirm(confirmation)) return;
    setErreur('');
    const r = await fetch('/api/tournois', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    if (!r.ok) { setErreur((await r.json().catch(() => ({}))).error || 'Erreur'); return; }
    setForm(null); setChoix(null); charger();
  }

  if (!donnees) return <p>Chargement…</p>;
  const { tournois, creation } = donnees;
  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const champ = { display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '0.9rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <small style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--texte-secondaire)' }}>
        <Gift size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} />
        <span>{XP_TOURNOI.participation} XP de participation, +{XP_TOURNOI.ronde} XP par ronde remportée, +{XP_TOURNOI.finale} XP pour les finalistes, +{XP_TOURNOI.victoire} XP et l’Insigne du tournoi pour la victoire.</span>
      </small>

      {creation && (
        creation.ok
          ? <button type="button" className="btn" onClick={() => setForm({ genre: 'creatif', titre: '', theme: '', categorie: 'tous' })}
              style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
              <Plus size={18} aria-hidden="true" /> Créer un tournoi du royaume
            </button>
          : <small style={{ color: 'var(--texte-secondaire)' }}>
              Création d’un tournoi : {creation.raison}{creation.possibleLe ? ` (possible dès le ${formaterInstant(creation.possibleLe, fuseau)})` : ''}.
            </small>
      )}
      {erreur && !form && !choix && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}
      {!tournois.length && <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Aucun tournoi pour l’instant. Les sentinelles en organisent un par mois au maximum.</p>}

      {tournois.map((t) => (
        <div key={t.id} className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={14} aria-hidden="true" /> Tournoi {nomGenre(t.genre).toLowerCase()}
            </small>
            <small style={{ fontWeight: 700 }}>{nomCategorie(t.categorie)}</small>
          </div>
          <b style={{ overflowWrap: 'anywhere' }}>{t.titre}</b>
          {t.theme && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{t.theme}</p>}

          {t.statut === 'inscriptions' && (
            <>
              <small style={{ fontWeight: 700 }}>{t.inscrits} / {TOURNOIS.tailles.at(-1)} inscrit·es{t.prolonge ? ' · inscriptions prolongées une fois' : ''}</small>
              <TempsRestant fin={t.inscriptions_fin} />
              <small style={{ color: 'var(--texte-secondaire)' }}>{INFO} Il faut 8 ou 16 inscrit·es, sinon le tournoi est annulé.</small>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {t.inscrit
                  ? <><span style={{ ...petit, fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Inscrit·e</span>
                      <button type="button" className="btn alt" style={petit} onClick={() => action({ action: 'desinscrire', id: t.id })}>Me désinscrire</button></>
                  : <button type="button" className="btn" style={petit} onClick={() => action({ action: 'inscrire', id: t.id }, `${INFO}\n\nTu t’inscris ?`)}>M’inscrire</button>}
                {t.je_cree && <button type="button" className="btn alt danger" style={petit} onClick={() => action({ action: 'annuler', id: t.id }, 'Annuler ce tournoi ?')}>Annuler le tournoi</button>}
              </div>
            </>
          )}

          {t.statut === 'en_cours' && (
            <>
              <small style={{ fontWeight: 700 }}>{nomRonde(t.ronde, t.taille)} · {t.taille} coloristes au départ</small>
              {t.mon_match && !t.mon_match.decide && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: 'var(--rayon-m)', border: '2px solid var(--btn)' }}>
                  <b>Mon duo de la ronde</b>
                  {new Date(t.mon_match.soumission_fin) > new Date() ? (
                    <>
                      <TempsRestant fin={t.mon_match.soumission_fin} />
                      <small>{t.mon_match.ma_page ? 'Ton coloriage est soumis.' : 'Soumets ton coloriage avant la date limite, sinon tu perds la ronde.'}{t.mon_match.adversaire_soumis ? ' Ton adversaire a soumis le sien.' : ''}</small>
                      <button type="button" className="btn" style={petit} onClick={() => setChoix({ tournoi: t, match: t.mon_match })}>
                        <ImageIcon size={16} aria-hidden="true" /> {t.mon_match.ma_page ? 'Changer mon coloriage' : 'Soumettre mon coloriage'}
                      </button>
                    </>
                  ) : <small>Verdict de l’Assemblée en cours.</small>}
                </div>
              )}
              {t.inscrit && !t.encore_en_lice && <small style={{ color: 'var(--texte-secondaire)' }}>Tu as été éliminé·e, merci d’avoir combattu !</small>}
              {(t.matchs || []).map((m) => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--bordure-carte)', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <small style={{ fontWeight: 700 }}>Duo {m.ordre}{m.decide ? ' · décidé' : new Date(m.soumission_fin) > new Date() ? ' · coloriages en préparation' : ' · verdict'}</small>
                    {m.complet && new Date(m.soumission_fin) <= new Date() && (
                      <button type="button" className="btn alt" style={petit} onClick={() => setVerdict(verdict === m.id ? null : m.id)}>
                        {verdict === m.id ? 'Masquer' : m.decide ? 'Voir les coloriages' : 'Rendre mon verdict'}
                      </button>
                    )}
                  </div>
                  {verdict === m.id && <Verdict activite={`match:${m.id}`} />}
                </div>
              ))}
            </>
          )}

          {t.statut === 'termine' && (
            <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}>
              <Trophy size={16} aria-hidden="true" /> {t.j_ai_gagne ? 'Tu as remporté ce tournoi !' : `Vainqueur·e : ${t.nom_gagnant || 'membre'}`}
            </small>
          )}
          {t.statut === 'annule' && <small style={{ color: 'var(--texte-secondaire)' }}>Tournoi annulé (pas assez d’inscriptions).</small>}
        </div>
      ))}

      {form && (
        <Feuille titre="Nouveau tournoi du royaume" onFermer={() => setForm(null)}>
          <label style={champ}>Type de tournoi
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
              {GENRES_TOURNOI.map((g) => <option key={g.valeur} value={g.valeur}>{g.label} : {g.aide}</option>)}
            </select>
          </label>
          <label style={champ}>Nom du tournoi
            <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={100} placeholder="ex. Le tournoi des braises" />
          </label>
          <label style={champ}>{form.genre === 'couleur' ? 'Couleur à utiliser massivement' : form.genre === 'ambiance' ? 'Ambiance demandée' : 'Précisions (facultatif)'}
            <textarea rows={2} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} maxLength={200} />
          </label>
          <label style={champ}>Type de coloriage
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              {CATEGORIES_DEFI.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
            </select>
          </label>
          <small style={{ color: 'var(--texte-secondaire)' }}>{INFO} Un tournoi par mois au maximum, et 72 h d’attente après la fin du précédent.</small>
          <button type="button" className="btn" disabled={!form.titre.trim()} onClick={() => action({ action: 'creer', ...form })} style={{ minHeight: '48px', fontWeight: 700 }}>Ouvrir les inscriptions</button>
          {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}
        </Feuille>
      )}
      {choix && (
        <ChoixColoriage type={choix.tournoi.categorie} onFermer={() => setChoix(null)} erreur={erreur}
          aide="Un nouveau coloriage à chaque ronde."
          onChoisir={(f) => action({ action: 'soumettre', id: choix.tournoi.id, matchId: choix.match.id, pageId: f.id })} />
      )}
    </div>
  );
}
