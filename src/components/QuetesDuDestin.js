import Link from 'next/link';
import { Dices, CheckCircle2, Pencil } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import { XP_QUETE_DESTIN } from '@/lib/quetesDestin';

// Quêtes du Destin : pages tirées par la Roue du Destin, à colorier dans les 14 jours (10 XP)
export default function QuetesDuDestin({ quetes, titre = 'Quêtes du Destin' }) {
  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
        <Dices size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre}
      </b>
      {!quetes.length && (
        <small style={{ color: 'var(--texte-secondaire)' }}>
          Fais tourner la <Link href="/roue" style={{ color: 'inherit', fontWeight: 700 }}>Roue du Destin</Link> et ajoute la page tirée à tes quêtes :
          tu as 14 jours pour la colorier et gagner {XP_QUETE_DESTIN} XP.
        </small>
      )}
      {quetes.map((q) => (
        <div key={q.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', opacity: q.termine_le ? 0.75 : 1 }}>
          {q.termine_le
            ? <CheckCircle2 size={20} aria-label="Terminée" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            : <span style={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--bordure-carte)' }} aria-hidden="true" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b style={{ fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{q.tome}, page {q.page_no}</b>
              <small style={{ flex: '0 0 auto', fontWeight: 700, color: 'var(--btn)' }}>+{XP_QUETE_DESTIN} XP</small>
            </div>
            {q.termine_le ? (
              <small style={{ color: 'var(--texte-secondaire)' }}>Terminée : la page choisie par le Destin est coloriée</small>
            ) : (
              <>
                <TempsRestant fin={q.fin} />
                <Link href={`/pages/new?tome=${encodeURIComponent(q.tome)}&page=${q.page_no}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}>
                  <Pencil size={14} aria-hidden="true" /> Ajouter ce coloriage
                </Link>
              </>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
