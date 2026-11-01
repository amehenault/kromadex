'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Compass, Shield, Sparkles, Lock, Check, Gift, KeyRound, Swords, Image as ImageIcon, Trophy, Eye, RotateCcw, Footprints, BookOpen, ChevronUp, ChevronDown, ScrollText } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import { FETES, NOMS_AVENTURES, DEGATS, XP_EPOPEE, XP_PROPHETIE } from '@/lib/activites';
import TexteErreur from '@/components/TexteErreur';
import NombreParticipants from '@/components/NombreParticipants';
import { imageRecompense } from '@/lib/recompenses';

const ICONES = { expedition: Compass, epopee: Shield, prophetie: Sparkles };
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const image = (s) => `/api/pages/${s.page_id}/image?s=${s.img_size || 0}`;
const xpDe = (a, cle, defaut) => (Number.isFinite(Number(a.xp?.[cle])) ? Number(a.xp[cle]) : defaut);
const ETIQUETTE = { obligatoire: 'Obligatoire', secondaire: 'Secondaire' };

function Soumission({ a, etape, attaque, onFini, onFermer }) {
  const [page, setPage] = useState(null);
  const [cochees, setCochees] = useState([]);
  const [parchemin, setParchemin] = useState(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  const basculer = (id) => setCochees((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const obligatoires = etape.contraintes.filter((c) => c.genre === 'obligatoire');
  const secondaires = etape.contraintes.filter((c) => c.genre === 'secondaire');
  const manque = obligatoires.some((c) => !cochees.includes(c.id) && c.id !== parchemin);
  const sansSecondaire = a.genre === 'expedition' && secondaires.length > 0 && !secondaires.some((c) => cochees.includes(c.id));
  const degats = etape.contraintes.filter((c) => cochees.includes(c.id)).reduce((s, c) => s + (c.degats || 0), 0);
  const pret = attaque ? degats > 0 : !manque && !sansSecondaire;

  async function envoyer() {
    setOccupe(true); setErreur('');
    const r = await fetch('/api/aventures', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: a.test ? 'test_soumettre' : 'soumettre', id: a.id, etapeId: etape.id, pageId: page.id, contraintes: cochees, parchemin }) });
    const d = await r.json().catch(() => ({}));
    setOccupe(false);
    if (!r.ok) { setErreur(d.error || 'Erreur'); return; }
    onFini(d);
  }

  if (!page) {
    return (
      <ChoixColoriage titre={etape.nom} tomes={!a.test} type={a.test ? undefined : a.categorie} avertissement={!a.test} onChoisir={setPage} onFermer={onFermer}
        aide={a.test ? 'Mode test : choisis n’importe quel coloriage, même plusieurs fois.' : 'Le coloriage doit venir de ta section Tomes / Livres. Un même coloriage ne sert qu’une fois par aventure.'} />
    );
  }
  return (
    <Feuille titre={attaque ? 'Points faibles touchés' : 'Contraintes respectées'} onFermer={onFermer}>
      <img src={`/api/pages/${page.id}/image?s=${page.img_size || 0}`} alt="" style={{ width: '100%', maxHeight: '35dvh', objectFit: 'contain', borderRadius: 'var(--rayon-m)', background: 'var(--carte)' }} />
      <small style={{ color: 'var(--texte-secondaire)' }}>
        {attaque ? 'Coche chaque point faible que ton coloriage respecte : les dégâts s’additionnent.'
          : a.genre === 'expedition' ? 'Coche les contraintes que ton coloriage respecte : l’obligatoire et au moins une secondaire.'
            : 'Coche les contraintes que ton coloriage respecte : elles doivent toutes l’être.'}
      </small>
      {etape.contraintes.map((c) => {
        const elimine = parchemin === c.id;
        return (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '44px', opacity: elimine ? 0.5 : 1 }}>
              <input type="checkbox" checked={cochees.includes(c.id)} disabled={elimine} onChange={() => basculer(c.id)} style={{ width: 22, height: 22, flex: '0 0 auto', marginTop: 2 }} />
              <span style={{ overflowWrap: 'anywhere', textDecoration: elimine ? 'line-through' : 'none' }}>
                {c.texte}
                <small style={{ display: 'block', color: 'var(--texte-secondaire)', fontWeight: 700 }}>
                  {DEGATS[c.genre] ? `${DEGATS[c.genre].label} · ${c.degats} points de dégâts` : ETIQUETTE[c.genre]}{c.genre === 'secondaire' && c.xp ? ` · +${c.xp} XP` : ''}
                </small>
              </span>
            </label>
            {c.genre === 'obligatoire' && a.parchemins > 0 && (!parchemin || elimine) && (
              <button type="button" className="btn alt" onClick={() => { setParchemin(elimine ? null : c.id); setCochees((l) => l.filter((x) => x !== c.id)); }}
                style={{ minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                <img src="/inventaire/kromadex-parchemin.svg" alt="" aria-hidden="true" style={{ width: 20, height: 20 }} /> {elimine ? 'Garder cette contrainte' : 'Éliminer avec un Parchemin du Destin'}
              </button>
            )}
          </div>
        );
      })}
      {attaque && <b>Dégâts : {degats} points</b>}
      <button type="button" className="btn" disabled={!pret || occupe} onClick={envoyer} style={{ minHeight: '48px', fontWeight: 700 }}>
        {attaque ? 'Attaquer le dragon' : 'Soumettre mon coloriage'}
      </button>
      <button type="button" className="btn alt" onClick={() => setPage(null)} style={{ minHeight: '44px' }}>Choisir un autre coloriage</button>
      {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
    </Feuille>
  );
}

// Couleur de chaque sorte de contrainte, avec la couleur du texte posé dessus.
const COULEURS_CONTRAINTE = {
  obligatoire: ['var(--couleur-principale)', '#1d1d1d'],
  secondaire: ['var(--btn)', '#ffffff'],
  facile: ['var(--btn)', '#ffffff'],
  intermediaire: ['#f2b233', '#1d1d1d'],
  difficile: ['var(--danger)', '#ffffff'],
};

export function Puce({ children, fond = 'var(--accent-doux)', texte = 'var(--texte-principal)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', background: fond, color: texte, fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.3 }}>
      {children}
    </span>
  );
}

