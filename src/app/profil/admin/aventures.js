'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Compass, Shield, Sparkles, Pencil, ChevronUp, ChevronDown, ImagePlus, Eye } from 'lucide-react';
import Link from 'next/link';
import ChoixImageRecompense from '@/components/ChoixImageRecompense';
import { compresserImage } from '@/lib/compressionImage';
import { CATEGORIES_DEFI } from '@/lib/defis';
import { FETES, XP_SECONDAIRE, XP_EPOPEE, XP_PROPHETIE, DEGATS, MOIS_EPOPEES, NOMS_AVENTURES, choixNbColoriages } from '@/lib/activites';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';
import Deroulant from '@/components/Deroulant';

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

function modele(genre) {
  const annee = new Date().getFullYear();
  if (genre === 'expedition') {
    const f = FETES.find((x) => x.mois > new Date().getMonth() + 1) || FETES[0];
    return {
      genre, titre: '', description: '', fete: f.valeur, categorie: 'tous', debut: `${annee}-${f.debut}`, fin: `${annee}-${f.fin}`, xp: {}, nb_coloriages: 1, message_fin: '',
      etapes: [{ nom: 'Expédition', instructions: '', xp: f.xp, contraintes: [contrainte('obligatoire'), contrainte('secondaire'), contrainte('secondaire')] }],
    };
  }
  if (genre === 'epopee') {
    const m = MOIS_EPOPEES.find((x) => x > new Date().getMonth() + 1) || MOIS_EPOPEES[0];
    const debut = iso(annee + (m <= new Date().getMonth() + 1 ? 1 : 0), m, 1);
    return {
      genre, titre: '', description: '', categorie: 'tous', debut, fin: plus(debut, 13), enigme: '', reponse: '', pv: 12000, min_contributions: 6, min_attaques: 12,
      xp: { ...XP_EPOPEE }, recompense: '', image: '', message_fin: '',
      etapes: [
        { nom: 'Ouvrir la route vers le dragon', instructions: '', xp: 0, contraintes: [contrainte('obligatoire')] },
        { nom: 'Affronter le dragon', instructions: '', xp: 0, contraintes: [contrainte('facile'), contrainte('intermediaire'), contrainte('difficile')] },
      ],
    };
  }
  const debut = iso(annee, 5, 1);
  return {
    genre, titre: '', description: '', categorie: 'tous', debut, fin: finMois(annee, 5), xp: { complet: XP_PROPHETIE.complet }, image: '', message_fin: '',
    etapes: [0, 1, 2].map((i) => ({ nom: `Étape ${i + 1}`, instructions: '', message: '', xp: XP_PROPHETIE.etape, debut: plus(debut, i * 7), fin: plus(debut, i * 7 + 6), contraintes: [contrainte('obligatoire')] })),
  };
}

