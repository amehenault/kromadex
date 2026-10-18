'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Image as ImageIcon, Trash2, Pencil, Gift, Trophy, Gavel, Plus } from 'lucide-react';
import { nomCategorie } from '@/lib/defis';
import { Avatar, poster } from '@/app/communaute/outils';
import { TempsRestant } from '@/components/Fuseau';
import ChoixColoriage from '@/components/ChoixColoriage';
import Verdict from '@/components/Verdict';
import { nomPoste, couleurPoste } from '@/lib/postes';
import { XP_EPREUVES, XP_GROUPE } from '@/lib/activites';
import Pseudo from '@/components/Pseudo';
import NombreParticipants from '@/components/NombreParticipants';

const ETIQUETTE = { officiel: 'Épreuve du mois', modo: 'Épreuve de sentinelle', cheffe: 'Épreuve de chef.fe', groupe: 'Épreuve de groupe' };
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const image = (f) => `/api/pages/${f.id}/image?s=${f.img_size || 0}`;

// Ce que la personne gagnante remporte, selon le genre d'épreuve
function recompenses(d) {
  const xp = XP_EPREUVES[d.genre];
  if (d.genre === 'groupe') {
    return `${XP_GROUPE.complete} XP chacun si l’objectif est atteint, sinon ${XP_GROUPE.participation} XP de participation${d.multiple ? ` · ${XP_GROUPE.supplementaire} XP par coloriage supplémentaire` : ''}`;
  }
  const titre = d.titre_gagnant ? ` · titre « ${d.titre_gagnant} »` : '';
  if (d.genre === 'officiel') return `Participation ${xp.participation} XP · la personne gagnante : +${xp.victoire} XP, Coffre au trésor, badge du mois${titre}, et elle devient Chef.fe des coloristes`;
  if (d.genre === 'modo') return `Participation ${xp.participation} XP · la personne gagnante : +${xp.victoire} XP, badge de l’épreuve et un fragment de relique${titre}`;
  return `Participation ${xp.participation} XP · la personne gagnante : +${xp.victoire} XP et le sceau de la cheffe${titre}`;
}