function Contraintes({ etape }) {
  if (!etape?.contraintes?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <b>Contraintes :</b>
      {etape.contraintes.map((c, i) => {
        const [couleur, sur] = COULEURS_CONTRAINTE[c.genre] || COULEURS_CONTRAINTE.obligatoire;
        return (
          <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: 'var(--rayon-m)', background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderLeft: `6px solid ${couleur}`, minWidth: 0 }}>
            <span aria-hidden="true" style={{ flex: '0 0 auto', width: 28, height: 28, borderRadius: '50%', background: couleur, color: sur, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 600, overflowWrap: 'anywhere' }}>{c.texte}</span>
              <span style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                <Puce fond={couleur} texte={sur}>{DEGATS[c.genre] ? DEGATS[c.genre].label : ETIQUETTE[c.genre]}</Puce>
                {DEGATS[c.genre] && <Puce><Swords size={12} aria-hidden="true" /> {c.degats} points de dégâts</Puce>}
                {c.genre === 'secondaire' && c.xp ? <Puce>+{c.xp} XP</Puce> : null}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// En-tête d'une étape : rond numéroté (ou crochet / cadenas), titre, dates et statut.
function EnTeteEtape({ numero, titre, dates, statut }) {
  const faite = statut === 'faite', verrou = statut === 'verrou';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <span aria-hidden="true" style={{
        flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem',
        background: faite ? 'var(--btn)' : verrou ? 'var(--carte)' : 'var(--couleur-principale)', color: faite ? '#ffffff' : verrou ? 'var(--texte-secondaire)' : '#1d1d1d',
      }}>
        {faite ? <Check size={20} /> : verrou ? <Lock size={18} /> : numero}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{titre}</b>
        {dates && <small style={{ color: 'var(--texte-secondaire)' }}>{dates}</small>}
      </span>
      <Puce fond={faite ? 'var(--btn)' : verrou ? 'var(--carte)' : 'var(--accent-doux)'} texte={faite ? '#ffffff' : 'var(--texte-principal)'}>
        {faite ? 'Accomplie' : verrou ? 'À venir' : 'À faire'}
      </Puce>
    </div>
  );
}

function Progression({ faites, total, libelle = 'Étapes accomplies' }) {
  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--espace-3)' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
        <span>{libelle}</span><span>{faites} / {total}</span>
      </span>
      <div className="profil-xp-barre" style={{ margin: 0 }}><div className="profil-xp-remplissage" style={{ width: `${total ? Math.round((faites / total) * 100) : 0}%` }} /></div>
    </div>
  );
}

export default function Aventure({ id, test: modeTest = false }) {
  const router = useRouter();
  const [donnees, setA] = useState(null);
  const [erreur, setErreur] = useState('');
  const [soumission, setSoumission] = useState(null);
  const [message, setMessage] = useState('');
  const [reponse, setReponse] = useState('');
  const [enigmeTest, setEnigmeTest] = useState(false);
  const [histoireOuverte, setHistoireOuverte] = useState(null);

  async function charger() {
    const r = await fetch(`/api/aventures?id=${id}${modeTest ? '&test=1' : ''}`);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setA(d.aventure); else setErreur(d.error || 'Aventure introuvable');
  }
  useEffect(() => { charger(); }, [id, modeTest]);

  const a = donnees && donnees.test ? { ...donnees, enigmeResolue: enigmeTest } : donnees;

  async function action(corps) {
    setMessage('');
    const enTest = a.test && corps.action === 'enigme';
    const r = await fetch('/api/aventures', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, ...corps, ...(enTest ? { action: 'test_enigme' } : {}) }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(d.error || 'Erreur'); return; }
    if (enTest) setEnigmeTest(true);
    charger();
  }
  function fini(d) {
    setSoumission(null);
    const texte = d.degats ? `Attaque réussie : ${d.degats} points de dégâts${d.xp ? ` · +${d.xp} XP` : ''}` : `Coloriage soumis${d.xp ? ` · +${d.xp} XP` : ''}`;
    setMessage(d.test ? `Test : ${texte.charAt(0).toLowerCase()}${texte.slice(1)} (aucun XP, rien d’enregistré pour vrai)` : texte);
    charger(); router.refresh();
  }
  async function recommencerTest() {
    await fetch('/api/aventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, action: 'test_recommencer' }) });
    setEnigmeTest(false); setMessage(''); charger();
  }

  if (erreur) return <p style={{ padding: 'var(--espace-3)' }}><TexteErreur texte={erreur} /></p>;
  if (!a) return <p style={{ padding: 'var(--espace-3)' }}>Chargement…</p>;

  const Icone = ICONES[a.genre];
  const imageAventure = a.illustration ? `/api/aventures/illustration?id=${a.id}&v=${a.illustration}` : null;
  const fondExpedition = a.genre !== 'epopee' ? imageAventure : null;
  const fete = FETES.find((f) => f.valeur === a.fete);
  const terminee = !a.test && a.fin < a.aujourdhui;
  const histoireVisible = histoireOuverte ?? !a.inscrit;
  const mes = (etapeId) => a.mesSoumissions.filter((s) => s.etape_id === etapeId);
  const bouton = { minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
  const carteEtape = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' };
  const fuir = () => (window.history.length > 1 ? router.back() : router.push('/aventures'));
  const choixParticiper = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <button type="button" className="btn" style={bouton} onClick={() => action({ action: 'inscrire' })}>
        {a.genre === 'epopee' ? <Swords size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />} Participer
      </button>
      <button type="button" className="btn alt" style={bouton} onClick={fuir}>
        <Footprints size={18} aria-hidden="true" /> Fuir
      </button>
    </div>
  );
  const vignettes = (liste) => liste.length > 0 && (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
      {liste.map((s) => (
        <span key={s.page_id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
          <img src={image(s)} alt="Mon coloriage" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {s.degats > 0 && <small style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.85)', color: '#1d1d1d', textAlign: 'center', fontWeight: 700 }}>{s.degats} pts</small>}
        </span>
      ))}
    </div>
  );

  let gains = '';
  if (a.genre === 'expedition') {
    const base = a.etapes.reduce((s, e) => s + (e.xp || 0), 0);
    const sec = a.etapes.flatMap((e) => e.contraintes || []).filter((c) => c.genre === 'secondaire').map((c) => c.xp).filter(Boolean);
    gains = `${base} XP${a.etapes.length > 1 ? ` (${a.etapes.length} étapes)` : ''}${sec.length ? ` + ${sec[0]} XP par contrainte secondaire réussie` : ''} · progression de la Boussole`;
  } else if (a.genre === 'epopee') {
    gains = `${xpDe(a, 'phase1', XP_EPOPEE.phase1)} XP pour ouvrir la route · ${xpDe(a, 'attaque', XP_EPOPEE.attaque)} XP pour ta 1re attaque · ${xpDe(a, 'victoire', XP_EPOPEE.victoire)} XP si le dragon est vaincu (maximum ${xpDe(a, 'max', XP_EPOPEE.max)} XP) · ${a.recompense || 'un blason'}`;
  } else {
    gains = `${a.etapes[0]?.xp || XP_PROPHETIE.etape} XP par étape · ${xpDe(a, 'complet', XP_PROPHETIE.complet)} XP quand toutes les étapes sont accomplies · Orbe magique et un Parchemin du Destin`;
  }

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href={a.test ? '/profil/admin' : '/aventures'} className="btn alt" aria-label={a.test ? 'Retour à l’Espace de l’Invocatrice' : 'Retour aux aventures'} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem', minWidth: 0, overflowWrap: 'anywhere' }}>{a.titre}</h2>
      </div>
      {a.test && (
        <div className="carte" style={{ ...carteEtape, border: '2px dashed var(--btn)' }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={18} aria-hidden="true" /> Mode test</b>
          <small>
            Tu vois l’aventure comme les membres, avec toutes les étapes révélées. Tu peux soumettre n’importe quel coloriage, même plusieurs fois :
            rien n’est enregistré pour vrai, aucun XP ni aucune récompense n’est donné. L’énigme, la route et le dragon ne tiennent compte que de tes essais.
          </small>
          <button type="button" className="btn alt" onClick={recommencerTest} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}>
            <RotateCcw size={16} aria-hidden="true" /> Recommencer le test
          </button>
        </div>
      )}

      <div className="carte" style={carteEtape}>
        <small style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>
          <Icone size={16} aria-hidden="true" /> {NOMS_AVENTURES[a.genre].singulier}{fete ? ` · ${fete.nom}` : ''}
        </small>
        <small style={{ color: 'var(--texte-secondaire)' }}>Du {jour(a.debut)} au {jour(a.fin)}{terminee ? ' · terminée' : ''}</small>
        {!terminee && <TempsRestant fin={a.fin_instant} />}
        {(a.description || a.instructions) && (
          <div style={fondExpedition ? { backgroundImage: `url(${fondExpedition})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--rayon-m)', padding: '14px' } : undefined}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...(fondExpedition ? { background: 'rgba(255,255,255,0.88)', color: '#1d1d1d', borderRadius: 'var(--rayon-m)', padding: '12px' } : {}) }}>
              {a.description && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--rayon-m)', background: fondExpedition ? 'transparent' : 'var(--accent-doux)' }}>
                  <button type="button" onClick={() => setHistoireOuverte(!histoireVisible)} aria-expanded={histoireVisible}
                    style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '44px', width: '100%', fontWeight: 800 }}>
                    <BookOpen size={18} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Histoire
                    <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>{histoireVisible ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}</span>
                  </button>
                  {histoireVisible
                    ? <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55 }}>{a.description}</p>
                    : <small style={{ color: 'var(--texte-secondaire)' }}>Touche pour relire l’histoire.</small>}
                </div>
              )}
              {a.instructions && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--rayon-m)', border: '2px solid var(--btn)' }}>
                  <b style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><ScrollText size={18} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Instructions globales</b>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55 }}>{a.instructions}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <Gift size={18} aria-hidden="true" style={{ color: 'var(--btn)' }} />
          {gains.split(' · ').map((g) => <Puce key={g}>{g}</Puce>)}
        </div>
        {a.parchemins > 0 && (
          <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <img src="/inventaire/kromadex-parchemin.svg" alt="" aria-hidden="true" style={{ width: 20, height: 20 }} /> {a.parchemins} Parchemin{a.parchemins > 1 ? 's' : ''} du Destin disponible{a.parchemins > 1 ? 's' : ''}
          </small>
        )}
      </div>
      {message && <p className="carte" style={{ margin: '0 0 var(--espace-3)', fontWeight: 700 }}><TexteErreur texte={message} /></p>}

      {a.genre !== 'epopee' && !a.inscrit && !terminee && (
        <div className="carte" style={carteEtape}>
          <b>Vas-tu participer à {a.genre === 'expedition' ? 'l’expédition' : 'la prophétie'} ?</b>
          <small style={{ color: 'var(--texte-secondaire)' }}>Participe pour pouvoir soumettre tes coloriages. Ils devront venir de ta section Tomes / Livres.</small>
          {choixParticiper}
          <NombreParticipants n={a.participants} />
        </div>
      )}

      {a.genre === 'expedition' && a.complete && (
        <div className="carte" style={{ ...carteEtape, alignItems: 'center', textAlign: 'center' }}>
          {a.boussole && imageRecompense(a.boussole) && (
            <img src={imageRecompense(a.boussole)} alt="Boussole" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          )}
          <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={18} aria-hidden="true" /> Expédition réussie, bravo !</b>
          {a.boussole && <small style={{ fontWeight: 700 }}>Ta Boussole : {a.boussole.detail}</small>}
          {a.message_fin && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.message_fin}</p>}
        </div>
      )}

      {a.genre === 'expedition' && a.inscrit && a.etapes.length > 1 && (
        <Progression faites={a.etapes.filter((e) => mes(e.id).length).length} total={a.etapes.length} />
      )}
      {a.genre === 'expedition' && a.etapes.map((e, i) => {
        const plusieurs = a.etapes.length > 1;
        const faite = mes(e.id).length > 0;
        const titre = plusieurs ? (/^Étape \d+$/.test(e.nom) || !e.nom ? `Étape ${i + 1}` : `Étape ${i + 1} : ${e.nom}`) : (e.nom === 'Expédition' ? 'Coloriage demandé' : e.nom);
        return (
          <div key={e.id} className="carte" style={{ ...carteEtape, gap: '12px' }}>
            <EnTeteEtape numero={i + 1} titre={titre} statut={faite ? 'faite' : 'a_faire'} />
            {e.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55 }}>{e.instructions}</p>}
            <Contraintes etape={e} />
            {faite ? (
              <>
                <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}>
                  <Check size={16} aria-hidden="true" /> {plusieurs ? 'Étape accomplie' : 'Expédition réussie'}
                </small>
                {vignettes(mes(e.id))}
              </>
            ) : (
              <>
                {!terminee && a.inscrit && (
                  <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: e })}>
                    <ImageIcon size={18} aria-hidden="true" /> Soumettre mon coloriage
                  </button>
                )}
                <small style={{ color: 'var(--texte-secondaire)' }}>
                  Une seule soumission est permise{plusieurs ? ' par étape' : ''}. Il n’y a pas de verdict : {plusieurs ? 'l’expédition est réussie quand toutes tes étapes sont accomplies.' : 'l’expédition est réussie dès que les contraintes sont respectées.'}
                </small>
              </>
            )}
          </div>
        );
      })}

      {a.genre === 'epopee' && (
        <>
          {!a.inscrit ? (
            <div className="carte" style={carteEtape}>
              <b>Rejoindre l’épopée</b>
              <p style={{ margin: 0 }}>
                Seules les âmes valeureuses osent affronter le dragon qui terrorise ce royaume. Pour t’inscrire, tu dois faire preuve de courage :
                chaque coloriage que tu soumettras devra venir de ta section Tomes / Livres.
              </p>
              {!terminee && choixParticiper}
              <NombreParticipants n={a.participants} />
            </div>
          ) : (
            <>
              <div className="carte" style={{ ...carteEtape, gap: '12px' }}>
                <EnTeteEtape numero={1} titre={`Phase 1 : ${a.etapes[0]?.nom || 'Ouvrir la route'}`} statut={mes(a.etapes[0]?.id).length ? 'faite' : 'a_faire'} />
                <small style={{ fontWeight: 700 }}>
                  Route : {Math.min(a.epopee.contributions, a.min_contributions)} / {a.min_contributions} contributions de personnes différentes
                  {a.epopee.routeOuverte ? ' · la route est ouverte !' : ''}
                </small>
                <div className="profil-xp-barre" style={{ margin: 0 }}><div className="profil-xp-remplissage" style={{ width: `${Math.min(100, Math.round((a.epopee.contributions / a.min_contributions) * 100))}%` }} /></div>
                {!a.enigmeResolue ? (
                  <>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>{a.enigme}</p>
                    <form onSubmit={(ev) => { ev.preventDefault(); action({ action: 'enigme', reponse }); }} style={{ display: 'flex', gap: '6px' }}>
                      <input value={reponse} onChange={(ev) => setReponse(ev.target.value)} placeholder="Ta réponse" aria-label="Réponse de l’énigme" style={{ flex: 1, minWidth: 0 }} />
                      <button type="submit" className="btn" disabled={!reponse.trim()} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><KeyRound size={16} aria-hidden="true" /> Résoudre</button>
                    </form>
                    <small style={{ color: 'var(--texte-secondaire)' }}>Résous l’énigme pour découvrir les contraintes de ton premier coloriage.</small>
                  </>
                ) : (
                  <>
                    {a.etapes[0]?.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.etapes[0].instructions}</p>}
                    <Contraintes etape={a.etapes[0]} />
                    {mes(a.etapes[0].id).length
                      ? <><small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Ta contribution est faite</small>{vignettes(mes(a.etapes[0].id))}</>
                      : !terminee && !a.epopee.vaincu && <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: a.etapes[0] })}><ImageIcon size={18} aria-hidden="true" /> Soumettre ma contribution</button>}
                  </>
                )}
              </div>

              <div className="carte" style={{ ...carteEtape, gap: '12px' }}>
                <EnTeteEtape numero={2} titre={`Phase 2 : ${a.etapes[1]?.nom || 'Affronter le dragon'}`} statut={!a.epopee.routeOuverte ? 'verrou' : a.epopee.vaincu ? 'faite' : 'a_faire'} />
                {!a.epopee.routeOuverte ? (
                  <small style={{ color: 'var(--texte-secondaire)' }}>Le dragon reste inaccessible tant que la route n’est pas ouverte. Ses points faibles seront alors révélés à toute la communauté.</small>
                ) : (
                  <>
                    {imageAventure && (
                      <img src={imageAventure} alt="Le dragon" loading="lazy" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: 'var(--rayon-m)' }} />
                    )}
                    <small style={{ fontWeight: 700 }}>Résistance du dragon : {a.epopee.pvRestants} / {a.pv}</small>
                    <div className="profil-xp-barre" style={{ margin: 0 }}><div className="profil-xp-remplissage" style={{ width: `${Math.round((a.epopee.pvRestants / a.pv) * 100)}%`, background: 'var(--danger)' }} /></div>
                    <small style={{ color: 'var(--texte-secondaire)' }}>Attaques : {a.epopee.attaques} / {a.min_attaques} minimum. Pour vaincre le dragon, il faut les deux avant la fin de l’épopée.</small>
                    {a.epopee.vaincu
                      ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                          {a.complete && imageRecompense({ genre: 'blason', image: a.image }) && (
                            <img src={imageRecompense({ genre: 'blason', image: a.image })} alt="Blason" style={{ width: 120, height: 120, objectFit: 'contain' }} />
                          )}
                          <b style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--btn)' }}><Trophy size={18} aria-hidden="true" /> Le dragon est vaincu, bravo à toute la communauté !</b>
                          {a.complete && <small style={{ fontWeight: 700 }}>Tu gagnes : {a.recompense || `Blason ${a.titre}`}</small>}
                          {a.message_fin && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.message_fin}</p>}
                        </div>
                      )
                      : (
                        <>
                          {a.etapes[1]?.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.etapes[1].instructions}</p>}
                          <Contraintes etape={a.etapes[1]} />
                          <small style={{ color: 'var(--texte-secondaire)' }}>Une attaque par jour. Un même coloriage peut toucher plusieurs points faibles, mais ne sert qu’une fois.</small>
                          {!terminee && (!a.test && mes(a.etapes[1].id).some((s) => s.jour === a.aujourdhui)
                            ? <small style={{ fontWeight: 700 }}>Tu as déjà attaqué aujourd’hui : reviens demain.</small>
                            : <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: a.etapes[1], attaque: true })}><Swords size={18} aria-hidden="true" /> Attaquer le dragon</button>)}
                        </>
                      )}
                    {vignettes(mes(a.etapes[1].id))}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      {a.genre === 'prophetie' && a.complete && (
        <div className="carte" style={{ ...carteEtape, alignItems: 'center', textAlign: 'center' }}>
          {imageRecompense({ genre: 'orbe', image: a.image }) && (
            <img src={imageRecompense({ genre: 'orbe', image: a.image })} alt="Orbe magique" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          )}
          <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={18} aria-hidden="true" /> Prophétie accomplie : tu gagnes l’Orbe magique {a.titre}</b>
          {a.message_fin && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.message_fin}</p>}
        </div>
      )}

      {a.genre === 'prophetie' && a.inscrit && (
        <Progression faites={a.etapes.filter((e) => mes(e.id).length).length} total={a.etapes.length} />
      )}
      {a.genre === 'prophetie' && a.etapes.map((e, i) => (
        <div key={e.id} className="carte" style={{ ...carteEtape, gap: '12px', opacity: e.cache ? 0.75 : 1 }}>
          <EnTeteEtape numero={i + 1} titre={e.nom} statut={e.cache ? 'verrou' : mes(e.id).length ? 'faite' : 'a_faire'}
            dates={e.cache ? `Révélée le ${jour(e.debut)}` : e.debut && e.fin ? `Du ${jour(e.debut)} au ${jour(e.fin)}` : ''} />
          {e.cache ? (
            <small style={{ color: 'var(--texte-secondaire)' }}>Cette étape sera révélée le {jour(e.debut)}.</small>
          ) : (
            <>
              {e.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.55 }}>{e.instructions}</p>}
              <Contraintes etape={e} />
              {mes(e.id).length
                ? (
                  <>
                    <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Étape accomplie</small>
                    {e.message && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontStyle: 'italic', padding: '8px 10px', borderLeft: '3px solid var(--btn)', background: 'var(--accent-doux)', borderRadius: 'var(--rayon-s)' }}>{e.message}</p>}
                    {vignettes(mes(e.id))}
                  </>
                )
                : !terminee && a.inscrit && (a.test || !e.fin || e.fin >= a.aujourdhui) && <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: e })}><ImageIcon size={18} aria-hidden="true" /> Soumettre mon coloriage</button>}
            </>
          )}
        </div>
      ))}

      {soumission && <Soumission a={a} etape={soumission.etape} attaque={soumission.attaque} onFini={fini} onFermer={() => setSoumission(null)} />}
    </div>
  );
}
