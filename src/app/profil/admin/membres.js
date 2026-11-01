'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Crown, CalendarPlus, UserCog, Gift, Users } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide } from './outils';
import { nomPionnier } from '@/lib/cadres';
import { nomPoste, couleurPoste } from '@/lib/postes';
import Pseudo from '@/components/Pseudo';
import Deroulant from '@/components/Deroulant';
import { Avatar } from '@/app/communaute/outils';
import KromadexPlus from './kromadexPlus';
import { accord } from '@/lib/genre';

const POSTES = [
  { valeur: 'coloriste', label: 'Coloriste' },
  { valeur: 'cheffe', label: 'Cheffe des coloristes (1 mois)' },
  { valeur: 'modo', label: 'Sentinelle du Kromadex' },
  { valeur: 'menestrel', label: 'Ménestrelle (1 épreuve et 1 bingo par mois)' },
];
const SEPT_JOURS = 7 * 86400000;
const nouveau = (u) => u.created_at && Date.now() - new Date(u.created_at).getTime() <= SEPT_JOURS;
const inscriteLe = (u) => (u.created_at ? new Date(u.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
export const puceFiltre = (actif) => ({ flex: '0 0 auto', minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 14px' });

function BarreRecherche({ valeur, onChange, texte = 'Rechercher un pseudo' }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
      <input type="search" placeholder={texte} aria-label={texte} value={valeur} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', paddingLeft: '36px', margin: 0 }} />
    </div>
  );
}

function Attribution({ membres, estAdmin, recharger }) {
  const [recherche, setRecherche] = useState('');
  const [nouveaux, setNouveaux] = useState(false);
  const [message, setMessage] = useState('');

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase().replace(/^@/, '');
    if (!q && !nouveaux) return [];
    return membres.filter((u) => (!q || [u.pseudo, u.name].some((x) => (x || '').toLowerCase().includes(q))) && (!nouveaux || nouveau(u)));
  }, [membres, recherche, nouveaux]);

  const paye = (u) => u.plus_jusqu && new Date(u.plus_jusqu) > new Date() && u.plus_statut !== 'aucun';
  async function modifier(id, corps) {
    const r = await envoyer('/api/roles', 'PUT', { targetUserId: id, ...corps });
    setMessage(r.ok ? 'Enregistré' : r.error);
    recharger();
  }

  return (
    <div className="carte" style={colonne}>
      <p style={aide}>
        Tout le monde est <b>coloriste</b> par défaut. La <b>cheffe des coloristes</b> a gagné une épreuve mensuelle :
        le poste dure 1 mois, avec 7 jours après la nomination pour créer son épreuve. Les <b>sentinelles du Kromadex</b> modèrent.
        Le poste d'<b>Invocatrice des couleurs</b> est unique.
      </p>
      <BarreRecherche valeur={recherche} onChange={setRecherche} />
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button type="button" className={!nouveaux ? 'btn' : 'btn alt'} style={puceFiltre()} onClick={() => setNouveaux(false)}>Tous</button>
        <button type="button" className={nouveaux ? 'btn' : 'btn alt'} style={puceFiltre()} onClick={() => setNouveaux(true)}>Nouveaux (7 derniers jours)</button>
      </div>
      {message && <small>{message}</small>}
      {!recherche.trim() && !nouveaux && <small style={aide}>Écris un pseudo pour trouver un membre, ou affiche les nouveaux membres.</small>}

      {visibles.map((u) => (
        <div key={u.id} style={ligneCarte}>
          <Pseudo x={u} />
          <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>
            niv. {u.level || 1} · {u.xp || 0} XP{u.created_at ? ` · ${accord(u.genre, 'inscrite', 'inscrit')} le ${inscriteLe(u)}` : ''}
          </small>
          {u.role === 'admin' || !estAdmin ? (
            <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: couleurPoste(u.role) }}>
              {u.role === 'admin' && <Crown size={14} />} {nomPoste(u.role, u.genre)}{u.title ? ` · ${u.title}` : ''}
            </small>
          ) : (
            <>
              <label style={champ}>Poste
                <Deroulant titre="Poste" value={u.role || 'coloriste'} onChange={(v) => modifier(u.id, { role: v })}
                  options={POSTES.map((p) => ({ valeur: p.valeur, label: p.label }))} />
              </label>
              {u.role === 'cheffe' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <small style={aide}>
                    {u.cheffe_expires_at ? `Cheffe jusqu'au ${new Date(u.cheffe_expires_at).toLocaleDateString('fr-CA')}, puis retour automatique à Coloriste` : 'Cheffe'}
                  </small>
                  <button type="button" className="btn alt" style={{ minHeight: '44px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => modifier(u.id, { prolonger: true })}>
                    <CalendarPlus size={14} aria-hidden="true" /> Prolonger d'un mois
                  </button>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, minHeight: '44px' }}>
                <input type="checkbox" checked={Boolean(u.pionnier)} onChange={(e) => modifier(u.id, { pionnier: e.target.checked })} style={{ width: '20px', height: '20px', margin: 0 }} />
                {nomPionnier(u.genre)} (bêta-testrice ou bêta-testeur, débloque le cadre)
              </label>
              {paye(u) && (
                <small style={aide}>
                  {accord(u.genre, 'Abonnée', 'Abonné')} Kromadex+ {u.plus_statut === 'annule' ? 'jusqu’au' : 'renouvelé vers le'} {new Date(u.plus_jusqu).toLocaleDateString('fr-CA')}
                </small>
              )}
            </>
          )}
        </div>
      ))}
      {(recherche.trim() || nouveaux) && !visibles.length && <p style={aide}>Aucun membre trouvé.</p>}
    </div>
  );
}

