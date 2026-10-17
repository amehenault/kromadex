import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { SEUILS, calculerNiveau } from '@/lib/niveaux';
import { TITRES } from '@/lib/titres';

export const dynamic = 'force-dynamic';

// Les 62 titres, un par niveau, accordés selon le genre du profil
export default async function TitresPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const profil = await getUserProfile(user.id);
  const niveau = calculerNiveau(profil?.xp);
  const forme = profil?.genre === 'feminin' ? 1 : 0;

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Les titres</h2>
      </div>
      <p style={{ color: 'var(--texte-secondaire)', marginTop: 0 }}>
        Chaque niveau débloque un nouveau titre. Tu es au niveau {niveau} avec {profil?.xp || 0} XP.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {TITRES.map((t, i) => {
          const n = i + 1;
          const obtenu = n <= niveau;
          const actuel = n === niveau;
          return (
            <li key={n} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--rayon-m)',
              background: 'var(--fond-carte)', border: actuel ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)',
              opacity: obtenu ? 1 : 0.6, minWidth: 0,
            }}>
              <span style={{ flex: '0 0 auto', width: '28px', textAlign: 'center', fontWeight: 800 }}>{n}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{t[forme]}</b>
                <small style={{ color: 'var(--texte-secondaire)' }}>{SEUILS[i].toLocaleString('fr-CA')} XP</small>
              </span>
              {actuel ? <Sparkles size={18} aria-label="Titre actuel" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
                : obtenu ? <CheckCircle2 size={18} aria-label="Obtenu" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
                  : <Lock size={16} aria-label="À débloquer" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
