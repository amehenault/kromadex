'use client';
import { useEffect, useState } from 'react';
import { Trash2, CalendarClock, ImagePlus, Palette, Type, X } from 'lucide-react';
import { NB_CASES, CATEGORIES_BINGO, nomCategorieBingo, apparenceCase, imageCaseBingo } from '@/lib/bingos';
import { compresserImage } from '@/lib/compressionImage';
import ChoixCouleur from '@/components/ChoixCouleur';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn, dateStyle } from './outils';
import { useBrouillon, BandeauBrouillon } from '@/components/Brouillon';

const vide = () => ({
  id: null, titre: '', categorie: 'les_deux', debut: '', fin: '',
  cases: Array(NB_CASES).fill(''), conditions: Array(NB_CASES).fill(''),
  styles: Array.from({ length: NB_CASES }, () => ({ fond: '', texte: '' })),
});
// Image de fond de chaque case : url affichée, fichier à envoyer, ou image du serveur à retirer
const imagesVides = () => Array.from({ length: NB_CASES }, () => ({ url: '', fichier: null, serveur: false, retirer: false }));
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

// Créer et programmer les bingos : grille de 3 x 3, une tâche courte et sa condition par case
export default function Bingos({ role }) {
  const menestrel = role === 'menestrel';
  const [bingos, setBingos] = useState([]);
  const [form, setForm] = useState(vide);
  const [caseActive, setCaseActive] = useState(0);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState(imagesVides);
  const [couleur, setCouleur] = useState(null); // 'fond' ou 'texte' : choix de couleur ouvert pour la case active
  // Brouillon automatique dès qu'on commence à remplir le bingo
  const brouillon = useBrouillon('bingo', form, Boolean(form.titre.trim() || form.cases.some((c) => c.trim()) || form.conditions.some((c) => c.trim())));

  async function charger() {
    const res = await fetch('/api/bingos?gestion=1');
    if (res.ok) setBingos((await res.json()).bingos || []);
  }
  useEffect(() => { charger(); }, []);

  const remplies = form.cases.filter((c) => c.trim()).length;
  const changer = (cle, i, v) => setForm({ ...form, [cle]: form[cle].map((x, j) => (j === i ? v : x)) });
  const styleCase = (i) => form.styles?.[i] || { fond: '', texte: '' };
  const changerStyle = (i, cle, v) => setForm({ ...form, styles: Array.from({ length: NB_CASES }, (_, j) => (j === i ? { ...styleCase(j), [cle]: v } : styleCase(j))) });
  const changerImage = (i, v) => setImages((l) => l.map((x, j) => (j === i ? { ...x, ...v } : x)));
  async function choisirImage(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const blob = await compresserImage(f, 900, 0.85);
    changerImage(caseActive, { url: URL.createObjectURL(blob), fichier: blob, retirer: false });
  }

  async function enregistrer(e) {
    e.preventDefault();
    const r = await envoyer('/api/bingos', 'POST', form);
    if (!r.ok) { setMessage(r.error); return; }
    // Puis les images de fond des cases : nouvelles images envoyées, images retirées supprimées
    let erreurImage = '';
    for (let i = 0; i < NB_CASES; i++) {
      const im = images[i];
      if (im.fichier) {
        const fd = new FormData();
        fd.append('bingoId', String(r.id)); fd.append('case', String(i)); fd.append('image', im.fichier, 'image.jpg');
        const rep = await fetch('/api/bingos/image', { method: 'POST', body: fd });
        if (!rep.ok) erreurImage = (await rep.json().catch(() => ({}))).error || 'Une image n’a pas pu être enregistrée.';
      } else if (im.retirer && im.serveur) {
        await envoyer('/api/bingos/image', 'DELETE', { bingoId: r.id, case: i });
      }
    }
    setMessage(erreurImage ? `Bingo enregistré, mais : ${erreurImage}` : 'Bingo enregistré');
    setForm(vide()); setImages(imagesVides()); setCaseActive(0); brouillon.effacer(); charger();
  }

  async function supprimer(b) {
    if (!confirm(`Supprimer le bingo « ${b.titre} » ?`)) return;
    await envoyer('/api/bingos', 'DELETE', { id: b.id });
    charger();
  }

  return (
    <div style={colonne}>
      <BandeauBrouillon nom="de bingo" brouillon={brouillon} onReprendre={(d) => d && setForm({ ...vide(), ...d })} />
      <form onSubmit={enregistrer} className="carte" style={colonne}>
        <b>{form.id ? 'Modifier le bingo' : 'Nouveau bingo'}</b>
        <label style={champ}>Titre
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Bingo d'automne" maxLength={100} />
        </label>
        <label style={champ}>Pour qui
          <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES_BINGO.map((c) => <option key={c.valeur} value={c.valeur}>{c.label}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={champ}>Début
            <input type="date" value={form.debut || ''} onChange={(e) => setForm({ ...form, debut: e.target.value })} style={dateStyle} />
          </label>
          <label style={champ}>Fin (facultatif)
            <input type="date" value={form.fin || ''} min={form.debut || undefined} onChange={(e) => setForm({ ...form, fin: e.target.value })} style={dateStyle} />
          </label>
        </div>
        <p style={aide}>
          {menestrel ? 'Un bingo par mois.' : 'Deux bingos par mois au maximum.'} Avec une date de début à venir, le bingo est programmé : il apparaît aux membres ce jour-là. Sans date de fin, il se termine la veille du dernier jour du mois : les cases validées rapportent leurs XP le dernier jour.
        </p>

        <small style={aide}>Touche une case pour écrire sa tâche et sa condition ({remplies} / {NB_CASES}).</small>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {form.cases.map((c, i) => {
            // Aperçu de la case telle que les membres la verront (fond, image, texte sur son rectangle)
            const a = apparenceCase({ ...styleCase(i), image: images[i].retirer ? '' : images[i].url });
            return (
              <button key={i} type="button" onClick={() => setCaseActive(i)} aria-label={`Case ${i + 1}${c ? ` : ${c}` : ''}`}
                style={{
                  aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', fontSize: '0.8rem', lineHeight: 1.2, padding: '4px',
                  overflow: 'hidden', cursor: 'pointer', wordBreak: 'break-word', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: caseActive === i ? '3px solid var(--btn)' : '1px solid var(--bordure-carte)',
                  background: a.background || (c.trim() ? 'var(--accent-doux)' : 'var(--fond-carte)'), color: a.couleurTexte,
                }}>
                <span style={a.rectangle ? { background: a.rectangle, padding: '3px 5px', borderRadius: 'var(--rayon-s)' } : undefined}>{c || i + 1}</span>
              </button>
            );
          })}
        </div>
        <label style={champ}>Case {caseActive + 1} : tâche (affichée dans la case)
          <input value={form.cases[caseActive]} maxLength={60} onChange={(e) => changer('cases', caseActive, e.target.value)} placeholder="ex. Tons pastel" />
        </label>
        <label style={champ}>Condition (affichée quand on touche la case)
          <textarea rows={3} value={form.conditions[caseActive]} maxLength={300} onChange={(e) => changer('conditions', caseActive, e.target.value)}
            placeholder="ex. Colorie une page entière avec au moins 5 couleurs pastel" />
        </label>

        {/* Apparence de la case active : fond, texte, image de fond (le texte passe alors sur un rectangle) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <small style={{ ...aide, fontWeight: 700 }}>Case {caseActive + 1} : apparence</small>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            <button type="button" className="btn alt" onClick={() => setCouleur('fond')} style={{ ...petitBtn, flexDirection: 'column', minHeight: '64px', minWidth: 0 }}>
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: styleCase(caseActive).fond || 'transparent', border: '1px solid var(--bordure)', display: 'grid', placeItems: 'center' }}>
                {!styleCase(caseActive).fond && <Palette size={13} />}
              </span>
              Fond
            </button>
            <button type="button" className="btn alt" onClick={() => setCouleur('texte')} style={{ ...petitBtn, flexDirection: 'column', minHeight: '64px', minWidth: 0 }}>
              <Type size={20} aria-hidden="true" style={{ color: styleCase(caseActive).texte || 'currentColor' }} />
              Texte
            </button>
            <label className="btn alt" style={{ ...petitBtn, flexDirection: 'column', minHeight: '64px', minWidth: 0, cursor: 'pointer' }}>
              <ImagePlus size={20} aria-hidden="true" /> Image
              <input type="file" accept="image/*" hidden onChange={choisirImage} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {styleCase(caseActive).fond && <button type="button" className="btn alt" style={petitBtn} onClick={() => changerStyle(caseActive, 'fond', '')}><X size={14} aria-hidden="true" /> Retirer le fond</button>}
            {styleCase(caseActive).texte && <button type="button" className="btn alt" style={petitBtn} onClick={() => changerStyle(caseActive, 'texte', '')}><X size={14} aria-hidden="true" /> Texte par défaut</button>}
            {images[caseActive].url && !images[caseActive].retirer && (
              <button type="button" className="btn alt" style={petitBtn} onClick={() => changerImage(caseActive, { url: '', fichier: null, retirer: true })}><X size={14} aria-hidden="true" /> Retirer l’image</button>
            )}
          </div>
          <small style={aide}>Avec une couleur ou une image de fond, le texte de la case s’affiche toujours sur un rectangle pour rester lisible.</small>
        </div>
        {couleur && (
          <ChoixCouleur valeur={styleCase(caseActive)[couleur] || (couleur === 'texte' ? '#273136' : '#FFA17A')}
            onFermer={() => setCouleur(null)}
            onChoisir={(hex) => { changerStyle(caseActive, couleur, hex); setCouleur(null); }} />
        )}

        <div style={actions}>
          <button type="submit" className="btn" disabled={!form.titre.trim() || remplies < NB_CASES || !form.debut} style={{ flex: 1, minHeight: '44px' }}>
            Enregistrer le bingo
          </button>
          {form.id && <button type="button" className="btn alt" onClick={() => { setForm(vide()); setImages(imagesVides()); setCaseActive(0); }}>Annuler</button>}
        </div>
        {message && <small>{message}</small>}
      </form>

      <div className="carte" style={colonne}>
        <b>{menestrel ? 'Mes bingos' : 'Bingos créés'}</b>
        {bingos.map((b) => (
          <div key={b.id} style={ligneCarte}>
            <b>{b.titre}</b>
            <small style={aide}>{nomCategorieBingo(b.categorie)}</small>
            <small style={{ ...aide, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {b.programme && <CalendarClock size={14} aria-hidden="true" />}
              {b.programme ? 'Programmé : ' : ''}{b.debut ? jour(b.debut) : '?'}{b.fin ? ` au ${jour(b.fin)}` : ' jusqu’à la veille du dernier jour du mois'}
            </small>
            <div style={actions}>
              <button type="button" className="btn alt" style={petitBtn}
                onClick={() => {
                  setForm({
                    id: b.id, titre: b.titre, categorie: b.categorie, debut: b.debut || '', fin: b.fin || '',
                    cases: Array.from({ length: NB_CASES }, (_, i) => b.cases[i] || ''),
                    conditions: Array.from({ length: NB_CASES }, (_, i) => (b.conditions || [])[i] || ''),
                    styles: Array.from({ length: NB_CASES }, (_, i) => ({ fond: b.styles?.[i]?.fond || '', texte: b.styles?.[i]?.texte || '' })),
                  });
                  setImages(Array.from({ length: NB_CASES }, (_, i) => {
                    const im = (b.images || []).find((x) => x.case === i);
                    return im ? { url: imageCaseBingo(b.id, i, im.v), fichier: null, serveur: true, retirer: false } : { url: '', fichier: null, serveur: false, retirer: false };
                  }));
                  setCaseActive(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                Modifier
              </button>
              <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(b)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
            </div>
          </div>
        ))}
        {!bingos.length && <p style={aide}>Aucun bingo pour le moment.</p>}
      </div>
    </div>
  );
}
