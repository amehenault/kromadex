'use client';
import { useEffect, useMemo, useState } from 'react';
import { Trash2, Pencil, Flag, Check, X } from 'lucide-react';
import { nomPoste, couleurPoste } from '@/lib/postes';
import { envoyer, colonne, ligneCarte, champ, aide, actions, petitBtn } from './outils';
import Pseudo from '@/components/Pseudo';
import Deroulant from '@/components/Deroulant';

const RAISONS = { repetition: 'Répétition', faux: 'Faux', inapproprie: 'Inapproprié' };
const SANCTIONS = [[0, 'Avertir'], [7, 'Suspendre 7 jours'], [30, 'Suspendre 30 jours'], [36500, 'Bannir']];

export default function MotsCles() {
  const [mots, setMots] = useState([]);
  const [filtre, setFiltre] = useState('signales');
  const [tome, setTome] = useState('');
  const [page, setPage] = useState('');
  const [edition, setEdition] = useState(null);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/mots-cles?gestion=1');
    if (r.ok) setMots((await r.json()).mots || []);
  }
  useEffect(() => { charger(); }, []);

  const visibles = mots.filter((m) => (filtre === 'tous' || m.signalements > 0)
    && (!tome || m.tome === tome)
    && (!page || (page === '-' ? !m.page_no : String(m.page_no) === page)));
  const tomes = useMemo(() => [...new Set(mots.map((m) => m.tome))].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })), [mots]);
  const pages = useMemo(() => [...new Set(mots.filter((m) => m.tome === tome).map((m) => String(m.page_no || '')))]
    .sort((a, b) => (Number(a) || 0) - (Number(b) || 0)), [mots, tome]);
  const classes = useMemo(() => {
    const parTome = new Map();
    for (const m of [...visibles].sort((a, b) => a.tome.localeCompare(b.tome, 'fr', { numeric: true })
      || (Number(a.page_no) || 0) - (Number(b.page_no) || 0) || a.mot.localeCompare(b.mot, 'fr'))) {
      if (!parTome.has(m.tome)) parTome.set(m.tome, new Map());
      const parPage = parTome.get(m.tome);
      const cle = m.page_no ? `Page ${m.page_no}` : 'Tout le livre';
      if (!parPage.has(cle)) parPage.set(cle, []);
      parPage.get(cle).push(m);
    }
    return parTome;
  }, [visibles]);

  async function enregistrer() {
    const r = await envoyer('/api/mots-cles', 'PUT', edition);
    setMessage(r.ok ? 'Mot-clef modifié' : r.error);
    if (r.ok) { setEdition(null); charger(); window.dispatchEvent(new Event('kromadex-lu')); }
  }
  async function garder(m) {
    const r = await envoyer('/api/mots-cles', 'PUT', { id: m.id, garder: true });
    setMessage(r.ok ? `« ${m.mot} » est gardé, signalements effacés` : r.error);
    if (r.ok) { charger(); window.dispatchEvent(new Event('kromadex-lu')); }
  }
  async function supprimer(m) {
    if (!confirm(`Supprimer le mot-clef « ${m.mot} » ?`)) return;
    await envoyer('/api/mots-cles', 'DELETE', { id: m.id });
    charger();
    window.dispatchEvent(new Event('kromadex-lu'));
  }
  async function sanctionner(m, jours) {
    const libelle = SANCTIONS.find(([j]) => j === jours)[1].toLowerCase();
    if (!confirm(`Confirmer : ${libelle} ${m.pseudo ? `@${m.pseudo}` : 'ce membre'} pour le mot-clef « ${m.mot} » ?`)) return;
    const r = await envoyer('/api/moderation', 'POST', { userId: m.auteur_id, motif: `Mot-clef inapproprié : « ${m.mot} » (${m.tome})`, jours });
    setMessage(r.ok ? 'Sanction envoyée' : r.error);
  }

  return (
    <div className="carte" style={colonne}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button type="button" className={filtre === 'signales' ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setFiltre('signales')}>
          <Flag size={16} aria-hidden="true" /> Signalés ({mots.filter((m) => m.signalements > 0).length})
        </button>
        <button type="button" className={filtre === 'tous' ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setFiltre('tous')}>
          Tous ({mots.length})
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
        <label style={champ}>Tome
          <Deroulant titre="Tome" value={tome} onChange={(v) => { setTome(v); setPage(''); }}
            options={[{ valeur: '', label: 'Tous les tomes' }, ...tomes.map((t) => ({ valeur: t, label: t }))]} />
        </label>
        <label style={champ}>Page
          <Deroulant titre="Page" value={page} onChange={(v) => setPage(v)} disabled={!tome}
            options={[{ valeur: '', label: 'Toutes les pages' }, ...pages.map((p) => ({ valeur: p || '-', label: p ? `Page ${p}` : 'Tout le livre' }))]} />
        </label>
      </div>
      {message && <small>{message}</small>}

      {[...classes].map(([nomTome, parPage]) => (
        <section key={nomTome} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h4 style={{ margin: '8px 0 0', fontSize: '1rem', overflowWrap: 'anywhere' }}>{nomTome}</h4>
          {[...parPage].map(([nomPage, liste]) => (
            <div key={nomPage} style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '3px solid var(--bordure-carte)' }}>
              <small style={{ fontWeight: 700, color: 'var(--texte-secondaire)' }}>{nomPage} · {liste.length} mot{liste.length > 1 ? 's' : ''}-clef{liste.length > 1 ? 's' : ''}</small>
      {liste.map((m) => (
        <div key={m.id} style={{ ...ligneCarte, border: m.signalements ? '2px solid var(--danger)' : ligneCarte.border }}>
          {edition?.id === m.id ? (
            <label style={champ}>Mot-clef
              <input value={edition.mot} onChange={(e) => setEdition({ ...edition, mot: e.target.value })} maxLength={40} />
            </label>
          ) : (
            <b style={{ overflowWrap: 'anywhere' }}>{m.mot}</b>
          )}
          <small style={{ overflowWrap: 'anywhere' }}>
            Créé par <Pseudo x={m} role={m.role_auteur} repli="compte supprimé" />
            {m.role_auteur && <span style={{ color: couleurPoste(m.role_auteur), fontWeight: 700 }}> · {nomPoste(m.role_auteur, m.genre_auteur)}</span>}
          </small>
          {m.signalements > 0 && (
            <small style={{ color: 'var(--danger)', fontWeight: 700 }}>
              {m.signalements} signalement{m.signalements > 1 ? 's' : ''} : {Object.entries(m.raisons || {}).map(([r, n]) => `${RAISONS[r]} (${n})`).join(', ')}
            </small>
          )}
          <div style={actions}>
            {edition?.id === m.id ? (
              <>
                <button type="button" className="btn" style={petitBtn} onClick={enregistrer}><Check size={14} aria-hidden="true" /> Enregistrer</button>
                <button type="button" className="btn alt" style={petitBtn} onClick={() => setEdition(null)}><X size={14} aria-hidden="true" /> Annuler</button>
              </>
            ) : (
              <button type="button" className="btn alt" style={petitBtn} onClick={() => setEdition({ id: m.id, mot: m.mot })}><Pencil size={14} aria-hidden="true" /> Modifier</button>
            )}
            {m.signalements > 0 && <button type="button" className="btn alt" style={petitBtn} onClick={() => garder(m)}><Check size={14} aria-hidden="true" /> Il est correct</button>}
            <button type="button" className="btn alt danger" style={petitBtn} onClick={() => supprimer(m)}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
          </div>
          {m.auteur_id && !['admin', 'modo'].includes(m.role_auteur) && (
            <label style={champ}>Sanctionner la personne
              <Deroulant titre="Sanctionner la personne" placeholder="Choisir une sanction" value="" onChange={(v) => sanctionner(m, Number(v))}
                options={SANCTIONS.map(([j, l]) => ({ valeur: j, label: l }))} />
            </label>
          )}
        </div>
      ))}
            </div>
          ))}
        </section>
      ))}
      {!visibles.length && <p style={aide}>{filtre === 'signales' ? 'Aucun mot-clef signalé.' : 'Aucun mot-clef pour le moment.'}</p>}
    </div>
  );
}
