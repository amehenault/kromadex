'use client';
import { useEffect, useState } from 'react';
import { Trash2, CalendarClock } from 'lucide-react';
import { CATEGORIES_DEFI, nomCategorie } from '@/lib/defis';
import { useFuseau, TempsRestant } from '@/components/Fuseau';
import { formaterInstant } from '@/lib/temps';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import Pseudo from '@/components/Pseudo';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';
import { NUMEROS_SCEAUX, imageSceau } from '@/lib/recompenses';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
const GENRES = { officiel: 'Officielle', modo: 'De sentinelle', cheffe: 'De cheffe' };
const vide = () => ({ id: null, titre: '', description: '', categorie: 'tous', debut: '', fin: '', titre_gagnant: '', image: '', sceau: 1 });
const DOSSIER_BADGE = { officiel: 'epreuve/mensuelles', modo: 'epreuve/sentinelles' };

// Épreuves.
//  admin : épreuve officielle, programmable (dates libres)
//  modo : sa propre épreuve du mois ; elle commence le 1er du mois prochain,
//         ou tout de suite si on est dans les 7 premiers jours du mois et qu'on le choisit
//  cheffe : son épreuve, à créer dans les 7 jours qui suivent sa nomination ; elle commence tout de suite
export default function Defis({ role, monId }) {
  const [donnees, setDonnees] = useState({ defis: [], aujourdhui: '' });
  const [form, setForm] = useState(vide);
  const [choixDepart, setChoixDepart] = useState(false);
  const [message, setMessage] = useState('');
  const estAdmin = role === 'admin';
  const fuseau = useFuseau();
  const genre = estAdmin ? 'officiel' : role; // 'modo' ou 'cheffe'
  // Brouillon automatique dès qu'on commence à écrire l'épreuve
  const brouillon = useBrouillon('epreuve', form, Boolean(form.titre.trim() || form.description.trim()));

  async function charger() {
    const res = await fetch('/api/defis?gestion=1');
    if (res.ok) setDonnees(await res.json());
  }
  useEffect(() => { charger(); }, []);

  async function publier(depart) {
    setChoixDepart(false);
    const r = await envoyer('/api/defis', 'POST', { ...form, genre, depart });
    setMessage(r.ok
      ? (r.debut ? `Épreuve enregistrée, active à partir du ${jour(r.debut)}` : 'Épreuve enregistrée')
      : r.error);
    if (r.ok) { setForm(vide()); brouillon.effacer(); charger(); }
  }

  function enregistrer(e) {
    e.preventDefault();
    // Modo et cheffe : dans les 7 premiers jours du mois, on demande quand l'épreuve commence
    const premiersJours = Number((donnees.aujourdhui || '').slice(8, 10)) <= 7;
    if (role === 'modo' && !form.id && premiersJours) { setChoixDepart(true); return; }
    publier('mois_prochain');
  }

  async function supprimer(d) {
    if (!confirm(`Supprimer l'épreuve « ${d.titre} » ?`)) return;
    await envoyer('/api/defis', 'DELETE', { id: d.id });
    charger();
  }

  const visibles = donnees.defis.filter((d) => estAdmin || String(d.createur_id) === monId);
  // Cheffe : 7 jours après la nomination pour créer son épreuve, une seule par mandat
  const delai = donnees.cheffe;
  const cheffeBloquee = role === 'cheffe' && !form.id && (!delai?.ouvert || delai?.deja);
  const texteCheffe = !delai ? '' : delai.deja
    ? 'Tu as déjà créé ton épreuve de cheffe pour ce mandat. Tu peux encore la modifier ci-dessous.'
    : delai.ouvert
      ? `Tu as jusqu’au ${formaterInstant(delai.limite, fuseau)} pour créer ton épreuve de cheffe. Elle commence dès que tu l’enregistres et dure jusqu’à la fin de ton mandat.`
      : 'Le délai de 7 jours après ta nomination est passé : tu ne peux plus créer d’épreuve de cheffe pour ce mandat.';
  const titreForm = estAdmin ? (form.id ? "Modifier l'épreuve officielle" : 'Nouvelle épreuve officielle')
    : role === 'modo' ? 'Mon épreuve de sentinelle du mois' : 'Mon épreuve de chef.fe';

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="d’épreuve" brouillon={brouillon} onReprendre={(d) => d && setForm({ ...vide(), ...d })} />
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{titreForm}</b>
        <p style={aide}>
          {estAdmin
            ? "Une épreuve officielle par mois. Choisis ses dates : avec une date de début à venir, elle est programmée et n'apparaît aux membres que ce jour-là. Sans date de fin, elle se termine la veille du dernier jour du mois : la personne gagnante est annoncée le dernier jour."
            : role === 'modo'
              ? "Ton épreuve commence le 1er du mois prochain. Pendant les 7 premiers jours du mois, tu peux aussi la lancer tout de suite."
              : texteCheffe}
        </p>
        {role === 'cheffe' && delai?.ouvert && !delai?.deja && <TempsRestant fin={delai.limite} />}
        {estAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <label style={champ}>Début
              <input type="date" value={form.debut} onChange={(e) => setForm({ ...form, debut: e.target.value })} style={dateStyle} />
            </label>
            <label style={champ}>Fin (facultatif)
              <input type="date" value={form.fin} min={form.debut || undefined} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={dateStyle} />
            </label>
          </div>
        )}
        <label style={champ}>Thème de l'épreuve
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Que des tons pastel" maxLength={100} />
        </label>
        <label style={champ}>Catégorie
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES_DEFI.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
          </select>
        </label>
        <label style={champ}>Règles et détails
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
        </label>
        {/* Récompense de la personne gagnante */}
        <label style={champ}>Titre exclusif de la personne gagnante (facultatif)
          <input value={form.titre_gagnant} onChange={(e) => setForm({ ...form, titre_gagnant: e.target.value })} maxLength={60} placeholder="ex. Reine des pastels" />
          <small style={{ ...aide, fontWeight: 400 }}>Ce nouveau titre est débloqué pour la personne qui gagne l’épreuve.</small>
        </label>
        {DOSSIER_BADGE[genre] && (
          <label style={champ}>Image du badge (facultatif)
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} maxLength={120} placeholder="ex. badge-pastels.png" />
            <small style={{ ...aide, fontWeight: 400 }}>Nom du fichier dans public/recompenses-activites/{DOSSIER_BADGE[genre]}. Sans image, le badge par défaut est utilisé.</small>
          </label>
        )}
        {genre === 'cheffe' && (
          <fieldset style={{ ...champ, border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <legend style={{ padding: 0, marginBottom: '6px' }}>Sceau remis à la personne gagnante</legend>
            {/* Les sceaux de cheffe (public/recompenses-activites/epreuve/chef) : on touche celui qu'on veut remettre */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
              {NUMEROS_SCEAUX.map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, sceau: n })} aria-pressed={form.sceau === n}
                  aria-label={`Sceau ${n}`} className={form.sceau === n ? 'btn' : 'btn alt'}
                  style={{ flexDirection: 'column', gap: '4px', padding: '8px', minHeight: '88px', minWidth: 0 }}>
                  <img src={imageSceau(n)} alt="" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                  <small style={{ fontSize: '0.75rem' }}>Sceau {n}</small>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.titre.trim() || (estAdmin && !form.debut) || cheffeBloquee} style={{ flex: 1, minHeight: '44px' }}>
            Enregistrer l'épreuve
          </button>
          {form.id && <button type="button" className="btn alt" onClick={() => setForm(vide())}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      {visibles.length > 0 && (
        <div className="carte" style={colonne}>
          <b>{estAdmin ? 'Épreuves officielles, de sentinelle et de cheffe' : 'Mes épreuves'}</b>
          {visibles.map((d) => (
            <div key={d.id} style={ligneCarte}>
              <small style={{ ...aide, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                {d.programme && <CalendarClock size={14} aria-hidden="true" />}
                {GENRES[d.genre]}{d.genre !== 'officiel' && d.choisi_par && <> <Pseudo x={{ pseudo: d.choisi_par, role: d.role_createur }} /></>} · {d.programme ? 'programmée : ' : ''}{jour(d.debut)} au {jour(d.fin)}
              </small>
              <b>{d.titre}</b>
              <small>{nomCategorie(d.categorie)} · {d.participants} participant{d.participants > 1 ? 's' : ''}</small>
              <div style={actions}>
                {d.genre === genre && (estAdmin || String(d.createur_id) === monId) && (
                  <button type="button" className="btn alt" style={petitBtn}
                    onClick={() => { setForm({ id: d.id, titre: d.titre, description: d.description, categorie: d.categorie, debut: d.debut, fin: d.fin, titre_gagnant: d.titre_gagnant || '', image: d.image || '', sceau: d.sceau || 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    Modifier
                  </button>
                )}
                <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(d)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {choixDepart && (
        <div data-feuille onClick={() => setChoixDepart(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div role="dialog" aria-label="Début de l'épreuve" onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <b>Veux-tu que cette épreuve soit active dès aujourd'hui ou le 1er du mois prochain ?</b>
            <button type="button" className="btn" style={{ minHeight: '48px' }} onClick={() => publier('maintenant')}>Dès aujourd'hui</button>
            <button type="button" className="btn alt" style={{ minHeight: '48px' }} onClick={() => publier('mois_prochain')}>Le 1er du mois prochain</button>
          </div>
        </div>
      )}
    </div>
  );
}
