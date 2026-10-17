'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Shield, Sparkles, ChevronRight, ScrollText, Check, Backpack } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import { FETES, NOMS_AVENTURES } from '@/lib/activites';

const ICONES = { expedition: Compass, epopee: Shield, prophetie: Sparkles };
const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Expéditions, épopées et prophéties en cours (et terminées depuis moins de 30 jours)
export default function ListeAventures() {
  const [donnees, setDonnees] = useState(null);

  useEffect(() => {
    fetch('/api/aventures').then((r) => (r.ok ? r.json() : null)).then((d) => setDonnees(d || { aventures: [], parchemins: 0 }));
  }, []);

  if (!donnees) return <p>Chargement…</p>;
  const { aventures, parchemins } = donnees;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Inventaire : les Parchemins du Destin (Kromadex+ en reçoit un chaque mois) */}
      {parchemins > 0 && (
        <div className="carte" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', background: 'var(--accent-doux)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primaire)' }}>
            <Backpack size={22} aria-hidden="true" />
          </span>
          <span style={{ minWidth: 0 }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Mon inventaire · <ScrollText size={16} aria-hidden="true" /> {parchemins} Parchemin{parchemins > 1 ? 's' : ''} du Destin
            </b>
            <small style={{ color: 'var(--texte-secondaire)' }}>Élimine une contrainte obligatoire lors d’une expédition, d’une épopée ou d’une prophétie.</small>
          </span>
        </div>
      )}
      {!aventures.length && (
        <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>
          Aucune aventure en cours. Les expéditions arrivent à chaque fête, les épopées à chaque saison et la prophétie une fois par année.
        </p>
      )}
      {aventures.map((a) => {
        const Icone = ICONES[a.genre];
        const fete = FETES.find((f) => f.valeur === a.fete);
        return (
          <Link key={a.id} href={`/aventures/${a.id}`} className="carte"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'inherit', textDecoration: 'none', opacity: a.terminee ? 0.7 : 1 }}>
            <span style={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', background: 'var(--carte)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--btn)' }}>
              <Icone size={22} aria-hidden="true" />
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--btn)' }}>{NOMS_AVENTURES[a.genre].singulier}{fete ? ` · ${fete.nom}` : ''}</small>
              <b style={{ overflowWrap: 'anywhere' }}>{a.titre}</b>
              <small style={{ color: 'var(--texte-secondaire)' }}>Du {jour(a.debut)} au {jour(a.fin)}{a.terminee ? ' · terminée' : ''}</small>
              {!a.terminee && <TempsRestant fin={a.fin_instant} />}
              {(a.mes_soumissions > 0 || a.inscrit) && (
                <small style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--btn)' }}>
                  <Check size={14} aria-hidden="true" /> {a.mes_soumissions ? `${a.mes_soumissions} coloriage${a.mes_soumissions > 1 ? 's' : ''} soumis` : 'Inscrit·e'}
                </small>
              )}
            </span>
            <ChevronRight size={20} aria-hidden="true" style={{ flex: '0 0 auto' }} />
          </Link>
        );
      })}
    </div>
  );
}
