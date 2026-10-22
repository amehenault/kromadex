'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dices, Pencil, Trash2 } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';
import { XP_QUETE_DESTIN } from '@/lib/destin';

// Quêtes du Destin en cours : pages tirées par la Roue du Destin, à colorier dans les 14 jours (10 XP).
// Une quête accomplie disparaît de la liste ; on peut aussi abandonner une quête.
export default function QuetesDuDestin({ quetes: initiales, titre = 'Quêtes du Destin' }) {
  const router = useRouter();
  const [quetes, setQuetes] = useState(initiales);

  async function abandonner(q) {
    if (!confirm(`Abandonner la quête « ${q.tome}, page ${q.page_no} » ? Elle disparaîtra sans donner d’XP.`)) return;
    const r = await fetch('/api/roue', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quete: q.id }) });
    if (r.ok) { setQuetes((l) => l.filter((x) => x.id !== q.id)); router.refresh(); }
  }

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
        <div key={q.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--bordure-carte)' }} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b style={{ fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{q.tome}, page {q.page_no}</b>
              <small style={{ flex: '0 0 auto', fontWeight: 700, color: 'var(--btn)' }}>+{XP_QUETE_DESTIN} XP</small>
            </div>
            <TempsRestant fin={q.fin} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              <Link href={`/pages/new?tome=${encodeURIComponent(q.tome)}&page=${q.page_no}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}>
                <Pencil size={14} aria-hidden="true" /> Ajouter ce coloriage
              </Link>
              <button type="button" onClick={() => abandonner(q)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem',
                  color: 'var(--texte-secondaire)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <Trash2 size={14} aria-hidden="true" /> Abandonner la quête
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
