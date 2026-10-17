'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Crown, CalendarPlus } from 'lucide-react';
import { envoyer, colonne, ligneCarte, champ, aide } from './outils';
import { nomPionnier } from '@/lib/cadres';
import { nomPoste, couleurPoste } from '@/lib/postes';
import Pseudo from '@/components/Pseudo';

const POSTES = [
  { valeur: 'coloriste', label: 'Coloriste' },
  { valeur: 'cheffe', label: 'Chef.fe des coloristes (1 mois)' },
  { valeur: 'modo', label: 'Sentinelle du Kromadex' },
];

// Attribuer les postes et le rôle Pionnière (le titre affiché, c'est la personne qui le choisit dans ses Paramètres)
export default function Membres({ role }) {
  const [membres, setMembres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const [message, setMessage] = useState('');
  const estAdmin = role === 'admin';

  async function charger() {
    const res = await fetch('/api/roles');
    if (res.ok) {
      const d = await res.json();
      setMembres(d.users || []);
    }
  }
  useEffect(() => { charger(); }, []);

  const visibles = useMemo(() => {
    const q = recherche.toLowerCase();
    return membres.filter((u) =>
      ((u.email || '').toLowerCase().includes(q) || (u.pseudo || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q))
      && (filtre === 'tous' || u.role === filtre));
  }, [membres, recherche, filtre]);

  // Abonnement Kromadex+ payé (affiché seulement)
  const paye = (u) => u.plus_jusqu && new Date(u.plus_jusqu) > new Date() && u.plus_statut !== 'aucun';

  async function modifier(id, corps) {
    const r = await envoyer('/api/roles', 'PUT', { targetUserId: id, ...corps });
    setMessage(r.ok ? 'Enregistré' : r.error);
    charger();
  }

  return (
    <div className="carte" style={colonne}>
      <p style={aide}>
        Tout le monde est <b>coloriste</b> par défaut. Le ou la <b>chef.fe des coloristes</b> a gagné une épreuve mensuelle :
        le poste dure 1 mois, avec 7 jours après la nomination pour créer son épreuve. Les <b>sentinelles du Kromadex</b> modèrent.
        Le poste d'<b>Invocatrice des couleurs</b> est unique.
      </p>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
        <input placeholder="Rechercher un membre" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ width: '100%', paddingLeft: '36px' }} />
      </div>
      <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
        <option value="tous">Tous les postes</option>
        <option value="admin">Invocatrice des couleurs</option>
        <option value="modo">Sentinelles du Kromadex</option>
        <option value="cheffe">Cheffes</option>
        <option value="coloriste">Coloristes</option>
      </select>
      {message && <small>{message}</small>}

      {visibles.map((u) => (
        <div key={u.id} style={ligneCarte}>
          <Pseudo x={u} />
          <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>
            {u.email} · niv. {u.level || 1} · {u.xp || 0} XP
          </small>
          {u.role === 'admin' || !estAdmin ? (
            <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: couleurPoste(u.role) }}>
              {u.role === 'admin' && <Crown size={14} />} {nomPoste(u.role, u.genre)}{u.title ? ` · ${u.title}` : ''}
            </small>
          ) : (
            <>
              <label style={champ}>Poste
                <select value={u.role || 'coloriste'} onChange={(e) => modifier(u.id, { role: e.target.value })}>
                  {POSTES.map((p) => <option key={p.valeur} value={p.valeur}>{p.label}</option>)}
                </select>
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
                {nomPionnier(u.genre)} (bêta-testrice ou bêta-testeur, débloque le cadre ; Kromadex+ s’offre dans l’onglet Kromadex+)
              </label>
              {/* Kromadex+ offert : dans l'onglet Kromadex+ ; ici on voit seulement les abonnements payés */}
              {paye(u) && (
                <small style={aide}>
                  Abonné.e Kromadex+ {u.plus_statut === 'annule' ? 'jusqu’au' : 'renouvelé vers le'} {new Date(u.plus_jusqu).toLocaleDateString('fr-CA')}
                </small>
              )}
            </>
          )}
        </div>
      ))}
      {!visibles.length && <p style={aide}>Aucun membre trouvé.</p>}
    </div>
  );
}
