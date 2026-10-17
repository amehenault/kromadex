'use client';
import { useEffect, useState } from 'react';
import { Users, Tag, Trophy, Mail, Grid3x3, Compass, ShieldAlert, Inbox, Newspaper, Tags, ClipboardCheck, Flag } from 'lucide-react';
import Membres from './membres';
import Titres from './titres';
import Defis from './defis';
import Missives from './missives';
import Bingos from './bingos';
import Aventures from './aventures';
import ValidationBingos from './validationBingos';
import SignalementsEpreuves from './signalementsEpreuves';
import Moderation from './moderation';
import Demandes from './demandes';
import Nouveautes from './nouveautes';
import MotsCles from './motsCles';

const ONGLETS = [
  { cle: 'demandes', label: 'Demandes', icone: Inbox, roles: ['admin'] },
  { cle: 'membres', label: 'Postes', icone: Users, roles: ['admin', 'modo'] },
  { cle: 'moderation', label: 'Modération', icone: ShieldAlert, roles: ['admin', 'modo'] },
  { cle: 'motscles', label: 'Mots-clés', icone: Tags, roles: ['admin', 'modo'] },
  { cle: 'defis', label: 'Épreuves', icone: Trophy, roles: ['admin', 'modo', 'cheffe'] },
  { cle: 'signalements', label: 'Signalés', icone: Flag, roles: ['admin', 'modo'] },
  { cle: 'validation', label: 'Validation des bingos', icone: ClipboardCheck, roles: ['admin', 'modo'] },
  { cle: 'missives', label: 'Missives', icone: Mail, roles: ['admin', 'modo'] },
  { cle: 'titres', label: 'Titres', icone: Tag, roles: ['admin'] },
  { cle: 'bingos', label: 'Bingos', icone: Grid3x3, roles: ['admin'] },
  { cle: 'aventures', label: 'Aventures', icone: Compass, roles: ['admin'] },
  { cle: 'nouveautes', label: 'Nouveautés', icone: Newspaper, roles: ['admin'] },
];

export default function EspaceAdmin({ role, monId }) {
  const onglets = ONGLETS.filter((o) => o.roles.includes(role));
  const [actif, setActif] = useState(onglets[0]?.cle);

  // Lien direct vers un onglet (ex. depuis Activités à venir : /profil/admin?onglet=aventures)
  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get('onglet');
    if (onglets.some((x) => x.cle === o)) setActif(o);
  }, []);

  return (
    <>
      {/* Onglets : tous visibles d'un coup, 3 par rangée */}
      {onglets.length > 1 && (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, onglets.length)}, minmax(0, 1fr))`, gap: '6px',
          marginBottom: 'var(--espace-3)',
        }}>
          {onglets.map(({ cle, label, icone: Icone }) => (
            <button key={cle} type="button" onClick={() => setActif(cle)} className={actif === cle ? 'btn' : 'btn alt'}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                minHeight: '54px', padding: '6px 4px', fontSize: '0.8rem', minWidth: 0,
              }}>
              <Icone size={18} /> {label}
            </button>
          ))}
        </div>
      )}

      {actif === 'demandes' && <Demandes />}
      {actif === 'membres' && <Membres role={role} />}
      {actif === 'moderation' && <Moderation role={role} monId={monId} />}
      {actif === 'defis' && <Defis role={role} monId={monId} />}
      {actif === 'missives' && <Missives role={role} />}
      {actif === 'titres' && <Titres />}
      {actif === 'bingos' && <Bingos />}
      {actif === 'aventures' && <Aventures />}
      {actif === 'validation' && <ValidationBingos />}
      {actif === 'signalements' && <SignalementsEpreuves />}
      {actif === 'nouveautes' && <Nouveautes />}
      {actif === 'motscles' && <MotsCles />}
    </>
  );
}
