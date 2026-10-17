import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Compass, Palette, Heart, MessageCircle, BookOpen, Flame, CheckCircle2, Sparkles } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { CATEGORIES_QUETES, verifierQuetes } from '@/lib/quetes';
import QuetesFetes from './quetesFetes';

export const dynamic = 'force-dynamic';

const ICONES = { Compass, Palette, Heart, MessageCircle, BookOpen, Flame };

// Quêtes globales : la progression se calcule toute seule, les XP sont donnés à la fin de chaque quête
export default async function QuetesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const { liste, nouvelles } = await verifierQuetes(user.id);
  const faites = liste.filter((q) => q.terminee).length;
  const xpGagnes = liste.filter((q) => q.terminee).reduce((s, q) => s + q.xp, 0);

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Quêtes</h2>
      </div>

      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)' }}>
        {faites} / {liste.length} quêtes terminées · {xpGagnes} XP gagnés
      </p>

      {nouvelles.length > 0 && (
        <div className="carte" style={{ border: '2px solid var(--btn)', marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={18} aria-hidden="true" /> Quête{nouvelles.length > 1 ? 's' : ''} terminée{nouvelles.length > 1 ? 's' : ''} !</b>
          {nouvelles.map((q) => <small key={q.id}>{q.titre} : +{q.xp} XP</small>)}
        </div>
      )}

      <QuetesFetes />

      {CATEGORIES_QUETES.map((c) => {
        const Icone = ICONES[c.icone];
        const quetes = liste.filter((q) => q.categorie === c.cle);
        return (
          <section key={c.cle} className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              <Icone size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {c.label}
              <small style={{ marginLeft: 'auto', color: 'var(--texte-secondaire)' }}>{quetes.filter((q) => q.terminee).length} / {quetes.length}</small>
            </b>
            {quetes.map((q) => (
              <div key={q.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', opacity: q.terminee ? 0.75 : 1 }}>
                {q.terminee
                  ? <CheckCircle2 size={20} aria-label="Terminée" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
                  : <span style={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--bordure-carte)' }} aria-hidden="true" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <b style={{ fontSize: '0.92rem', overflowWrap: 'anywhere' }}>{q.titre}</b>
                    <small style={{ flex: '0 0 auto', fontWeight: 700, color: 'var(--btn)' }}>+{q.xp} XP</small>
                  </div>
                  <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>{q.description}</small>
                  {!q.terminee && q.objectif > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: 'var(--carte)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((q.valeur / q.objectif) * 100)}%`, height: '100%', background: 'var(--btn)' }} />
                      </div>
                      <small style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }}>{q.valeur} / {q.objectif}</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
