'use client';
import { useEffect, useState } from 'react';
import { Users, Tag, Trophy, Mail, Grid3x3, Compass, ShieldAlert, Inbox, Tags, ClipboardCheck, Flag, Gift, Rocket, Award, BookOpen } from 'lucide-react';
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
import KromadexPlus from './kromadexPlus';
import Lancement from './lancement';
import Recompenses from './recompenses';

const ONGLETS = [
  { cle: 'demandes', label: 'Demandes', icone: Inbox, roles: ['admin'] },
  { cle: 'signalements', label: 'Contenu signalé', icone: Flag, roles: ['admin', 'modo'] },
  { cle: 'moderation', label: 'Modération', icone: ShieldAlert, roles: ['admin', 'modo'] },
  { cle: 'motscles', label: 'Mots-clefs', icone: Tags, roles: ['admin', 'modo'] },
  { cle: 'titres', label: 'Titres', icone: Tag, roles: ['admin'] },
  { cle: 'membres', label: 'Postes', icone: Users, roles: ['admin', 'modo'] },
  { cle: 'defis', label: 'Épreuves', icone: Trophy, roles: ['admin', 'modo', 'cheffe', 'menestrel'] },
  { cle: 'aventures', label: 'Aventure', icone: Compass, roles: ['admin'] },
  { cle: 'missives', label: 'Missives', icone: Mail, roles: ['admin', 'modo'] },
  { cle: 'bingos', label: 'Bingo', icone: Grid3x3, roles: ['admin', 'menestrel'] },
  { cle: 'validation', label: 'Validation des bingos', icone: ClipboardCheck, roles: ['admin', 'modo'] },
  { cle: 'plus', label: 'Kromadex+', icone: Gift, roles: ['admin'] },
  { cle: 'lancement', label: 'Lancement', icone: Rocket, roles: ['admin'] },
  { cle: 'recompenses', label: 'Récompenses', icone: Award, roles: ['admin'] },
  { cle: 'tomes', label: 'Tomes et livres', icone: BookOpen, roles: ['admin'] },
];

export default function EspaceAdmin({ role, monId }) {
  const onglets = ONGLETS.filter((o) => o.roles.includes(role));
  const [actif, setActif] = useState(onglets[0]?.cle);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const o = new URLSearchParams(window.location.search).get('onglet');
    if (onglets.some((x) => x.cle === o)) setActif(o);
  }, []);

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
            <button key={cle} type="button" onClick={() => setActif(cle)} className={actif === cle ? 'btn' : 'btn alt'}
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
      {actif === 'defis' && <Defis role={role} monId={monId} />}
      {actif === 'missives' && <Missives role={role} monId={monId} />}
      {actif === 'titres' && <Titres />}
      {actif === 'bingos' && <Bingos role={role} />}
      {actif === 'aventures' && <Aventures />}
      {actif === 'validation' && <ValidationBingos />}
      {actif === 'signalements' && <><ContenuSignale /><SignalementsEpreuves /></>}
      {actif === 'motscles' && <MotsCles />}
      {actif === 'plus' && <KromadexPlus />}
      {actif === 'lancement' && <Lancement />}
      {actif === 'recompenses' && <Recompenses />}
      {actif === 'tomes' && <TomesAdmin />}
    </>
  );
}
