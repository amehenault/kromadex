'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PartyPopper, CheckCircle2 } from 'lucide-react';
import { TempsRestant } from '@/components/Fuseau';

// Quêtes de fêtes (créées par l'admin) : on coche soi-même chaque étape
export default function QuetesFetes() {
  const router = useRouter();
  const [quetes, setQuetes] = useState([]);
  const [message, setMessage] = useState('');

  async function charger() {
    const r = await fetch('/api/quetes/etapes');
    if (r.ok) setQuetes((await r.json()).quetes || []);
  }
  useEffect(() => { charger(); }, []);

  async function cocher(q, i) {
    setMessage('');
    const r = await fetch('/api/quetes/etapes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queteId: q.id, etape: i }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMessage(d.error || 'Erreur'); return; }
    if (d.xp) { setMessage(`Quête « ${q.titre} » terminée : +${d.xp} XP`); router.refresh(); }
    charger();
  }

  if (!quetes.length) return null;

  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '12px', border: '2px solid var(--btn)' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
        <PartyPopper size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Quêtes de fêtes
      </b>
      {message && <small style={{ fontWeight: 700 }}>{message}</small>}
      {quetes.map((q) => (
        <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ minWidth: 0 }}>
              <small style={{ textTransform: 'uppercase', fontWeight: 700, color: 'var(--texte-secondaire)' }}>{q.fete}</small>
              <b style={{ display: 'block' }}>{q.titre}</b>
            </span>
            <small style={{ flex: '0 0 auto', fontWeight: 700, color: 'var(--btn)' }}>+{q.xp} XP</small>
          </div>
          {q.description && <small style={{ whiteSpace: 'pre-wrap' }}>{q.description}</small>}
          {q.fin_instant && !q.terminee && <TempsRestant fin={q.fin_instant} />}
          {q.etapes.map((e, i) => {
            const fait = q.cochees.includes(i);
            return (
              <button key={i} type="button" onClick={() => cocher(q, i)} aria-pressed={fait}
                style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px' }}>
                {fait
                  ? <CheckCircle2 size={22} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
                  : <span aria-hidden="true" style={{ flex: '0 0 auto', width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--bordure-carte)' }} />}
                <span style={{ textDecoration: fait ? 'line-through' : 'none', overflowWrap: 'anywhere' }}>{e}</span>
              </button>
            );
          })}
          {q.terminee && <small style={{ fontWeight: 700, color: 'var(--btn)' }}>Quête terminée</small>}
        </div>
      ))}
    </section>
  );
}