function ListeUtilisateurs({ membres }) {
  const [recherche, setRecherche] = useState('');
  const q = recherche.trim().toLowerCase().replace(/^@/, '');
  const visibles = membres.filter((u) => !q || [u.pseudo, u.name].some((x) => (x || '').toLowerCase().includes(q)));
  return (
    <div className="carte" style={colonne}>
      <b>{membres.length} utilisateur{membres.length > 1 ? 's' : ''}</b>
      <BarreRecherche valeur={recherche} onChange={setRecherche} />
      {visibles.map((u) => (
        <Link key={u.id} href={`/membre/${u.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '52px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--bordure-carte)', paddingBottom: '6px', minWidth: 0 }}>
          <Avatar x={{ ...u, auteur_id: u.id }} taille={36} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block' }}><Pseudo x={u} /></span>
            <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>
              {u.name && u.pseudo ? `${u.name} · ` : ''}{nomPoste(u.role, u.genre)} · niv. {u.level || 1}{u.created_at ? ` · ${accord(u.genre, 'inscrite', 'inscrit')} le ${inscriteLe(u)}` : ''}
            </small>
          </span>
        </Link>
      ))}
      {!visibles.length && <p style={aide}>Aucun membre trouvé.</p>}
    </div>
  );
}

export default function Membres({ role }) {
  const estAdmin = role === 'admin';
  const [membres, setMembres] = useState([]);
  const [vue, setVue] = useState('attribution');

  async function charger() {
    const res = await fetch('/api/roles');
    if (res.ok) setMembres((await res.json()).users || []);
  }
  useEffect(() => { charger(); }, []);

  const VUES = [
    ['attribution', 'Attribution des postes', UserCog],
    estAdmin && ['plus', 'Offrir Kromadex+', Gift],
    ['liste', 'Liste des utilisateurs', Users],
  ].filter(Boolean);

  return (
    <div style={colonne}>
      <div role="tablist" aria-label="Postes" style={{ display: 'grid', gridTemplateColumns: `repeat(${VUES.length}, minmax(0, 1fr))`, gap: '6px' }}>
        {VUES.map(([cle, label, Icone]) => (
          <button key={cle} type="button" role="tab" aria-selected={vue === cle} onClick={() => setVue(cle)} className={vue === cle ? 'btn' : 'btn alt'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '54px', padding: '6px 4px', fontSize: '0.78rem', lineHeight: 1.2, minWidth: 0, overflowWrap: 'normal', wordBreak: 'normal' }}>
            <Icone size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {vue === 'attribution' && <Attribution membres={membres} estAdmin={estAdmin} recharger={charger} />}
      {vue === 'plus' && estAdmin && <KromadexPlus membres={membres} />}
      {vue === 'liste' && <ListeUtilisateurs membres={membres} />}
    </div>
  );
}
