'use client';
import { useEffect, useState } from 'react';
import { Users, Tag, Trophy, Mail, Grid3x3, Compass, ShieldAlert, Inbox, Tags, ClipboardCheck, Flag, Gift, Rocket, Award, BookOpen, Settings, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import Membres from './membres';
import Titres from './titres';
import Defis from './defis';
import Missives from './missives';
import Bingos from './bingos';
import Aventures from './aventures';
import ValidationBingos from './validationBingos';
import SignalementsEpreuves from './signalementsEpreuves';
import ContenuSignale from './contenuSignale';
import TomesAdmin from './tomesAdmin';
import Moderation from './moderation';
import Demandes from './demandes';
import MotsCles from './motsCles';
import Lancement from './lancement';
import ReglageParrainage from './reglageParrainage';
import Recompenses from './recompenses';

const ONGLETS = [
  { cle: 'demandes', label: 'Demandes', icone: Inbox, roles: ['admin'] },
  { cle: 'reglages', label: 'Réglages', icone: Settings, roles: ['admin'] },
  { cle: 'signalements', label: 'Contenu signalé', icone: Flag, roles: ['admin', 'modo'] },
  { cle: 'moderation', label: 'Modération', icone: ShieldAlert, roles: ['admin', 'modo'] },
  { cle: 'motscles', label: 'Mots-clefs', icone: Tags, roles: ['admin', 'modo'] },
  { cle: 'titres', label: 'Titres', icone: Tag, roles: ['admin'] },
  { cle: 'membres', label: 'Postes', icone: Users, roles: ['admin', 'modo'] },
  { cle: 'activites', label: 'Activités', icone: Sparkles, roles: ['admin', 'modo', 'cheffe', 'menestrel'] },
  { cle: 'validation', label: 'Validation des bingos', icone: ClipboardCheck, roles: ['admin', 'modo'] },
  { cle: 'missives', label: 'Missives', icone: Mail, roles: ['admin', 'modo'] },
  { cle: 'lancement', label: 'Lancement', icone: Rocket, roles: ['admin'] },
  { cle: 'recompenses', label: 'Récompenses', icone: Award, roles: ['admin'] },
  { cle: 'tomes', label: 'Tomes et livres', icone: BookOpen, roles: ['admin'] },
];

// Regroupées sous le bouton Activités.
const ACTIVITES = [
  { cle: 'defis', label: 'Épreuves', aide: 'Créer et gérer les épreuves', icone: Trophy, roles: ['admin', 'modo', 'cheffe', 'menestrel'] },
  { cle: 'bingos', label: 'Bingos', aide: 'Créer et gérer les bingos', icone: Grid3x3, roles: ['admin', 'menestrel'] },
  { cle: 'aventures', label: 'Aventures', aide: 'Expéditions, épopées et prophéties', icone: Compass, roles: ['admin'] },
];

export default function EspaceAdmin({ role, monId }) {
  const onglets = ONGLETS.filter((o) => o.roles.includes(role) && (o.cle !== 'activites' || ACTIVITES.some((a) => a.roles.includes(role))));
  const activites = ACTIVITES.filter((a) => a.roles.includes(role));
  const [actif, setActif] = useState(onglets[0]?.cle);
  const [activite, setActivite] = useState(activites.length === 1 ? activites[0].cle : null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const o = new URLSearchParams(window.location.search).get('onglet');
    if (activites.some((x) => x.cle === o)) { setActif('activites'); setActivite(o); }
    else if (onglets.some((x) => x.cle === o)) setActif(o);
  }, []);

  function choisirOnglet(cle) {
    setActif(cle);
    if (cle === 'activites') setActivite(activites.length === 1 ? activites[0].cle : null);
  }

  const [aTraiter, setATraiter] = useState({});
  useEffect(() => {
    const verifier = () => fetch('/api/notifications').then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setATraiter({
        demandes: d.demandes, signalements: d.signales, motscles: d.mots_cles_signales,
        validation: d.validation, missives: d.missives_attente, lancement: d.inscriptions,
      })).catch(() => {});
    verifier();
    window.addEventListener('kromadex-lu', verifier);
    return () => window.removeEventListener('kromadex-lu', verifier);
  }, []);

  return (
    <>
      {onglets.length > 1 && (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, onglets.length)}, minmax(0, 1fr))`, gap: '6px',
          marginBottom: 'var(--espace-3)',
        }}>
          {onglets.map(({ cle, label, icone: Icone }) => (
            <button key={cle} type="button" onClick={() => choisirOnglet(cle)} className={actif === cle ? 'btn' : 'btn alt'}
              aria-label={aTraiter[cle] > 0 ? `${label}, ${aTraiter[cle]} à traiter` : undefined}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                minHeight: '54px', padding: '6px 4px', fontSize: '0.78rem', lineHeight: 1.2, minWidth: 0, overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'manual',
              }}>
              <Icone size={18} /> {label}
              {aTraiter[cle] > 0 && <span className="pastille" aria-hidden="true" style={{ position: 'absolute', top: 6, right: 6 }} />}
            </button>
          ))}
        </div>
      )}

      {actif === 'demandes' && <Demandes />}
      {actif === 'membres' && <Membres role={role} />}
      {actif === 'moderation' && <Moderation role={role} monId={monId} />}
      {actif === 'activites' && !activite && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activites.map(({ cle, label, aide, icone: Icone }) => (
            <button key={cle} type="button" onClick={() => setActivite(cle)} className="carte"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '64px', cursor: 'pointer', textAlign: 'left', width: '100%', border: '1px solid var(--bordure-carte)', color: 'inherit' }}>
              <span style={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', background: 'var(--accent-doux)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--btn)' }}>
                <Icone size={22} aria-hidden="true" />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block' }}>{label}</b>
                <small style={{ color: 'var(--texte-secondaire)' }}>{aide}</small>
              </span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      {actif === 'activites' && activite && activites.length > 1 && (
        <button type="button" className="btn alt" onClick={() => setActivite(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', marginBottom: 'var(--espace-3)', fontWeight: 700 }}>
          <ArrowLeft size={16} aria-hidden="true" /> Toutes les activités
        </button>
      )}
      {actif === 'activites' && activite === 'defis' && <Defis role={role} monId={monId} />}
      {actif === 'activites' && activite === 'bingos' && <Bingos role={role} />}
      {actif === 'activites' && activite === 'aventures' && <Aventures />}
      {actif === 'missives' && <Missives role={role} monId={monId} />}
      {actif === 'titres' && <Titres />}
      {actif === 'validation' && <ValidationBingos />}
      {actif === 'signalements' && <><ContenuSignale /><SignalementsEpreuves /></>}
      {actif === 'motscles' && <MotsCles />}
      {actif === 'lancement' && <Lancement />}
      {actif === 'reglages' && <ReglageParrainage />}
      {actif === 'recompenses' && <Recompenses />}
      {actif === 'tomes' && <TomesAdmin />}
    </>
  );
}
