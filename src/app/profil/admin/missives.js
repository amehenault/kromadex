'use client';
import { useEffect, useState } from 'react';
import { Send, Trash2, Check, X, Pin, BarChart3, Plus } from 'lucide-react';
import { MIN_REPONSES, MAX_REPONSES, DUREES_SONDAGE, DUREE_PAR_DEFAUT } from '@/lib/sondages';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { jourQuebec, ajouterJours } from '@/lib/temps';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';
import Pseudo from '@/components/Pseudo';
import Sondage from '@/components/Sondage';

const STATUT = { publiee: 'Publiée', en_attente: "En attente de l’Invocatrice des couleurs", refusee: 'Refusée' };
const jourLong = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' });

// Écrire des missives : l'admin publie directement, la modo envoie à l'admin pour approbation
export default function Missives({ role }) {
  const [missives, setMissives] = useState([]);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [commentaires, setCommentaires] = useState(true);
  // Épinglage sur l'accueil jusqu'à une date d'échéance (incluse), une semaine par défaut
  const [epingler, setEpingler] = useState(false);
  const [echeance, setEcheance] = useState(() => ajouterJours(jourQuebec(), 7));
  const [message, setMessage] = useState('');
  // Sondage facultatif : 2 à 8 réponses, une ou plusieurs réponses permises, durée (48 heures par défaut)
  const sondageVide = () => ({ actif: false, options: ['', ''], multiple: false, heures: DUREE_PAR_DEFAUT });
  const [sondage, setSondage] = useState(sondageVide);
  const reponses = sondage.options.filter((o) => o.trim()).length;
  const sondageIncomplet = sondage.actif && reponses < MIN_REPONSES;
  // Brouillon automatique dès qu'on commence à écrire la missive
  const brouillon = useBrouillon('missive', { titre, contenu, commentaires, epingler, echeance, sondage }, Boolean(titre.trim() || contenu.trim()));
  function reprendre(d) {
    if (!d) return;
    setTitre(d.titre || ''); setContenu(d.contenu || ''); setCommentaires(d.commentaires !== false);
    setEpingler(Boolean(d.epingler)); if (d.echeance) setEcheance(d.echeance);
    if (d.sondage) setSondage({ ...sondageVide(), ...d.sondage });
  }
  const changerReponse = (i, v) => setSondage((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? v : o)) }));
  const estAdmin = role === 'admin';

  async function charger() {
    const res = await fetch('/api/missives?gestion=1');
    if (res.ok) setMissives((await res.json()).missives || []);
  }
  useEffect(() => { charger(); }, []);

  async function publier(e) {
    e.preventDefault();
    const r = await envoyer('/api/missives', 'POST', {
      titre, contenu, commentaires, epingleeJusqu: epingler ? echeance : null,
      sondage: sondage.actif ? { options: sondage.options, multiple: sondage.multiple, heures: sondage.heures } : null,
    });
    setMessage(r.ok ? (r.statut === 'publiee' ? 'Missive envoyée' : "Missive envoyée à l’Invocatrice des couleurs pour approbation") : r.error);
    if (r.ok) { setTitre(''); setContenu(''); setEpingler(false); setSondage(sondageVide()); brouillon.effacer(); charger(); }
  }

  async function decider(m, statut) {
    await envoyer('/api/missives', 'PUT', { id: m.id, statut });
    charger();
  }

  async function changerEpingle(m, date) {
    await envoyer('/api/missives', 'PUT', { id: m.id, epingleeJusqu: date });
    charger();
  }

  async function supprimer(m) {
    if (!confirm(`Supprimer la missive « ${m.titre} » ?`)) return;
    await envoyer('/api/missives', 'DELETE', { id: m.id });
    charger();
  }

  const enAttente = missives.filter((m) => m.statut === 'en_attente');

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="de missive" brouillon={brouillon} onReprendre={reprendre} />
      <form onSubmit={publier} className="carte" style={colonne}>
        <b>Nouvelle missive</b>
        <p style={aide}>
          {estAdmin
            ? "Elle s'ajoute aux Missives, avec une pastille pour chaque membre tant qu'elle n'est pas lue. Épinglée, elle s'affiche aussi en entier sur l'accueil jusqu'à la date choisie."
            : "L’Invocatrice des couleurs la relit et l’approuve avant qu’elle s’affiche pour les membres."}
        </p>
        <label style={champ}>Titre
          <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={120} placeholder="ex. L'épreuve d'octobre est lancée !" />
        </label>
        <label style={champ}>Message
          <textarea rows={6} value={contenu} onChange={(e) => setContenu(e.target.value)} maxLength={4000} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={commentaires} onChange={(e) => setCommentaires(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0 }} />
          Autoriser les commentaires
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={epingler} onChange={(e) => setEpingler(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0 }} />
          Épingler sur l'accueil
        </label>
        {epingler && (
          <label style={champ}>Épinglée jusqu'au (inclus)
            <input type="date" value={echeance} min={jourQuebec()} onChange={(e) => setEcheance(e.target.value)} style={dateStyle} />
          </label>
        )}
        {/* Sondage */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input type="checkbox" checked={sondage.actif} onChange={(e) => setSondage({ ...sondage, actif: e.target.checked })} style={{ width: '20px', height: '20px', margin: 0 }} />
          <BarChart3 size={18} aria-hidden="true" /> Ajouter un sondage
        </label>
        {sondage.actif && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
            <small style={aide}>Entre {MIN_REPONSES} et {MAX_REPONSES} réponses.</small>
            {sondage.options.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input value={o} onChange={(e) => changerReponse(i, e.target.value)} maxLength={100}
                  placeholder={`Réponse ${i + 1}`} aria-label={`Réponse ${i + 1}`} style={{ flex: 1, minWidth: 0, margin: 0 }} />
                {sondage.options.length > MIN_REPONSES && (
                  <button type="button" className="btn alt" aria-label={`Retirer la réponse ${i + 1}`}
                    onClick={() => setSondage({ ...sondage, options: sondage.options.filter((_, j) => j !== i) })}
                    style={{ minWidth: '44px', minHeight: '44px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {sondage.options.length < MAX_REPONSES && (
              <button type="button" className="btn alt" onClick={() => setSondage({ ...sondage, options: [...sondage.options, ''] })}
                style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Plus size={16} aria-hidden="true" /> Ajouter une réponse
              </button>
            )}
            <div role="radiogroup" aria-label="Nombre de réponses permises" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[[false, 'Une seule réponse'], [true, 'Plusieurs réponses']].map(([v, l]) => (
                <button key={l} type="button" role="radio" aria-checked={sondage.multiple === v} onClick={() => setSondage({ ...sondage, multiple: v })}
                  className={sondage.multiple === v ? 'btn' : 'btn alt'} style={{ minHeight: '44px', fontSize: '0.85rem', minWidth: 0 }}>{l}</button>
              ))}
            </div>
            <label style={champ}>Durée du sondage
              <select value={sondage.heures} onChange={(e) => setSondage({ ...sondage, heures: Number(e.target.value) })}>
                {DUREES_SONDAGE.map((d) => <option key={d.heures} value={d.heures}>{d.label}{d.heures === DUREE_PAR_DEFAUT ? ' (par défaut)' : ''}</option>)}
              </select>
            </label>
            {!estAdmin && <small style={aide}>La durée commence quand l’Invocatrice des couleurs approuve la missive.</small>}
            {sondageIncomplet && <small style={{ color: 'var(--danger)', fontWeight: 600 }}>Écris au moins {MIN_REPONSES} réponses.</small>}
          </div>
        )}
        <button type="submit" className="btn" disabled={!titre.trim() || sondageIncomplet} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}>
          <Send size={16} /> {estAdmin ? 'Envoyer à tout le monde' : "Envoyer à l’Invocatrice des couleurs"}
        </button>
        {message && <small>{message}</small>}
      </form>

      {estAdmin && enAttente.length > 0 && (
        <div className="carte" style={colonne}>
          <b>À approuver ({enAttente.length})</b>
          {enAttente.map((m) => (
            <div key={m.id} style={{ ...ligneCarte, border: '2px solid var(--btn)' }}>
              <small style={aide}>De <Pseudo x={{ pseudo: m.auteur, role: m.role_auteur }} repli="modo" /></small>
              <b>{m.titre}</b>
              {m.contenu && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.contenu}</p>}
              {/* Sondage : résultats en lecture seule */}
              {m.sondage && <Sondage missiveId={m.id} sondage={m.sondage} lectureSeule />}
              <div style={actions}>
                <button type="button" className="btn" style={petitBtn} onClick={() => decider(m, 'publiee')}><Check size={14} /> Approuver</button>
                <button type="button" className="btn alt danger" style={petitBtn} onClick={() => decider(m, 'refusee')}><X size={14} /> Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="carte" style={colonne}>
        <b>{estAdmin ? 'Toutes les missives' : 'Missives'}</b>
        {missives.filter((m) => !(estAdmin && m.statut === 'en_attente')).map((m) => (
          <div key={m.id} style={{ ...ligneCarte, opacity: m.statut === 'refusee' ? 0.6 : 1 }}>
            <small style={aide}>
              {new Date(m.cree_le).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
              {m.auteur && <> · <Pseudo x={{ pseudo: m.auteur, role: m.role_auteur }} /></>} · {STATUT[m.statut]}
            </small>
            <b>{m.titre}</b>
            {m.contenu && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{m.contenu}</p>}
            {m.epinglee_jusqu && m.epinglee_jusqu >= jourQuebec() && (
              <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <Pin size={14} aria-hidden="true" /> Épinglée jusqu'au {jourLong(m.epinglee_jusqu)}
              </small>
            )}
            {estAdmin && m.statut === 'publiee' && (
              <label style={champ}>Épinglée sur l'accueil jusqu'au
                <span style={{ display: 'flex', gap: '6px', minWidth: 0 }}>
                  <input type="date" value={m.epinglee_jusqu || ''} min={jourQuebec()} onChange={(e) => changerEpingle(m, e.target.value || null)}
                    style={{ ...dateStyle, flex: 1 }} />
                  {m.epinglee_jusqu && (
                    <button type="button" className="btn alt" style={petitBtn} onClick={() => changerEpingle(m, null)}>Désépingler</button>
                  )}
                </span>
              </label>
            )}
            {(estAdmin || m.statut !== 'publiee') && (
              <button type="button" className="btn alt danger" style={{ ...petitBtn, alignSelf: 'flex-start' }} onClick={() => supprimer(m)}>
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>
        ))}
        {!missives.length && <p style={aide}>Aucune missive pour le moment.</p>}
      </div>
    </div>
  );
}
