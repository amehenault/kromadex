'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Bell, BellOff } from 'lucide-react';
import Pseudo from '@/components/Pseudo';
import { PAYS } from '@/lib/pays';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';
import { envoyer, colonne, ligneCarte, aide } from './outils';

const nomPays = (v) => PAYS.find((p) => p.valeur === v)?.label || '';
const nomTypes = (l) => (l || []).map((v) => TYPES_COLORIAGE.find((t) => t.valeur === v)?.label).filter(Boolean).join(', ');
const quand = (iso) => new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Lancement : les personnes inscrites (les plus récentes en premier), les totaux,
// et une case pour recevoir ou non une notification à chaque nouvelle inscription
export default function Lancement() {
  const [donnees, setDonnees] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/lancement');
    if (r.ok) setDonnees(await r.json());
  }
  useEffect(() => { charger(); }, []);

  async function basculerNotif(actif) {
    setDonnees((d) => ({ ...d, notif: actif }));
    const r = await envoyer('/api/user/parametres', 'POST', { notifs: { inscriptions: actif } });
    setMessage(r.ok ? (actif ? 'Notifications des inscriptions activées.' : 'Notifications des inscriptions désactivées.') : r.error);
  }

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const tous = donnees?.inscrits || [];
    return q ? tous.filter((u) => [u.pseudo, u.name, u.email].some((x) => (x || '').toLowerCase().includes(q))) : tous;
  }, [donnees, recherche]);

  if (!donnees) return <p>Chargement…</p>;
  const { totaux } = donnees;

  return (
    <div style={colonne}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
        {[['Aujourd’hui', totaux.aujourdhui], ['7 derniers jours', totaux.semaine], ['En tout', totaux.tous]].map(([label, n]) => (
          <div key={label} className="carte" style={{ margin: 0, textAlign: 'center', padding: '10px 4px', minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: '1.4rem' }}>{n}</b>
            <small style={{ ...aide, fontSize: '0.78rem' }}>{label}</small>
          </div>
        ))}
      </div>

      <label className="carte" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, cursor: 'pointer', minHeight: '48px' }}>
        <input type="checkbox" checked={donnees.notif} onChange={(e) => basculerNotif(e.target.checked)} style={{ width: '22px', height: '22px', flex: '0 0 auto' }} />
        {donnees.notif ? <Bell size={18} aria-hidden="true" /> : <BellOff size={18} aria-hidden="true" />}
        <span style={{ minWidth: 0 }}>
          <b style={{ display: 'block' }}>Me prévenir à chaque nouvelle inscription</b>
          <small style={aide}>Notification push sur tes appareils où les notifications sont activées.</small>
        </span>
      </label>
      {message && <small>{message}</small>}

      <div className="carte" style={colonne}>
        <b>Personnes inscrites ({liste.length})</b>
        <div style={{ position: 'relative' }}>
          <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
          <input placeholder="Rechercher (pseudo, nom ou courriel)" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }} aria-label="Rechercher une personne inscrite" />
        </div>
        {liste.map((u) => (
          <div key={u.id} style={ligneCarte}>
            <Pseudo x={u} />
            {u.name && <small style={{ overflowWrap: 'anywhere' }}>{u.name}</small>}
            <small style={{ ...aide, overflowWrap: 'anywhere' }}>{u.email}</small>
            <small style={{ fontWeight: 600 }}>Inscription le {quand(u.created_at)}</small>
            {(nomPays(u.pays) || nomTypes(u.types_pratiques)) && (
              <small style={{ ...aide, overflowWrap: 'anywhere' }}>{[nomPays(u.pays), nomTypes(u.types_pratiques)].filter(Boolean).join(' · ')}</small>
            )}
          </div>
        ))}
        {!liste.length && <p style={aide}>{recherche ? 'Aucune personne trouvée.' : 'Personne ne s’est encore inscrit.'}</p>}
      </div>
    </div>
  );
}