// Une épreuve : infos, récompenses, envoyer son coloriage, verdict de l'Assemblée (ou progression pour une épreuve de groupe)
export default function CarteDefi({ defi: d, onChange, monId, onModifier }) {
  const [choix, setChoix] = useState(false);
  const [galerie, setGalerie] = useState(null);
  const [verdict, setVerdict] = useState(false);
  const [erreur, setErreur] = useState('');
  const termine = d.cloture || (d.fin_instant && new Date(d.fin_instant).getTime() <= Date.now());
  const groupe = d.genre === 'groupe';

  async function participer() {
    setErreur('');
    const r = await fetch('/api/defis/participer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defiId: d.id }) });
    if (r.ok) onChange(); else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }
  async function quitter() {
    if (!confirm('Quitter cette épreuve ? Les XP gagnés avec elle seront retirés.')) return;
    await poster('/api/defis/participer', { defiId: d.id }, 'DELETE');
    onChange();
  }
  async function envoyer(f) {
    setErreur('');
    const r = await fetch('/api/defis/participer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defiId: d.id, pageId: f.id }) });
    if (r.ok) { setChoix(false); setGalerie(null); onChange(); } else setErreur((await r.json().catch(() => ({}))).error || 'Erreur');
  }
  async function voirGalerie() {
    if (galerie) { setGalerie(null); return; }
    const r = await fetch(`/api/defis/participer?defi=${d.id}`).then((x) => x.json());
    setGalerie(r.fiches || []);
  }
  async function retirerEnvoi(f) {
    if (!confirm('Retirer ce coloriage de l’épreuve ?')) return;
    await poster('/api/defis/participer', { defiId: d.id, pageId: f.id }, 'DELETE');
    setGalerie((g) => g?.filter((x) => x.id !== f.id));
    onChange();
  }
  async function supprimer() {
    if (!confirm(`Supprimer l’épreuve « ${d.titre} » ?`)) return;
    await poster('/api/defis', { id: d.id }, 'DELETE');
    onChange();
  }

  const petit = { minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' };
  const pct = d.objectif ? Math.min(100, Math.round((d.envois / d.objectif) * 100)) : 0;
  const peutEnvoyer = d.je_participe && !termine && (!groupe || d.multiple || !d.mes_envois);

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: d.genre === 'officiel' ? '2px solid var(--btn)' : undefined, opacity: termine && !d.cloture ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>{ETIQUETTE[d.genre]}</small>
        <small style={{ fontWeight: 700 }}>{nomCategorie(d.categorie)}</small>
      </div>
      <b style={{ fontSize: '1.1rem', overflowWrap: 'anywhere' }}>{d.titre}</b>
      {d.createur_id && (
        <Link href={`/membre/${d.createur_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', color: 'inherit', textDecoration: 'none', alignSelf: 'flex-start' }}>
          <Avatar x={{ user_id: d.createur_id, a_avatar: d.a_avatar, avatar_maj: d.avatar_maj }} taille={28} />
          <small>
            Créée par <Pseudo x={{ pseudo: d.choisi_par, name: d.nom_createur, role: d.role_createur }} />
            <span style={{ color: couleurPoste(d.role_createur), fontWeight: 700 }}> · {nomPoste(d.role_createur, d.genre_createur)}</span>
          </small>
        </Link>
      )}
      {d.description && <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{d.description}</p>}
      <small style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: 'var(--texte-secondaire)' }}>
        <Gift size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} /> <span>{recompenses(d)}</span>
      </small>
      <small style={{ color: 'var(--texte-secondaire)' }}>
        {d.debut && d.fin ? `Du ${jour(d.debut)} au ${jour(d.fin)}${termine ? ' · terminée' : ''} · ` : ''}
        {groupe ? d.envois : d.coloriages} coloriage{(groupe ? d.envois : d.coloriages) > 1 ? 's' : ''}
      </small>
      {!termine && <TempsRestant fin={d.fin_instant} />}

      {/* Épreuve de groupe : progression vers l'objectif */}
      {groupe && d.objectif > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="profil-xp-barre" style={{ flex: 1, margin: 0 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progression de l’épreuve">
            <div className="profil-xp-remplissage" style={{ width: `${pct}%` }} />
          </div>
          <small style={{ flex: '0 0 auto', fontWeight: 700 }}>{d.envois} / {d.objectif}</small>
        </div>
      )}

      {/* Résultat annoncé le dernier jour du mois */}
      {d.cloture && !groupe && (
        <small style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--btn)' }}>
          <Trophy size={16} aria-hidden="true" />
          {d.j_ai_gagne ? 'Bravo, tu as gagné cette épreuve !' : d.nom_gagnant ? `Gagnant.e : ${d.nom_gagnant}` : 'Épreuve terminée sans gagnant.e'}
        </small>
      )}
      {d.cloture && groupe && (
        <small style={{ fontWeight: 700, color: 'var(--btn)' }}>{d.objectif && d.envois >= d.objectif ? 'Objectif atteint, bravo à tout le monde !' : 'Épreuve terminée'}</small>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {!d.je_participe && !termine && <button type="button" className="btn" style={petit} onClick={participer}>S’inscrire</button>}
        {peutEnvoyer && (
          <button type="button" className="btn" style={petit} onClick={() => setChoix(true)}>
            {groupe && d.mes_envois ? <><Plus size={16} aria-hidden="true" /> Ajouter un coloriage</> : <><ImageIcon size={16} aria-hidden="true" /> {d.ma_page ? 'Changer mon coloriage' : 'Envoyer mon coloriage'}</>}
          </button>
        )}
        {d.je_participe && <span style={{ ...petit, fontWeight: 700, color: 'var(--btn)' }}><Check size={16} aria-hidden="true" /> Inscrit.e</span>}
        {!groupe && d.coloriages > 0 && (
          <button type="button" className="btn alt" style={petit} onClick={() => setVerdict(!verdict)}>
            <Gavel size={16} aria-hidden="true" /> {verdict ? 'Masquer' : termine ? 'Voir les coloriages' : 'Rendre mon verdict'}
          </button>
        )}
        {groupe && d.envois > 0 && (
          <button type="button" className="btn alt" style={petit} onClick={voirGalerie}>{galerie ? 'Masquer' : 'Voir les coloriages'}</button>
        )}
        {d.je_participe && !termine && String(d.createur_id) !== monId && (
          <button type="button" className="btn alt" style={petit} onClick={quitter}>Quitter</button>
        )}
        {onModifier && String(d.createur_id) === monId && !termine && (
          <>
            <button type="button" className="btn alt" style={petit} onClick={() => onModifier(d)}><Pencil size={14} aria-hidden="true" /> Modifier</button>
            <button type="button" className="btn alt danger" style={petit} onClick={supprimer}><Trash2 size={14} aria-hidden="true" /> Supprimer</button>
          </>
        )}
      </div>
      <NombreParticipants n={d.participants} />
      {erreur && !choix && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}

      {verdict && <Verdict activite={`epreuve:${d.id}`} signalerDefi={d.id} />}

      {galerie && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px' }}>
          {galerie.map((f) => (
            <div key={f.id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
              <img src={image(f)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {f.a_moi && !termine && (
                <button type="button" onClick={() => retirerEnvoi(f)} aria-label="Retirer mon coloriage"
                  style={{ position: 'absolute', top: 4, right: 4, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {choix && (
        <ChoixColoriage
          type={d.categorie} publiees
          aide={`Seuls tes coloriages publiés dans la communauté${d.categorie !== 'tous' ? ` de type ${nomCategorie(d.categorie)}` : ''} peuvent être envoyés.`}
          onChoisir={envoyer} onFermer={() => setChoix(false)} erreur={erreur} />
      )}
    </div>
  );
}
