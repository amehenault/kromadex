import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { progressionNiveau } from '@/lib/niveaux';
import Link from 'next/link';
import MesTomes from './mesTomes';
import { listerMesTomes } from '@/lib/mesTomes';
import { Edit3, User, BookOpen, Sparkles, Palette, ArrowLeft, Shield, Trophy, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NOM_POSTE = { admin: 'Admin', modo: 'Modératrice', cheffe: 'Cheffe des coloristes', coloriste: 'Coloriste' };

export default async function ProfilPage() {
  const authUser = await getUser();
  if (!authUser) redirect('/login');

  const profile = await getUserProfile(authUser.id);

  // Tomes du profil avec leur progression automatique
  const mesTomes = await listerMesTomes(authUser.id);

  const xpActuel = profile?.xp || 0;
  const niv = progressionNiveau(xpActuel);

  const nomAffiche = profile?.name || profile?.pseudo || authUser.email;
  const pseudoAffiche = profile?.pseudo;
  const role = profile?.role || 'coloriste';

  const bouton = {
    width: '100%', justifyContent: 'center', gap: 'var(--espace-2)', fontSize: '1rem',
    minHeight: '48px', display: 'inline-flex', alignItems: 'center',
  };
  const stat = {
    background: 'var(--fond-carte)', borderRadius: 'var(--rayon-m)', padding: '10px 8px', textAlign: 'center',
    border: '1px solid var(--bordure-carte)', minWidth: 0,
  };

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>

      <div style={{ marginBottom: 'var(--espace-3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center', flex: '0 0 auto' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem', flex: 1, minWidth: 0 }}>Mon profil</h2>
        <Link href="/profil/edit" className="btn alt" aria-label="Modifier mon profil" style={{ display: 'inline-flex', alignItems: 'center', flex: '0 0 auto' }}>
          <Edit3 size={16} />
        </Link>
      </div>

      {/* En-tête : avatar, nom, poste, niveau */}
      <div className="carte" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 'var(--espace-3)' }}>
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: 'var(--carte)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texte-secondaire)',
          }}>
            {profile?.a_avatar
              ? <img src={`/api/user/avatar?v=${new Date(profile.avatar_maj).getTime()}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={38} />}
          </div>
          <span style={{
            position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--accent-primaire)', color: 'var(--blanc)', fontSize: '0.7rem', fontWeight: 'bold',
            padding: '2px 8px', borderRadius: 'var(--rayon-s)', whiteSpace: 'nowrap',
          }}>
            NIV. {niv.niveau}
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b style={{ display: 'block', fontSize: '1.15rem', overflowWrap: 'anywhere' }}>{nomAffiche}</b>
          {pseudoAffiche && <small style={{ display: 'block', color: 'var(--texte-secondaire)', fontWeight: 'bold' }}>@{pseudoAffiche}</small>}
          <small style={{ display: 'block', color: 'var(--accent-primaire)', fontWeight: 'bold' }}>{NOM_POSTE[role]}</small>
          <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
            <Sparkles size={13} /> {profile?.title || 'Coloriste débutant'}
          </small>
        </div>
      </div>

      {/* Niveau et statistiques */}
      <div className="carte" style={{ marginBottom: 'var(--espace-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <b>Niveau {niv.niveau}</b>
          <small style={{ color: 'var(--texte-secondaire)', fontWeight: 600 }}>{xpActuel} / {niv.suivant} XP</small>
        </div>
        <div style={{ height: '10px', borderRadius: '999px', background: 'var(--carte)', overflow: 'hidden', margin: '6px 0 4px' }}>
          <div style={{ width: `${niv.pct}%`, height: '100%', background: 'var(--btn)' }} />
        </div>
        <small style={{ color: 'var(--texte-secondaire)' }}>Encore {niv.suivant - xpActuel} XP avant le niveau {niv.niveau + 1}</small>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: 'var(--espace-3)' }}>
          <div style={stat}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{xpActuel}</div>
            <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem', textTransform: 'uppercase' }}>XP total</small>
          </div>
          <div style={stat}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{mesTomes.length}</div>
            <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tomes</small>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' }}>
        {['admin', 'modo'].includes(role) && (
          <Link href="/profil/admin" className="btn" style={bouton}>
            <Shield size={20} /> {role === 'admin' ? 'Espace admin' : 'Espace modo'}
          </Link>
        )}
        {role === 'cheffe' && (
          <Link href="/profil/admin" className="btn" style={bouton}>
            <Trophy size={20} /> Choisir le prochain défi
          </Link>
        )}
        <Link href="/profil/collection" className="btn" style={bouton}>
          <Palette size={20} /> Ma collection de crayons
        </Link>
        <Link href="/profil/tomes" className="btn" style={bouton}>
          <BookOpen size={20} /> Mes tomes de coloriage
        </Link>
        <Link href="/aide" className="btn alt" style={bouton}>
          <HelpCircle size={20} /> Aide et demandes
        </Link>
      </div>

      {/* Progression automatique de chaque tome */}
      <div className="carte" style={{ marginBottom: 'var(--espace-3)' }}>
        <h3 style={{ marginTop: 0 }}>Ma progression</h3>
        <MesTomes tomes={mesTomes} />
      </div>
    </div>
  );
}
