import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getUserProfile } from '@/lib/user';
import { progressionNiveau } from '@/lib/niveaux';
import { titreNiveau } from '@/lib/titres';
import { typesVisibles, nomBibliotheque } from '@/lib/typesColoriage';
import { couleurPoste } from '@/lib/postes';
import Link from 'next/link';
import MesTomes from './mesTomes';
import { listerMesTomes } from '@/lib/mesTomes';
import {
  Edit3,
  User,
  BookOpen,
  Sparkles,
  Palette,
  ArrowLeft,
  Shield,
  Trophy,
  HelpCircle,
  Users,
  BarChart3,
  Newspaper,
  Images,
  Map,
  Swords,
  ChevronRight,
  Paintbrush,
  Compass,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { recompensesDe } from '@/lib/recompensesServeur';
import { rappelsDuJour } from '@/lib/planification';
import MesRecompenses from '@/components/MesRecompenses';
import { verifierQuetes } from '@/lib/quetes';
import BoutonDeconnexion from './boutonDeconnexion';

export const dynamic = 'force-dynamic';

const NOM_POSTE = {
  admin: 'Invocatrice originelle',
  modo: 'Sentinelle du Kromadex',
  cheffe: 'Chef·fe des coloristes',
  coloriste: 'Coloriste',
};

export default async function ProfilPage() {
  const authUser = await getUser();

  if (!authUser) redirect('/login');

  // Quêtes : les XP des quêtes terminées sont donnés ici aussi (avant de lire le profil),
  // puis on garde les 2 quêtes non terminées les plus avancées (en pourcentage, puis le moins de reste)
  const { liste: quetes } = await verifierQuetes(authUser.id);

  const profile = await getUserProfile(authUser.id);

  // Admin : nombre de demandes d'aide à traiter (nouvelles ou en cours)
  const demandesATraiter = profile?.role === 'admin'
    ? (await sql`SELECT count(*)::int AS n FROM demandes WHERE statut IN ('nouvelle', 'en_cours')`)[0].n
    : 0;

  // Récompenses des activités ; une relique complète donne un cadre de profil exclusif
  const recompenses = await recompensesDe(authUser.id);
  const cadreRelique = recompenses.some((r) => r.genre === 'relique');
  // Invocatrice : activités à planifier (le rappel revient chaque jour tant qu'elles ne le sont pas)
  const rappels = profile?.role === 'admin' ? await rappelsDuJour() : [];

  // Tomes du profil avec leur progression automatique
  const mesTomes = await listerMesTomes(authUser.id);
  const prochesQuetes = quetes
    .filter((q) => !q.terminee)
    .sort((a, b) => b.valeur / b.objectif - a.valeur / a.objectif || (a.objectif - a.valeur) - (b.objectif - b.valeur))
    .slice(0, 2);

  const xpActuel = profile?.xp || 0;
  const niv = progressionNiveau(xpActuel);
  const nomAffiche =
    profile?.name || profile?.pseudo || authUser.email;
  const pseudoAffiche = profile?.pseudo;
  const role = profile?.role || 'coloriste';

  const stat = {
    background: 'var(--fond-carte)',
    borderRadius: 'var(--rayon-m)',
    padding: '10px 8px',
    textAlign: 'center',
    border: '1px solid var(--bordure-carte)',
    minWidth: 0,
  };

  return (
    <div className="contenu">
      <div
        style={{
          marginBottom: 'var(--espace-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Link
          href="/"
          className="btn alt"
          aria-label="Retour à l'accueil"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>

        <h2
          style={{
            margin: 0,
            fontSize: '1.2rem',
            flex: 1,
            minWidth: 0,
          }}
        >
          Mon profil
        </h2>

        <Link
          href="/profil/edit"
          className="btn alt"
          aria-label="Modifier mon profil"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <Edit3 size={16} aria-hidden="true" />
        </Link>
      </div>

      {/* En-tête : avatar, nom, poste, niveau */}
      <div
        className="carte profil-identite"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: 'var(--espace-3)',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '0 0 auto',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--carte)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--texte-secondaire)',
              boxShadow: cadreRelique ? '0 0 0 3px #d4a017, 0 0 0 6px var(--fond-carte), 0 0 0 8px #d4a017' : 'none',
            }}
            title={cadreRelique ? 'Cadre de la relique' : undefined}
          >
            {profile?.a_avatar ? (
              <img
                src={`/api/user/avatar?v=${new Date(
                  profile.avatar_maj
                ).getTime()}`}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <User size={38} aria-hidden="true" />
            )}
          </div>

          <span
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-primaire)',
              color: 'var(--noir)',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: 'var(--rayon-s)',
              whiteSpace: 'nowrap',
            }}
          >
            NIV. {niv.niveau}
          </span>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <b
            style={{
              display: 'block',
              fontSize: '1.15rem',
              overflowWrap: 'anywhere',
            }}
          >
            {nomAffiche}
          </b>

          {pseudoAffiche && (
            <small
              style={{
                display: 'block',
                color: 'var(--texte-secondaire)',
                fontWeight: 'bold',
                overflowWrap: 'anywhere',
              }}
            >
              @{pseudoAffiche}
            </small>
          )}

          <small
            style={{
              display: 'block',
              color: couleurPoste(role),
              fontWeight: 'bold',
            }}
          >
            {NOM_POSTE[role]}
          </small>

          {/* Titre du niveau, accordé selon le genre ; on le touche pour voir tous les titres */}
          <Link
            href="/titres"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '44px',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: 'inherit',
            }}
          >
            <Sparkles
              size={13}
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
            {titreNiveau(niv.niveau, profile?.genre)}
          </Link>

          {/* Titre spécial attribué par l'admin (ex. Chef des coloristes) */}
          {profile?.title && profile.title !== 'Coloriste débutant' && (
            <small style={{ display: 'block', fontWeight: 600, color: 'var(--texte-secondaire)' }}>
              {profile.title}
            </small>
          )}
        </div>
      </div>

      {/* Niveau et statistiques */}
      <div
        className="carte profil-niveau"
        style={{ marginBottom: 'var(--espace-3)' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <b>Niveau {niv.niveau}</b>

          <small
            style={{
              color: 'var(--texte-secondaire)',
              fontWeight: 600,
            }}
          >
            {niv.max ? `${xpActuel} XP` : `${xpActuel} / ${niv.suivant} XP`}
          </small>
        </div>

        <div
          className="profil-xp-barre"
          role="progressbar"
          aria-label={niv.max ? 'Niveau maximum atteint' : 'Progression vers le niveau suivant'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={niv.pct}
        >
          <div
            className="profil-xp-remplissage"
            style={{ width: `${niv.pct}%` }}
          />
        </div>

        <small className="profil-xp-restant">
          {niv.max
            ? 'Niveau maximum atteint'
            : `Encore ${niv.reste} XP avant le niveau ${niv.niveau + 1}`}
        </small>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '8px',
            marginTop: 'var(--espace-3)',
          }}
        >
          <div style={stat}>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {xpActuel}
            </div>

            <small
              style={{
                color: 'var(--texte-secondaire)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
              }}
            >
              XP total
            </small>
          </div>

          <div style={stat}>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {mesTomes.length}
            </div>

            <small
              style={{
                color: 'var(--texte-secondaire)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
              }}
            >
              Tomes
            </small>
          </div>
        </div>
      </div>

      {/* Mémo de l'Invocatrice : activités à planifier */}
      {rappels.length > 0 && (
        <Link href="/activites-a-venir" className="carte"
          style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--espace-3)', border: '2px solid var(--danger)', color: 'inherit', textDecoration: 'none' }}>
          {rappels.map((r) => (
            <span key={r.cle} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--danger)', fontWeight: 700, fontSize: '0.92rem' }}>
              <AlertTriangle size={18} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: '1px' }} /> <span>{r.texte}</span>
            </span>
          ))}
        </Link>
      )}

      <MesRecompenses recompenses={recompenses} />

      {/* Les 2 quêtes les plus proches d'être réussies */}
      {prochesQuetes.length > 0 && (
        <div className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>Mes quêtes</h3>
            <Link href="/quetes" aria-label="Voir toutes les quêtes"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}>
              Toutes <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </div>
          {prochesQuetes.map((q) => (
            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <b style={{ fontSize: '0.92rem' }}>{q.titre}</b>
                <small style={{ flex: '0 0 auto', fontWeight: 700 }}>+{q.xp} XP</small>
              </div>
              <small style={{ color: 'var(--texte-secondaire)' }}>{q.description}</small>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="profil-xp-barre" style={{ flex: 1, margin: 0 }}>
                  <div className="profil-xp-remplissage" style={{ width: `${Math.round((q.valeur / q.objectif) * 100)}%` }} />
                </div>
                <small style={{ flex: '0 0 auto', fontWeight: 700 }}>{q.valeur} / {q.objectif}</small>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accès rapides */}
      <div className="profil-acces">
        {['admin', 'modo'].includes(role) && (
          <Link
            href="/profil/admin"
            className={
              role === 'admin'
                ? 'btn profil-acces-admin'
                : 'btn profil-acces-lien'
            }
          >
            <Shield size={22} aria-hidden="true" />
            <span>
              {role === 'admin' ? 'Espace de l’Invocatrice' : 'Espace sentinelle'}
              {role === 'admin' && demandesATraiter > 0 && ` · ${demandesATraiter} demande${demandesATraiter > 1 ? 's' : ''} à traiter`}
            </span>
          </Link>
        )}

        {role === 'admin' && (
          <Link
            href="/activites-a-venir"
            className="btn profil-acces-lien"
          >
            <CalendarClock size={22} aria-hidden="true" />
            <span>Activités à venir</span>
          </Link>
        )}

        {role === 'cheffe' && (
          <Link
            href="/profil/admin"
            className="btn profil-acces-lien"
          >
            <Trophy size={22} aria-hidden="true" />
            <span>
              Créer mon épreuve de chef·fe
              {profile?.cheffe_expires_at && (
                <small style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem' }}>
                  Cheffe jusqu&apos;au {new Date(profile.cheffe_expires_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                </small>
              )}
            </span>
          </Link>
        )}

        <Link
          href="/coloriages"
          className="btn profil-acces-lien"
        >
          <Images size={22} aria-hidden="true" />
          <span>Mes coloriages</span>
        </Link>

        <Link
          href="/profil/collection"
          className="btn profil-acces-lien"
        >
          <Palette size={22} aria-hidden="true" />
          <span>Ma collection de crayons</span>
        </Link>

        <Link
          href="/profil/tomes"
          className="btn profil-acces-lien"
        >
          <BookOpen size={22} aria-hidden="true" />
          <span>{nomBibliotheque(typesVisibles(profile?.types_pratiques, profile?.types_vus))}</span>
        </Link>

        {/* Suggestions de palettes : seulement pour les personnes qui font du Cozy colo */}
        {(profile?.types_pratiques || []).includes('cozy') && (
          <Link
            href="/palettes"
            className="btn profil-acces-lien"
          >
            <Paintbrush size={22} aria-hidden="true" />
            <span>Suggestions de palettes de couleurs</span>
          </Link>
        )}

        <Link
          href="/statistiques"
          className="btn profil-acces-lien"
        >
          <BarChart3 size={22} aria-hidden="true" />
          <span>Mes statistiques</span>
        </Link>

        <Link
          href="/quetes"
          className="btn profil-acces-lien"
        >
          <Map size={22} aria-hidden="true" />
          <span>Quêtes</span>
        </Link>

        <Link
          href="/aventures"
          className="btn profil-acces-lien"
        >
          <Compass size={22} aria-hidden="true" />
          <span>Aventures</span>
        </Link>

        <Link
          href="/combats"
          className="btn profil-acces-lien"
        >
          <Swords size={22} aria-hidden="true" />
          <span>Combats</span>
        </Link>

        <Link
          href="/nouveautes"
          className="btn profil-acces-lien"
        >
          <Newspaper size={22} aria-hidden="true" />
          <span>Nouveautés</span>
        </Link>

        <Link
          href={`/membre/${authUser.id}`}
          className="btn profil-acces-lien"
        >
          <Users size={22} aria-hidden="true" />
          <span>Mon profil public et mes abonnés</span>
        </Link>

        <Link
          href="/aide"
          className="btn profil-acces-lien"
        >
          <HelpCircle size={22} aria-hidden="true" />
          <span>Aide et demandes</span>
        </Link>

        <BoutonDeconnexion />
      </div>

      {/* Progression automatique de chaque tome */}
      <div
        className="carte"
        style={{ marginBottom: 'var(--espace-3)' }}
      >
        <h3 style={{ marginTop: 0 }}>Ma progression</h3>
        <MesTomes tomes={mesTomes} />
      </div>
    </div>
  );
}