export default function Aventures() {
  const [aventures, setAventures] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [illustration, setIllustration] = useState({ url: '', fichier: null, retirer: false });
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

  function nombreEtapesExpedition(n) {
    const etapes = form.etapes.slice(0, n).map((e, i) => ({ ...e, nom: n > 1 && (!e.nom || e.nom === 'Expédition') ? `Étape ${i + 1}` : n === 1 && /^Étape \d+$/.test(e.nom) ? 'Expédition' : e.nom }));
    const base = form.etapes[0];
    while (etapes.length < n) {
      etapes.push({ nom: `Étape ${etapes.length + 1}`, instructions: '', message: '', xp: base?.xp || 0, contraintes: [contrainte('obligatoire'), contrainte('secondaire'), contrainte('secondaire')] });
    }
    setForm({ ...form, nb_coloriages: n, etapes });
  }

  function choisirFete(valeur) {
    const f = FETES.find((x) => x.valeur === valeur);
    const annee = (form.debut || '').slice(0, 4) || new Date().getFullYear();
    setForm({ ...form, fete: valeur, debut: `${annee}-${f.debut}`, fin: `${annee}-${f.fin}`, etapes: form.etapes.map((e, i) => (i === 0 || form.etapes.length > 1 ? { ...e, xp: f.xp } : e)) });
  }

  function ouvrir(f) {
    setIllustration({ url: f.id && f.illustration ? `/api/aventures/illustration?id=${f.id}&v=${f.illustration}` : '', fichier: null, retirer: false });
    setForm(f);
  }
  async function choisirIllustration(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const blob = await compresserImage(f, 900, 0.85);
    setIllustration({ url: URL.createObjectURL(blob), fichier: blob, retirer: false });
  }

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/aventures', 'POST', { ...form, action: 'enregistrer' });
    if (!r.ok) { setMessage(r.error); return; }
    let erreurImage = '';
    if (illustration.fichier) {
      const fd = new FormData();
      fd.append('id', String(r.id)); fd.append('image', illustration.fichier, 'illustration.jpg');
      const rep = await fetch('/api/aventures/illustration', { method: 'POST', body: fd });
      if (!rep.ok) erreurImage = (await rep.json().catch(() => ({}))).error || 'L’image n’a pas pu être enregistrée.';
    } else if (illustration.retirer) {
      await envoyer('/api/aventures/illustration', 'DELETE', { id: r.id });
    }
    setMessage(erreurImage ? `Aventure enregistrée, mais : ${erreurImage}` : 'Aventure enregistrée');
    setForm(null); brouillon.effacer(); charger();
  }
  async function supprimer(a) {
    if (!confirm(`Supprimer ${a.titre} et toutes ses soumissions ?`)) return;
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
    const epopee = form.genre === 'epopee';
    const grille = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' };
    const section = (titre, enfants) => (
      <fieldset style={{ border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <legend style={{ fontWeight: 800, padding: '0 6px', color: 'var(--btn)' }}>{titre}</legend>
        {enfants}
      </fieldset>
    );
    const titreEtape = (i) => (epopee ? null : form.genre === 'expedition' && form.etapes.length === 1 ? 'Coloriage demandé' : `Étape ${i + 1}`);
    const blocEtape = (e, i) => (
      <div key={i} style={epopee ? { display: 'flex', flexDirection: 'column', gap: '8px' } : { ...ligneCarte, gap: '8px' }}>
        {!epopee && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <b>{titreEtape(i)}</b>
            {form.genre === 'prophetie' && (
              <span style={{ display: 'flex', gap: '4px' }}>
                <button type="button" className="btn alt" aria-label="Monter" style={{ minWidth: 44, minHeight: 44 }} onClick={() => deplacer(i, -1)}><ChevronUp size={16} aria-hidden="true" /></button>
                <button type="button" className="btn alt" aria-label="Descendre" style={{ minWidth: 44, minHeight: 44 }} onClick={() => deplacer(i, 1)}><ChevronDown size={16} aria-hidden="true" /></button>
                {form.etapes.length > 1 && <button type="button" className="btn alt danger" aria-label="Retirer l’étape" style={{ minWidth: 44, minHeight: 44 }} onClick={() => setForm({ ...form, etapes: form.etapes.filter((_, j) => j !== i) })}><Trash2 size={16} aria-hidden="true" /></button>}
              </span>
            )}
          </div>
        )}
        <label style={champ}>{epopee ? 'Nom de la phase' : 'Nom'}<input value={e.nom} onChange={(x) => majEtape(i, { nom: x.target.value })} maxLength={100} /></label>
        <label style={champ}>{epopee ? 'Instructions de la phase' : 'Instructions'}
          <textarea rows={3} value={e.instructions} onChange={(x) => majEtape(i, { instructions: x.target.value })} maxLength={2000} />
        </label>
        {form.genre === 'prophetie' && (
          <label style={champ}>Message après l’étape (facultatif)
            <textarea rows={2} value={e.message || ''} onChange={(x) => majEtape(i, { message: x.target.value })} maxLength={2000} />
            <small style={{ ...aide, fontWeight: 400 }}>Affiché une fois que la personne a soumis son coloriage pour cette étape.</small>
          </label>
        )}
        {!epopee && nombre(`xp${i}`, form.genre === 'expedition' && form.etapes.length === 1 ? 'XP de l’expédition réussie' : 'XP de l’étape', e.xp, (v) => majEtape(i, { xp: v }))}
        {form.genre === 'prophetie' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <label style={champ}>Révélée le<input type="date" value={e.debut || ''} onChange={(x) => majEtape(i, { debut: x.target.value })} style={dateStyle} /></label>
            <label style={champ}>Date limite<input type="date" value={e.fin || ''} min={e.debut} onChange={(x) => majEtape(i, { fin: x.target.value })} style={dateStyle} /></label>
          </div>
        )}
        <b style={{ fontSize: '0.9rem' }}>{epopee && i === 1 ? 'Points faibles du dragon' : 'Contraintes'}</b>
        {e.contraintes.map((c, k) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '3px solid var(--bordure-carte)' }}>
            <label style={champ}>{epopee && i === 1 ? `Point faible ${k + 1}` : `Contrainte ${k + 1}`}
              <input value={c.texte} onChange={(x) => majContrainte(i, k, { texte: x.target.value })} maxLength={300} placeholder="ex. Utiliser au moins 3 tons de rose" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '6px', alignItems: 'end' }}>
              {GENRES_CONTRAINTE[genreContraintes(i)].length > 1 && (
                <label style={champ}>Type
                  <Deroulant titre="Type de contrainte" value={c.genre} onChange={(v) => majContrainte(i, k, { genre: v, ...(DEGATS[v] ? { degats: Math.round((DEGATS[v].min + DEGATS[v].max) / 2) } : {}) })}
                    options={GENRES_CONTRAINTE[genreContraintes(i)].map(([v, l]) => ({ valeur: v, label: l }))} />
                </label>
              )}
              {epopee && i === 1 && nombre(`d${i}${k}`, 'Dégâts', c.degats, (v) => majContrainte(i, k, { degats: v }))}
              {form.genre === 'expedition' && c.genre === 'secondaire' && nombre(`c${i}${k}`, 'XP en plus', c.xp, (v) => majContrainte(i, k, { xp: v }))}
              <button type="button" className="btn alt danger" style={{ ...petitBtn, justifyContent: 'center' }} onClick={() => majEtape(i, { contraintes: e.contraintes.filter((_, j) => j !== k) })}>
                <Trash2 size={16} aria-hidden="true" /> Retirer
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn alt" style={petitBtn}
          onClick={() => majEtape(i, { contraintes: [...e.contraintes, contrainte(epopee && i === 1 ? 'facile' : form.genre === 'expedition' ? 'secondaire' : 'obligatoire')] })}>
          <Plus size={14} aria-hidden="true" /> {epopee && i === 1 ? 'Ajouter un point faible' : 'Ajouter une contrainte'}
        </button>
      </div>
    );
    const champImage = (titre, explication) => (
      <div style={champ}>
        {titre}
        <small style={{ ...aide, fontWeight: 400 }}>{explication}</small>
        {illustration.url && !illustration.retirer && (
          <img src={illustration.url} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: 'var(--rayon-m)', background: 'var(--fond-carte)' }} />
        )}
        <div style={actions}>
          <label className="btn alt" style={{ ...petitBtn, cursor: 'pointer' }}>
            <ImagePlus size={16} aria-hidden="true" /> {illustration.url && !illustration.retirer ? 'Changer l’image' : 'Choisir une image'}
            <input type="file" accept="image/*" onChange={choisirIllustration} style={{ display: 'none' }} />
          </label>
          {illustration.url && !illustration.retirer && (
            <button type="button" className="btn alt danger" style={petitBtn} onClick={() => setIllustration({ url: '', fichier: null, retirer: true })}>
              <Trash2 size={16} aria-hidden="true" /> Retirer
            </button>
          )}
        </div>
      </div>
    );
    const imageRecompenseChamp = (
      <div style={champ}>
        {epopee ? 'Blason à gagner' : 'Orbe à gagner'}
        <small style={{ ...aide, fontWeight: 400 }}>
          Images du dossier public/recompenses-activites/{epopee ? 'epopee' : 'prophetie'}. Par défaut prend la première.
        </small>
        <ChoixImageRecompense dossier={epopee ? 'epopee' : 'prophetie'} genre={epopee ? 'blason' : 'orbe'}
          valeur={form.image || ''} onChange={(v) => maj({ image: v })} />
      </div>
    );
    const messageFin = (label, explication) => (
      <label style={champ}>{label}
        <textarea rows={3} value={form.message_fin || ''} onChange={(e) => maj({ message_fin: e.target.value })} maxLength={2000} />
        <small style={{ ...aide, fontWeight: 400 }}>{explication}</small>
      </label>
    );
    const generalites = (
      <>
        {form.genre === 'expedition' && (
          <label style={champ}>Fête
            <Deroulant titre="Fête" value={form.fete} onChange={(v) => choisirFete(v)}
              options={FETES.map((f) => ({ valeur: f.valeur, label: f.nom, aide: f.occasion }))} />
          </label>
        )}
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => maj({ titre: e.target.value })} maxLength={100} placeholder={epopee ? 'ex. Le royaume de Valombre' : 'ex. Le peuple des cœurs'} required />
        </label>
        <label style={champ}>Histoire
          <textarea rows={4} value={form.description} onChange={(e) => maj({ description: e.target.value })} maxLength={2000} />
        </label>
        <label style={champ}>Instructions globales
          <textarea rows={3} value={form.instructions || ''} onChange={(e) => maj({ instructions: e.target.value })} maxLength={2000} />
        </label>
        <label style={champ}>Type de coloriage
          <Deroulant titre="Type de coloriage" value={form.categorie} onChange={(v) => maj({ categorie: v })}
            options={CATEGORIES_DEFI.map((c) => ({ valeur: c.valeur, label: c.label }))} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début<input type="date" value={form.debut} onChange={(e) => maj({ debut: e.target.value })} style={dateStyle} /></label>
          <label style={champ}>Fin<input type="date" value={form.fin} min={form.debut} onChange={(e) => maj({ fin: e.target.value })} style={dateStyle} /></label>
        </div>
      </>
    );
    const boutons = (
      <>
        <div style={actions}>
          <button type="submit" className="btn" style={{ flex: 1, minHeight: '48px' }} disabled={!form.titre.trim()}>Enregistrer</button>
          <button type="button" className="btn alt" onClick={() => setForm(null)}>Annuler</button>
        </div>
        {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
      </>
    );

    if (epopee) {
      return (
        <form onSubmit={enregistrer} className="carte" style={{ ...colonne, gap: '14px' }}>
          <b>{form.id ? `Modifier : ${form.titre}` : 'Nouvelle épopée'}</b>
          {section('1. L’épopée', generalites)}
          {section('2. Phase 1 : ouvrir la route vers le dragon', (
            <>
              <label style={champ}>Énigme
                <textarea rows={3} value={form.enigme} onChange={(e) => maj({ enigme: e.target.value })} maxLength={1000} />
              </label>
              <label style={champ}>Réponse de l’énigme
                <input value={form.reponse} onChange={(e) => maj({ reponse: e.target.value })} maxLength={200} placeholder="ex. le miroir" />
                <small style={{ ...aide, fontWeight: 400 }}>Majuscules et accents ne comptent pas. Plusieurs réponses acceptées : sépare-les par une barre verticale |.</small>
              </label>
              <div style={grille}>
                {nombre('mc', 'Contributions pour ouvrir la route', form.min_contributions, (v) => maj({ min_contributions: v }))}
                {nombre('x1', 'XP par contribution', form.xp.phase1, (v) => maj({ xp: { ...form.xp, phase1: v } }))}
              </div>
              {form.etapes[0] && blocEtape(form.etapes[0], 0)}
            </>
          ))}
          {section('3. Phase 2 : affronter le dragon', (
            <>
              <div style={grille}>
                {nombre('pv', 'Résistance du dragon', form.pv, (v) => maj({ pv: v }))}
                {nombre('ma', 'Attaques minimum', form.min_attaques, (v) => maj({ min_attaques: v }))}
                {nombre('x2', 'XP 1re attaque', form.xp.attaque, (v) => maj({ xp: { ...form.xp, attaque: v } }))}
                {nombre('x3', 'XP dragon vaincu', form.xp.victoire, (v) => maj({ xp: { ...form.xp, victoire: v } }))}
                {nombre('x4', 'XP maximum par personne', form.xp.max, (v) => maj({ xp: { ...form.xp, max: v } }))}
              </div>
              {champImage('Image du dragon (facultatif)', 'Elle s’affiche dans la phase 2, quand la route est ouverte.')}
              {form.etapes[1] && blocEtape(form.etapes[1], 1)}
            </>
          ))}
          {section('4. Fin de l’épopée : bravo !', (
            <>
              <label style={champ}>Nom de la récompense (facultatif)
                <input value={form.recompense} onChange={(e) => maj({ recompense: e.target.value })} maxLength={80} placeholder="ex. Blason de Valombre" />
                <small style={{ ...aide, fontWeight: 400 }}>Laisse vide pour Blason suivi du titre de l’épopée.</small>
              </label>
              {imageRecompenseChamp}
              {messageFin('Message de bravo (facultatif)', 'Affiché avec le blason gagné quand le dragon est vaincu.')}
            </>
          ))}
          {boutons}
        </form>
      );
    }

    return (
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? `Modifier : ${form.titre}` : `Nouvelle ${nom.singulier.toLowerCase()}`}</b>
        {generalites}
        {form.genre === 'prophetie' && nombre('xc', 'XP quand toutes les étapes sont accomplies', form.xp.complet, (v) => maj({ xp: { ...form.xp, complet: v } }))}
        {form.genre === 'expedition' && (
          <label style={champ}>Nombre de coloriages à soumettre
            <Deroulant titre="Nombre de coloriages" value={String(form.etapes.length)}
              onChange={(v) => nombreEtapesExpedition(Number(v))}
              options={[...new Set([...choixNbColoriages(form.debut, form.fin), form.etapes.length])].sort((x, y) => x - y)
                .map((n) => ({ valeur: String(n), label: `${n} coloriage${n > 1 ? 's' : ''}` }))} />
            <small style={{ ...aide, fontWeight: 400 }}>
              1 seul si l’expédition dure moins de 2 semaines, sinon jusqu’à un par semaine complète. Chaque coloriage est une étape, avec ses instructions et ses contraintes.
            </small>
            {form.etapes.length > choixNbColoriages(form.debut, form.fin).at(-1) && (
              <small style={{ color: 'var(--danger)' }}>Trop de coloriages pour ces dates : allonge l’expédition ou réduis le nombre de coloriages.</small>
            )}
          </label>
        )}
        {champImage('Fond à afficher (facultatif)', 'L’histoire et les instructions globales s’affichent par-dessus cette image.')}

        {form.etapes.map(blocEtape)}
        {form.genre === 'prophetie' && (
          <button type="button" className="btn alt" style={petitBtn} onClick={() => {
            const der = form.etapes.at(-1);
            setForm({ ...form, etapes: [...form.etapes, { nom: `Étape ${form.etapes.length + 1}`, instructions: '', message: '', xp: XP_PROPHETIE.etape, debut: der?.fin ? plus(der.fin, 1) : form.debut, fin: der?.fin ? plus(der.fin, 7) : form.fin, contraintes: [contrainte('obligatoire')] }] });
          }}>
            <Plus size={14} aria-hidden="true" /> Ajouter une étape
          </button>
        )}

        {form.genre === 'prophetie'
          ? messageFin('Message de fin (facultatif)', 'Affiché avec l’Orbe magique gagnée quand toutes les étapes sont accomplies.')
          : messageFin('Texte de félicitations (facultatif)', 'Affiché avec la Boussole gagnée quand tous les coloriages de l’expédition sont soumis.')}
        {form.genre === 'prophetie' && imageRecompenseChamp}
        {boutons}
      </form>
    );
  }

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="d’aventure" brouillon={brouillon} onReprendre={(d) => d && d.genre && ouvrir(d)} />
      <div className="carte" style={colonne}>
        <b>Créer une aventure</b>
        <p style={aide}>Expédition : une par fête. Épopée : une par saison (janvier, mars, juillet, septembre), deux semaines. Prophétie : une par année, en mai ou en novembre.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {Object.entries(NOMS_AVENTURES).map(([g, n]) => {
            const Icone = ICONES[g];
            return (
              <button key={g} type="button" className="btn" onClick={() => { setMessage(''); ouvrir(modele(g)); }}
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
              <button type="button" className="btn alt" style={petitBtn} onClick={() => ouvrir({ ...a, xp: a.xp || {} })}><Pencil size={14} aria-hidden="true" /> Modifier</button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(a)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
              <Link href={`/aventures/${a.id}?test=1`} className="btn alt" style={petitBtn}><Eye size={14} aria-hidden="true" /> Voir</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
