'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Compass, Shield, Sparkles, Lock, Check, ScrollText, Gift, KeyRound, Swords, Image as ImageIcon, Trophy } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import Feuille from '@/components/Feuille';
import ChoixColoriage from '@/components/ChoixColoriage';
import { FETES, NOMS_AVENTURES, DEGATS, XP_EPOPEE, XP_PROPHETIE } from '@/lib/activites';
import TexteErreur from '@/components/TexteErreur';

const ICONES = { expedition: Compass, epopee: Shield, prophetie: Sparkles };
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const image = (s) => `/api/pages/${s.page_id}/image?s=${s.img_size || 0}`;
const xpDe = (a, cle, defaut) => (Number.isFinite(Number(a.xp?.[cle])) ? Number(a.xp[cle]) : defaut);
const ETIQUETTE = { obligatoire: 'Obligatoire', secondaire: 'Secondaire' };

// Soumettre un coloriage à une étape : choisir le coloriage (section Tomes / Livres), puis cocher les contraintes respectées
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
      body: JSON.stringify({ action: 'soumettre', id: a.id, etapeId: etape.id, pageId: page.id, contraintes: cochees, parchemin }) });
    const d = await r.json().catch(() => ({}));
    setOccupe(false);
    if (!r.ok) { setErreur(d.error || 'Erreur'); return; }
    onFini(d);
  }

  if (!page) {
    return (
      <ChoixColoriage titre={etape.nom} tomes type={a.categorie} onChoisir={setPage} onFermer={onFermer}
        aide="Le coloriage doit venir de ta section Tomes / Livres. Un même coloriage ne sert qu’une fois par aventure." />
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
                <ScrollText size={16} aria-hidden="true" /> {elimine ? 'Garder cette contrainte' : 'Éliminer avec un Parchemin du Destin'}
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

function Contraintes({ etape }) {
  return (
    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {etape.contraintes.map((c) => (
        <li key={c.id} style={{ overflowWrap: 'anywhere' }}>
          {c.texte}{' '}
          <small style={{ fontWeight: 700, color: 'var(--texte-secondaire)' }}>
            ({DEGATS[c.genre] ? `${DEGATS[c.genre].label.toLowerCase()}, ${c.degats} points` : ETIQUETTE[c.genre].toLowerCase()}{c.genre === 'secondaire' && c.xp ? `, +${c.xp} XP` : ''})
          </small>
        </li>
      ))}
    </ul>
  );
}

export default function Aventure({ id }) {
  const router = useRouter();
  const [a, setA] = useState(null);
  const [erreur, setErreur] = useState('');
  const [soumission, setSoumission] = useState(null); // { etape, attaque }
  const [message, setMessage] = useState('');
  const [reponse, setReponse] = useState('');

  async function charger() {
    const r = await fetch(`/api/aventures?id=${id}`);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setA(d.aventure); else setErreur(d.error || 'Aventure introuvable');
  }
  useEffect(() => { charger(); }, [id]);

  async function action(corps) {
    setMessage('');
    const r = await fetch('/api/aventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id, ...corps }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(d.error || 'Erreur'); return; }
    charger();
  }
  function fini(d) {
    setSoumission(null);
    setMessage(d.degats ? `Attaque réussie : ${d.degats} points de dégâts${d.xp ? ` · +${d.xp} XP` : ''}` : `Coloriage soumis${d.xp ? ` · +${d.xp} XP` : ''}`);
    charger(); router.refresh();
  }

  if (erreur) return <p style={{ padding: 'var(--espace-3)' }}><TexteErreur texte={erreur} /></p>;
  if (!a) return <p style={{ padding: 'var(--espace-3)' }}>Chargement…</p>;

  const Icone = ICONES[a.genre];
  const fete = FETES.find((f) => f.valeur === a.fete);
  const terminee = a.fin < a.aujourdhui;
  const mes = (etapeId) => a.mesSoumissions.filter((s) => s.etape_id === etapeId);
  const bouton = { minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
  const carteEtape = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' };
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

  // Récompenses annoncées
  let gains = '';
  if (a.genre === 'expedition') {
    const base = a.etapes[0]?.xp || 0;
    const sec = (a.etapes[0]?.contraintes || []).filter((c) => c.genre === 'secondaire').map((c) => c.xp).filter(Boolean);
    gains = `${base} XP${sec.length ? ` + ${sec[0]} XP par contrainte secondaire réussie` : ''} · progression de la Boussole`;
  } else if (a.genre === 'epopee') {
    gains = `${xpDe(a, 'phase1', XP_EPOPEE.phase1)} XP pour ouvrir la route · ${xpDe(a, 'attaque', XP_EPOPEE.attaque)} XP pour ta 1re attaque · ${xpDe(a, 'victoire', XP_EPOPEE.victoire)} XP si le dragon est vaincu (maximum ${xpDe(a, 'max', XP_EPOPEE.max)} XP) · ${a.recompense || 'un blason'}`;
  } else {
    gains = `${a.etapes[0]?.xp || XP_PROPHETIE.etape} XP par étape · ${xpDe(a, 'complet', XP_PROPHETIE.complet)} XP quand toutes les étapes sont accomplies · Orbe magique et un Parchemin du Destin`;
  }

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/aventures" className="btn alt" aria-label="Retour aux aventures" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem', minWidth: 0, overflowWrap: 'anywhere' }}>{a.titre}</h2>
      </div>

      <div className="carte" style={carteEtape}>
        <small style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>
          <Icone size={16} aria-hidden="true" /> {NOMS_AVENTURES[a.genre].singulier}{fete ? ` · ${fete.nom}` : ''}
        </small>
        <small style={{ color: 'var(--texte-secondaire)' }}>Du {jour(a.debut)} au {jour(a.fin)}{terminee ? ' · terminée' : ''}</small>
        {!terminee && <TempsRestant fin={a.fin_instant} />}
        {a.description && <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.description}</p>}
        <small style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--texte-secondaire)' }}>
          <Gift size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} /> <span>{gains}</span>
        </small>
        {a.parchemins > 0 && (
          <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <ScrollText size={16} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {a.parchemins} Parchemin{a.parchemins > 1 ? 's' : ''} du Destin disponible{a.parchemins > 1 ? 's' : ''}
          </small>
        )}
      </div>
      {message && <p className="carte" style={{ margin: '0 0 var(--espace-3)', fontWeight: 700 }}><TexteErreur texte={message} /></p>}

      {/* Expédition et prophétie : on s'inscrit avant de soumettre (l'épopée a sa propre inscription plus bas) */}
      {a.genre !== 'epopee' && !a.inscrit && !terminee && (
        <div className="carte" style={carteEtape}>
          <b>S’inscrire à {a.genre === 'expedition' ? 'l’expédition' : 'la prophétie'}</b>
          <small style={{ color: 'var(--texte-secondaire)' }}>Inscris-toi pour pouvoir soumettre tes coloriages. Ils devront venir de ta section Tomes / Livres.</small>
          <button type="button" className="btn" style={bouton} onClick={() => action({ action: 'inscrire' })}>S’inscrire</button>
        </div>
      )}

      {/* Expédition : un seul coloriage */}
      {a.genre === 'expedition' && a.etapes.map((e) => (
        <div key={e.id} className="carte" style={carteEtape}>
          <b>{e.nom}</b>
          {e.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.instructions}</p>}
          <Contraintes etape={e} />
          {mes(e.id).length > 0
            ? <><small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Expédition réussie</small>{vignettes(mes(e.id))}</>
            : !terminee && a.inscrit && <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: e })}><ImageIcon size={18} aria-hidden="true" /> Soumettre mon coloriage</button>}
          {!mes(e.id).length && <small style={{ color: 'var(--texte-secondaire)' }}>Une seule soumission est permise. Il n’y a pas de verdict : l’expédition est réussie dès que les contraintes sont respectées.</small>}
        </div>
      ))}

      {/* Épopée : inscription, énigme, phase 1, puis le dragon */}
      {a.genre === 'epopee' && (
        <>
          {!a.inscrit ? (
            <div className="carte" style={carteEtape}>
              <b>Rejoindre l’épopée</b>
              <p style={{ margin: 0 }}>
                Seules les âmes valeureuses osent affronter le dragon qui terrorise ce royaume. Pour t’inscrire, tu dois faire preuve de courage :
                chaque coloriage que tu soumettras devra venir de ta section Tomes / Livres.
              </p>
              {!terminee && <button type="button" className="btn" style={bouton} onClick={() => action({ action: 'inscrire' })}><Swords size={18} aria-hidden="true" /> Je m’engage dans l’épopée</button>}
            </div>
          ) : (
            <>
              <div className="carte" style={carteEtape}>
                <b>{a.etapes[0]?.nom || 'Phase 1'}</b>
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

              <div className="carte" style={carteEtape}>
                <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{a.epopee.routeOuverte ? <Swords size={18} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />} {a.etapes[1]?.nom || 'Phase 2'}</b>
                {!a.epopee.routeOuverte ? (
                  <small style={{ color: 'var(--texte-secondaire)' }}>Le dragon reste inaccessible tant que la route n’est pas ouverte. Ses points faibles seront alors révélés à toute la communauté.</small>
                ) : (
                  <>
                    <small style={{ fontWeight: 700 }}>Résistance du dragon : {a.epopee.pvRestants} / {a.pv}</small>
                    <div className="profil-xp-barre" style={{ margin: 0 }}><div className="profil-xp-remplissage" style={{ width: `${Math.round((a.epopee.pvRestants / a.pv) * 100)}%`, background: 'var(--danger)' }} /></div>
                    <small style={{ color: 'var(--texte-secondaire)' }}>Attaques : {a.epopee.attaques} / {a.min_attaques} minimum. Pour vaincre le dragon, il faut les deux avant la fin de l’épopée.</small>
                    {a.epopee.vaincu
                      ? <b style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--btn)' }}><Trophy size={18} aria-hidden="true" /> Le dragon est vaincu, bravo à toute la communauté !</b>
                      : (
                        <>
                          {a.etapes[1]?.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{a.etapes[1].instructions}</p>}
                          <Contraintes etape={a.etapes[1]} />
                          <small style={{ color: 'var(--texte-secondaire)' }}>Une attaque par jour. Un même coloriage peut toucher plusieurs points faibles, mais ne sert qu’une fois.</small>
                          {!terminee && (mes(a.etapes[1].id).some((s) => s.jour === a.aujourdhui)
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

      {/* Prophétie : étapes révélées au fil des semaines */}
      {a.genre === 'prophetie' && a.etapes.map((e) => (
        <div key={e.id} className="carte" style={{ ...carteEtape, opacity: e.cache ? 0.75 : 1 }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{e.cache && <Lock size={16} aria-hidden="true" />} {e.nom}</b>
          {e.cache ? (
            <small style={{ color: 'var(--texte-secondaire)' }}>Cette étape sera révélée le {jour(e.debut)}.</small>
          ) : (
            <>
              {e.debut && e.fin && <small style={{ color: 'var(--texte-secondaire)' }}>Du {jour(e.debut)} au {jour(e.fin)}</small>}
              {e.instructions && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{e.instructions}</p>}
              <Contraintes etape={e} />
              {mes(e.id).length
                ? <><small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Étape accomplie</small>{vignettes(mes(e.id))}</>
                : !terminee && a.inscrit && (!e.fin || e.fin >= a.aujourdhui) && <button type="button" className="btn" style={bouton} onClick={() => setSoumission({ etape: e })}><ImageIcon size={18} aria-hidden="true" /> Soumettre mon coloriage</button>}
            </>
          )}
        </div>
      ))}

      {soumission && <Soumission a={a} etape={soumission.etape} attaque={soumission.attaque} onFini={fini} onFermer={() => setSoumission(null)} />}
    </div>
  );
}
