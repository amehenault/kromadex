'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Grid3x3, Users, Compass, Swords, Gavel } from 'lucide-react';
import CarteDefi from './carteDefi';
import Bingo from './bingo';
import DefisGroupe from './defisGroupe';
import ListeAventures from '@/app/aventures/liste';
import Combats from '@/app/combats/combats';
import VerdictsARendre from './verdictsARendre';

// Rôle de la personne qui crée chaque genre d'épreuve, pour le tri
const ROLE_DU_GENRE = { officiel: 'admin', modo: 'modo', cheffe: 'cheffe', groupe: 'communaute' };
const FILTRES_ROLE = [['tous', 'Toutes'], ['admin', 'Invocatrice'], ['modo', 'Sentinelles'], ['cheffe', 'Chef.fes'], ['communaute', 'Communauté']];

// Verdicts à rendre (vue par défaut), épreuves en cours (triables par rôle), bingos du mois, épreuves de groupe, aventures, combats
export default function Defis({ monId, integre }) {
  const [onglet, setOnglet] = useState('verdicts');
  const [aVoter, setAVoter] = useState(null);
  const [donnees, setDonnees] = useState(null);
  const [bingos, setBingos] = useState(null);
  const [role, setRole] = useState('tous');

  async function charger() {
    const [d, b] = await Promise.all([
      fetch('/api/defis').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/bingos').then((r) => (r.ok ? r.json() : null)),
    ]);
    setDonnees(d || { defis: [] });
    setBingos(b?.bingos || []);
  }
  useEffect(() => { charger(); }, []);

  const ONGLETS = [['mois', 'En cours', Trophy], ['bingos', 'Bingos', Grid3x3], ['groupe', 'De groupe', Users], ['aventures', 'Aventures', Compass], ['combats', 'Combats', Swords]];
  // Tri par rôle de la personne qui a créé l'épreuve
  const duMois = (donnees?.defis || []).filter((d) => role === 'tous' || ROLE_DU_GENRE[d.genre] === role);
  const groupe = (donnees?.defis || []).filter((d) => d.genre === 'groupe');

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: integre ? 0 : 'var(--espace-3)' }}>
      {!integre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Épreuves</h2>
        </div>
      )}

      {/* Grand bouton corail : les coloriages qui attendent mon verdict (vue par défaut) */}
      <button type="button" onClick={() => setOnglet('verdicts')} aria-pressed={onglet === 'verdicts'}
        className="btn btn-corail"
        style={{ width: '100%', minHeight: '52px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px',
          outline: onglet === 'verdicts' ? '3px solid var(--noir)' : 'none', outlineOffset: '-3px' }}>
        <Gavel size={20} aria-hidden="true" /> Verdicts à rendre{aVoter ? ` (${aVoter})` : ''}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone], i) => (
          <button key={cle} type="button" onClick={() => setOnglet(cle)} className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ gridColumn: i === ONGLETS.length - 1 && ONGLETS.length % 2 ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '54px', padding: '6px 4px', fontSize: '0.85rem', minWidth: 0 }}>
            <Icone size={18} /> {label}
          </button>
        ))}
      </div>

      {onglet === 'verdicts' && <VerdictsARendre onNombre={setAVoter} />}
      {!donnees && onglet !== 'verdicts' && <p>Chargement…</p>}

      {donnees && onglet === 'mois' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div role="group" aria-label="Trier par rôle" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FILTRES_ROLE.map(([cle, label]) => (
              <button key={cle} type="button" onClick={() => setRole(cle)} aria-pressed={role === cle} className={role === cle ? 'btn' : 'btn alt'}
                style={{ minHeight: '44px', borderRadius: '999px', fontSize: '0.85rem', padding: '4px 14px' }}>
                {label}
              </button>
            ))}
          </div>
          {!duMois.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucune épreuve en cours pour l'instant.</p>}
          {duMois.map((d) => <CarteDefi key={d.id} defi={d} monId={monId} onChange={charger} />)}
        </div>
      )}

      {donnees && onglet === 'bingos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!bingos.length && <p style={{ color: 'var(--texte-secondaire)' }}>Aucun bingo en cours.</p>}
          {bingos.map((b) => <Bingo key={b.id} bingo={b} />)}
        </div>
      )}

      {donnees && onglet === 'groupe' && <DefisGroupe defis={groupe} monId={monId} onChange={charger} />}
      {onglet === 'aventures' && <ListeAventures />}
      {onglet === 'combats' && <Combats integre />}
    </div>
  );
}
