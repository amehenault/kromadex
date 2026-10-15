import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import Link from 'next/link';
import ListeTomes from './listeTomes';
import RolesPanel from '@/components/roles/RolesPanel';
import { Edit3, User, Award, BookOpen, Sparkles, Palette, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const authUser = await getUser();
  if (!authUser) redirect('/login');

  const profile = await getUserProfile(authUser.id);
  const userIdStr = String(authUser.id);

  // Récupération des tomes et jointure avec les couvertures enregistrées
  const resultats = await sql`
    SELECT 
      p.tome, 
      COUNT(p.id)::int AS nb_pages,
      tc.updated_at AS cover_updated
    FROM pages p
    LEFT JOIN tome_covers tc ON tc.user_id = ${userIdStr} AND tc.tome_name = p.tome
    WHERE p.user_id = ${authUser.id} AND p.tome IS NOT NULL AND p.tome != ''
    GROUP BY p.tome, tc.updated_at
    ORDER BY p.tome ASC
  `;

  const tomesData = resultats.map((r) => ({
    nom: r.tome,
    nbPages: r.nb_pages,
    totalTomePages: 100,
    hasCover: !!r.cover_updated,
    timestamp: r.cover_updated ? new Date(r.cover_updated).getTime() : Date.now()
  }));

  const xpActuel = profile?.xp || 0;
  const niveauActuel = profile?.level || 1;

  const nomAffiche = profile?.name || 'Amélie Hénault';
  const pseudoAffiche = profile?.pseudo || 'amelacreative';
  const roleAffiche = (profile?.role || 'coloriste').toUpperCase();

  return (
    <div className="contenu" style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-4)' }}>
      
      <div className="barre" style={{ marginBottom: 'var(--espace-4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/" className="btn alt" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Retour
        </Link>
        <h2 style={{ margin: 0 }}>Profil & Progression</h2>
      </div>

      {/* Carte d'en-tête du profil */}
      <div style={{
        background: 'var(--fond-carte)',
        borderRadius: 'var(--rayon-l)',
        padding: 'var(--espace-5)',
        boxShadow: 'var(--ombre)',
        border: '1px solid var(--bordure-carte)',
        marginBottom: 'var(--espace-4)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <Link 
          href="/profil/edit" 
          aria-label="Modifier les identifiants"
          style={{
            position: 'absolute',
            top: 'var(--espace-3)',
            right: 'var(--espace-3)',
            background: 'var(--carte)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: 'var(--texte-principal)',
            cursor: 'pointer'
          }}
        >
          <Edit3 size={18} />
        </Link>

        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto var(--espace-3)' }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'var(--carte)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--texte-secondaire)'
          }}>
            <User size={48} />
          </div>
          <span style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-primaire)',
            color: 'var(--blanc)',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: 'var(--rayon-s)',
            whiteSpace: 'nowrap'
          }}>
            NIV. {niveauActuel}
          </span>
        </div>

        <h2 style={{ margin: 'var(--espace-1) 0', color: 'var(--texte-principal)' }}>
          {nomAffiche}
        </h2>
        <p style={{ margin: '0 0 4px', color: 'var(--texte-secondaire)', fontSize: '0.95rem', fontWeight: 'bold' }}>
          @{pseudoAffiche}
        </p>
        <p style={{ margin: 0, color: 'var(--accent-primaire)', fontSize: '0.85rem', fontWeight: 'bold' }}>
          Rôle : {roleAffiche}
        </p>
      </div>

      {/* Carte Titre */}
      <div style={{
        background: 'var(--accent-doux)',
        borderRadius: 'var(--rayon-m)',
        padding: 'var(--espace-3) var(--espace-4)',
        border: '1px solid var(--bordure-carte)',
        textAlign: 'center',
        marginBottom: 'var(--espace-4)'
      }}>
        <small style={{ 
          textTransform: 'uppercase', 
          fontWeight: 'bold', 
          color: 'var(--accent-primaire)',
          fontSize: '0.75rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: 'var(--espace-1)'
        }}>
          <Sparkles size={14} /> Titre <Sparkles size={14} />
        </small>
        <h3 style={{ margin: 0, color: 'var(--texte-principal)' }}>
          {profile?.title || 'Coloriste débutant'}
        </h3>
      </div>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 'var(--espace-3)',
        marginBottom: 'var(--espace-4)'
      }}>
        <div style={{
          background: 'var(--fond-carte)',
          borderRadius: 'var(--rayon-m)',
          padding: 'var(--espace-3)',
          textAlign: 'center',
          border: '1px solid var(--bordure-carte)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Award size={22} style={{ color: 'var(--accent-primaire)' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--texte-principal)' }}>{xpActuel}</div>
          <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem', textTransform: 'uppercase' }}>XP Total</small>
        </div>

        <div style={{
          background: 'var(--fond-carte)',
          borderRadius: 'var(--rayon-m)',
          padding: 'var(--espace-3)',
          textAlign: 'center',
          border: '1px solid var(--bordure-carte)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <BookOpen size={22} style={{ color: 'var(--accent-primaire)' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--texte-principal)' }}>{tomesData.length}</div>
          <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tomes</small>
        </div>
      </div>

      {/* Accès direct à la collection de crayons */}
      <div style={{ marginBottom: 'var(--espace-4)' }}>
        <Link 
          href="/profil/collection" 
          className="btn"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            gap: 'var(--espace-2)',
            fontSize: '1rem',
            padding: 'var(--espace-3)',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <Palette size={20} /> Ma collection de crayons
        </Link>
      </div>

      {/* Liste des tomes */}
      <div className="carte" style={{ marginBottom: 'var(--espace-4)' }}>
        <h3 style={{ marginTop: 0 }}>Liste de mes tomes</h3>
        <ListeTomes tomesInitiaux={tomesData} />
      </div>

      {/* Panneaux Rôles & Titres (Admins & Modos) */}
      {(profile?.role === 'admin' || profile?.role === 'modo') && (
        <RolesPanel />
      )}
    </div>
  );
}