'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Compass, Shield, Sparkles, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { CATEGORIES_DEFI } from '@/lib/defis';
import { FETES, XP_SECONDAIRE, XP_EPOPEE, XP_PROPHETIE, DEGATS, MOIS_EPOPEES, NOMS_AVENTURES } from '@/lib/activites';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
const iso = (a, m, j) => `${a}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
const finMois = (a, m) => iso(a, m, new Date(Date.UTC(a, m, 0)).getUTCDate());
const plus = (d, n) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const ICONES = { expedition: Compass, epopee: Shield, prophetie: Sparkles };
const GENRES_CONTRAINTE = {
  expedition: [['obligatoire', 'Obligatoire'], ['secondaire', 'Secondaire']],
  epopee1: [['obligatoire', 'Obligatoire']],
  epopee2: Object.entries(DEGATS).map(([v, d]) => [v, `${d.label} (${d.min} à ${d.max} points)`]),
  prophetie: [['obligatoire', 'Obligatoire']],
};
const contrainte = (genre, extra = {}) => ({ texte: '', genre, degats: DEGATS[genre] ? Math.round((DEGATS[genre].min + DEGATS[genre].max) / 2) : 0, xp: genre === 'secondaire' ? XP_SECONDAIRE : 0, ...extra });

// Modèles de départ, que l'Invocatrice adapte librement
function modele(genre) {
  const annee = new Date().getFullYear();
  if (genre === 'expedition') {
    const f = FETES.find((x) => x.mois > new Date().getMonth() + 1) || FETES[0];
    return {
      genre, titre: '', description: '', fete: f.valeur, categorie: 'tous', debut: `${annee}-${f.debut}`, fin: `${annee}-${f.fin}`, xp: {},
      etapes: [{ nom: 'Expédition', instructions: '', xp: f.xp, contraintes: [contrainte('obligatoire'), contrainte('secondaire'), contrainte('secondaire')] }],
    };
  }
  if (genre === 'epopee') {
    const m = MOIS_EPOPEES.find((x) => x > new Date().getMonth() + 1) || MOIS_EPOPEES[0];
    const debut = iso(annee + (m <= new Date().getMonth() + 1 ? 1 : 0), m, 1);
    return {
      genre, titre: '', description: '', categorie: 'tous', debut, fin: plus(debut, 13), enigme: '', reponse: '', pv: 12000, min_contributions: 6, min_attaques: 12,
      xp: { ...XP_EPOPEE }, recompense: 'Blason de ', image: '',
      etapes: [
        { nom: 'Ouvrir la route vers le dragon', instructions: '', xp: 0, contraintes: [contrainte('obligatoire')] },
        { nom: 'Affronter le dragon', instructions: '', xp: 0, contraintes: [contrainte('facile'), contrainte('intermediaire'), contrainte('difficile')] },
      ],
    };
  }
  const debut = iso(annee, 5, 1);
  return {
    genre, titre: '', description: '', categorie: 'tous', debut, fin: finMois(annee, 5), xp: { complet: XP_PROPHETIE.complet }, image: '',
    etapes: [0, 1, 2].map((i) => ({ nom: `Étape ${i + 1}`, instructions: '', xp: XP_PROPHETIE.etape, debut: plus(debut, i * 7), fin: plus(debut, i * 7 + 6), contraintes: [contrainte('obligatoire')] })),
  };
}

// Expéditions, épopées et prophéties : tout se configure (étapes, contraintes, XP, durées, dégâts)
export default function Aventures() {
  const [aventures, setAventures] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  // Brouillon automatique dès qu'on commence à écrire l'aventure
  const brouillon = useBrouillon('aventure', form || {}, Boolean(form && (form.titre?.trim() || form.description?.trim() || form.etapes?.some((e) => e.instructions?.trim()))));

  async function charger() {
    const r = await fetch('/api/aventures?gestion=1');
    if (r.ok) setAventures((await r.json()).aventures || []);
  }
  useEffect(() => { charger(); }, []);

  const maj = (champs) => setForm({ ...form, ...champs });
  const majEtape = (i, champs) => setForm({ ...form, etapes: form.etapes.map((e, j) => (j === i ? { ...e, ...champs } : e)) });
  const majContrainte = (i, k, champs) => majEtape(i, { contraintes: form.etapes[i].contraintes.map((c, j) => (j === k ? { ...c, ...champs } : c)) });
  const deplacer = (i, sens) => {
    const e = [...form.etapes]; const j = i + sens;
    if (j < 0 || j >= e.length) return;
    [e[i], e[j]] = [e[j], e[i]]; setForm({ ...form, etapes: e });
  };

  function choisirFete(valeur) {
    const f = FETES.find((x) => x.valeur === valeur);
    const annee = (form.debut || '').slice(0, 4) || new Date().getFullYear();
    setForm({ ...form, fete: valeur, debut: `${annee}-${f.debut}`, fin: `${annee}-${f.fin}`, etapes: form.etapes.map((e, i) => (i === 0 ? { ...e, xp: f.xp } : e)) });
  }

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/aventures', 'POST', { ...form, action: 'enregistrer' });
    setMessage(r.ok ? 'Aventure enregistrée' : r.error);
    if (r.ok) { setForm(null); brouillon.effacer(); charger(); }
  }
  async function supprimer(a) {
    if (!confirm(`Supprimer « ${a.titre} » et toutes ses soumissions ?`)) return;
    await envoyer('/api/aventures', 'DELETE', { id: a.id });
    charger();
  }

  const genreContraintes = (i) => (form.genre === 'epopee' ? (i === 0 ? 'epopee1' : 'epopee2') : form.genre);
  const nombre = (cle, label, valeur, onChange) => (
    <label key={cle} style={champ}>{label}
      <input type="number" inputMode="numeric" min={0} value={valeur ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
    </label>
  );

  if (form) {
    const nom = NOMS_AVENTURES[form.genre];
    return (
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? `Modifier : ${form.titre}` : `Nouvelle ${nom.singulier.toLowerCase()}`}</b>
        {form.genre === 'expedition' && (
          <label style={champ}>Fête
            <select value={form.fete} onChange={(e) => choisirFete(e.target.value)}>
              {FETES.map((f) => <option key={f.valeur} value={f.valeur}>{f.nom} ({f.occasion})</option>)}
            </select>
          </label>
        )}
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => maj({ titre: e.target.value })} maxLength={100} placeholder={form.genre === 'epopee' ? 'ex. Le royaume de Valombre' : 'ex. Le peuple des cœurs'} required />
        </label>
        <label style={champ}>Histoire et instructions générales
          <textarea rows={4} value={form.description} onChange={(e) => maj({ description: e.target.value })} maxLength={2000} />
        </label>
        <label style={champ}>Type de coloriage
          <select value={form.categorie} onChange={(e) => maj({ categorie: e.target.value })}>
            {CATEGORIES_DEFI.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début<input type="date" value={form.debut} onChange={(e) => maj({ debut: e.target.value })} style={dateStyle} /></label>
          <label style={champ}>Fin<input type="date" value={form.fin} min={form.debut} onChange={(e) => maj({ fin: e.target.value })} style={dateStyle} /></label>
        </div>

        {form.genre === 'epopee' && (
          <>
            <label style={champ}>Énigme de la phase 1
              <textarea rows={3} value={form.enigme} onChange={(e) => maj({ enigme: e.target.value })} maxLength={1000} />
            </label>
            <label style={champ}>Réponse de l’énigme
              <input value={form.reponse} onChange={(e) => maj({ reponse: e.target.value })} maxLength={200} placeholder="ex. le miroir" />
              <small style={{ ...aide, fontWeight: 400 }}>Majuscules et accents ne comptent pas. Plusieurs réponses acceptées : sépare-les par une barre verticale « | ».</small>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {nombre('pv', 'Résistance du dragon', form.pv, (v) => maj({ pv: v }))}
              {nombre('mc', 'Contributions pour ouvrir la route', form.min_contributions, (v) => maj({ min_contributions: v }))}
              {nombre('ma', 'Attaques minimum', form.min_attaques, (v) => maj({ min_attaques: v }))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {nombre('x1', 'XP contribution phase 1', form.xp.phase1, (v) => maj({ xp: { ...form.xp, phase1: v } }))}
              {nombre('x2', 'XP 1re attaque', form.xp.attaque, (v) => maj({ xp: { ...form.xp, attaque: v } }))}
              {nombre('x3', 'XP dragon vaincu', form.xp.victoire, (v) => maj({ xp: { ...form.xp, victoire: v } }))}
              {nombre('x4', 'XP maximum par personne', form.xp.max, (v) => maj({ xp: { ...form.xp, max: v } }))}
            </div>
            <label style={champ}>Nom de la récompense
              <input value={form.recompense} onChange={(e) => maj({ recompense: e.target.value })} maxLength={80} placeholder="ex. Blason de Valombre" />
            </label>
          </>
        )}
        {form.genre === 'prophetie' && nombre('xc', 'XP quand toutes les étapes sont accomplies', form.xp.complet, (v) => maj({ xp: { ...form.xp, complet: v } }))}
        {form.genre !== 'expedition' && (
          <label style={champ}>Image de la récompense (facultatif)
            <input value={form.image} onChange={(e) => maj({ image: e.target.value })} maxLength={120} placeholder={form.genre === 'epopee' ? 'ex. blason-valombre.png' : 'ex. orbe-trois-lunes.png'} />
            <small style={{ ...aide, fontWeight: 400 }}>Nom du fichier dans public/recompenses-activites/autres-activites.</small>
          </label>
        )}

        {form.etapes.map((e, i) => (
          <div key={i} style={{ ...ligneCarte, gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <b>{form.genre === 'epopee' ? `Phase ${i + 1}` : form.genre === 'expedition' ? 'Coloriage demandé' : `Étape ${i + 1}`}</b>
              {form.genre === 'prophetie' && (
                <span style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" className="btn alt" aria-label="Monter" style={{ minWidth: 44, minHeight: 44 }} onClick={() => deplacer(i, -1)}><ChevronUp size={16} aria-hidden="true" /></button>
                  <button type="button" className="btn alt" aria-label="Descendre" style={{ minWidth: 44, minHeight: 44 }} onClick={() => deplacer(i, 1)}><ChevronDown size={16} aria-hidden="true" /></button>
                  {form.etapes.length > 1 && <button type="button" className="btn alt danger" aria-label="Retirer l’étape" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setForm({ ...form, etapes: form.etapes.filter((_, j) => j !== i) })}><Trash2 size={16} aria-hidden="true" /></button>}
                </span>
              )}
            </div>
            <label style={champ}>Nom<input value={e.nom} onChange={(x) => majEtape(i, { nom: x.target.value })} maxLength={100} /></label>
            <label style={champ}>Instructions
              <textarea rows={3} value={e.instructions} onChange={(x) => majEtape(i, { instructions: x.target.value })} maxLength={2000} />
            </label>
            {form.genre !== 'epopee' && nombre(`xp${i}`, form.genre === 'expedition' ? 'XP de l’expédition réussie' : 'XP de l’étape', e.xp, (v) => majEtape(i, { xp: v }))}
            {form.genre === 'prophetie' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label style={champ}>Révélée le<input type="date" value={e.debut || ''} onChange={(x) => majEtape(i, { debut: x.target.value })} style={dateStyle} /></label>
                <label style={champ}>Date limite<input type="date" value={e.fin || ''} min={e.debut} onChange={(x) => majEtape(i, { fin: x.target.value })} style={dateStyle} /></label>
              </div>
            )}
            <b style={{ fontSize: '0.9rem' }}>{form.genre === 'epopee' && i === 1 ? 'Points faibles du dragon' : 'Contraintes'}</b>
            {e.contraintes.map((c, k) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '3px solid var(--bordure-carte)' }}>
                <label style={champ}>Contrainte {k + 1}
                  <input value={c.texte} onChange={(x) => majContrainte(i, k, { texte: x.target.value })} maxLength={300} placeholder="ex. Utiliser au moins 3 tons de rose" />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px', alignItems: 'end' }}>
                  {GENRES_CONTRAINTE[genreContraintes(i)].length > 1 && (
                    <label style={champ}>Type
                      <select value={c.genre} onChange={(x) => majContrainte(i, k, { genre: x.target.value, ...(DEGATS[x.target.value] ? { degats: Math.round((DEGATS[x.target.value].min + DEGATS[x.target.value].max) / 2) } : {}) })}>
                        {GENRES_CONTRAINTE[genreContraintes(i)].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </label>
                  )}
                  {form.genre === 'epopee' && i === 1 && nombre(`d${i}${k}`, 'Dégâts', c.degats, (v) => majContrainte(i, k, { degats: v }))}
                  {form.genre === 'expedition' && c.genre === 'secondaire' && nombre(`c${i}${k}`, 'XP en plus', c.xp, (v) => majContrainte(i, k, { xp: v }))}
                  <button type="button" className="btn alt danger" style={{ ...petitBtn, justifyContent: 'center' }} onClick={() => majEtape(i, { contraintes: e.contraintes.filter((_, j) => j !== k) })}>
                    <Trash2 size={16} aria-hidden="true" /> Retirer
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn alt" style={petitBtn}
              onClick={() => majEtape(i, { contraintes: [...e.contraintes, contrainte(form.genre === 'epopee' && i === 1 ? 'facile' : form.genre === 'expedition' ? 'secondaire' : 'obligatoire')] })}>
              <Plus size={14} aria-hidden="true" /> Ajouter une contrainte
            </button>
          </div>
        ))}
        {form.genre === 'prophetie' && (
          <button type="button" className="btn alt" style={petitBtn} onClick={() => {
            const der = form.etapes.at(-1);
            setForm({ ...form, etapes: [...form.etapes, { nom: `Étape ${form.etapes.length + 1}`, instructions: '', xp: XP_PROPHETIE.etape, debut: der?.fin ? plus(der.fin, 1) : form.debut, fin: der?.fin ? plus(der.fin, 7) : form.fin, contraintes: [contrainte('obligatoire')] }] });
          }}>
            <Plus size={14} aria-hidden="true" /> Ajouter une étape
          </button>
        )}
        <div style={actions}>
          <button type="submit" className="btn" style={{ flex: 1, minHeight: '48px' }} disabled={!form.titre.trim()}>Enregistrer</button>
          <button type="button" className="btn alt" onClick={() => setForm(null)}>Annuler</button>
        </div>
        {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
      </form>
    );
  }

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="d’aventure" brouillon={brouillon} onReprendre={(d) => d && d.genre && setForm(d)} />
      <div className="carte" style={colonne}>
        <b>Créer une aventure</b>
        <p style={aide}>Expédition : une par fête. Épopée : une par saison (janvier, mars, juillet, septembre), deux semaines. Prophétie : une par année, en mai ou en novembre.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {Object.entries(NOMS_AVENTURES).map(([g, n]) => {
            const Icone = ICONES[g];
            return (
              <button key={g} type="button" className="btn" onClick={() => { setMessage(''); setForm(modele(g)); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minHeight: '58px', padding: '6px 4px', fontSize: '0.8rem', minWidth: 0 }}>
                <Icone size={18} aria-hidden="true" /> {n.singulier}
              </button>
            );
          })}
        </div>
        {message && <small>{message}</small>}
      </div>

      {aventures.map((a) => {
        const Icone = ICONES[a.genre];
        return (
          <div key={a.id} style={ligneCarte}>
            <small style={{ ...aide, display: 'flex', alignItems: 'center', gap: '6px' }}><Icone size={14} aria-hidden="true" /> {NOMS_AVENTURES[a.genre].singulier} · {jour(a.debut)} au {jour(a.fin)}</small>
            <b style={{ overflowWrap: 'anywhere' }}>{a.titre}</b>
            <small>
              {a.etapes.length} étape{a.etapes.length > 1 ? 's' : ''} · {a.stats.personnes} personne{a.stats.personnes > 1 ? 's' : ''} · {a.stats.soumissions} soumission{a.stats.soumissions > 1 ? 's' : ''}
              {a.genre === 'epopee' && ` · ${a.stats.inscrits} inscrites · dragon : ${a.epopee.pvRestants} / ${a.pv}${a.epopee.vaincu ? ' (vaincu)' : ''}`}
            </small>
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn} onClick={() => setForm({ ...a, xp: a.xp || {} })}><Pencil size={14} aria-hidden="true" /> Modifier</button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(a)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
