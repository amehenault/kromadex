import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getUserProfile } from '@/lib/user';
import { progressionNiveau } from '@/lib/niveaux';
import { titreNiveau } from '@/lib/titres';
import { typesVisibles, faitCozy, nomMesTomes, nomCollectionTomes } from '@/lib/typesColoriage';
import { couleurPoste, nomPoste } from '@/lib/postes';
import { aLire } from '@/lib/notifications';
import { parcheminDuMois, offertActif } from '@/lib/abonnement';
import { CADRES, cadresDebloques, cadreAffiche, nomPionnier } from '@/lib/cadres';
import PhotoCadre from '@/components/PhotoCadre';
import { badgePionnier, OBJETS } from '@/lib/recompenses';
import ModifierPseudo from './modifierPseudo';
import Link from 'next/link';
import { listerMesTomes } from '@/lib/mesTomes';
import {
  Settings,
  User,
  BookOpen,
  Sparkles,
  Palette,
  ArrowLeft,
  Shield,
  Trophy,
  HelpCircle,
  BarChart3,
  Mail,
  Images,
  Map,
  Swords,
  ChevronRight,
  Eye,
  TrendingUp,
  Paintbrush,
  Compass,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { recompensesDe } from '@/lib/recompensesServeur';
import { rappelsDuJour } from '@/lib/planification';
import MesRecompenses from '@/components/MesRecompenses';
import Inventaire from '@/components/Inventaire';
import BoutonDeconnexion from './boutonDeconnexion';
import { verifierQuetes } from '@/lib/quetes';
import { quetesDestin } from '@/lib/quetesDestin';
import QuetesDuDestin from '@/components/QuetesDuDestin';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const authUser = await getUser();

  if (!authUser) redirect('/login');

  // Quêtes : les XP des quêtes terminées sont donnés ici aussi (avant de lire le profil),
  // puis on garde les 2 quêtes non terminées les plus avancées (en pourcentage, puis le moins de reste)
  const { liste: quetes } = await verifierQuetes(authUser.id);
  // Quêtes du Destin (Roue du Destin) en cours
  const destin = (await quetesDestin(authUser.id)).filter((q) => !q.termine_le);

  const profile = await getUserProfile(authUser.id);
  // Pastilles : missives non lues et réponses de l'Invocatrice pas encore vues
  const nonLus = await aLire(authUser.id);

  // Admin : nombre de demandes d'aide à traiter (nouvelles ou en cours)
  const demandesATraiter = profile?.role === 'admin'
    ? (await sql`SELECT count(*)::int AS n FROM demandes WHERE statut IN ('nouvelle', 'en_cours')`)[0].n
    : 0;

  // Récompenses des activités ; une relique complète donne un cadre de profil exclusif
  await parcheminDuMois(authUser.id);
  const recompenses = await recompensesDe(authUser.id);
  // Cadre de profil : celui choisi dans Paramètres parmi ceux débloqués (relique complétée, Pionnière ou Pionnier)
  const cadre = cadreAffiche(profile?.cadre, cadresDebloques({ relique: recompenses.some((r) => r.genre === 'relique'), pionnier: profile?.pionnier, role: profile?.role }));
  // Invocatrice : activités à planifier (le rappel revient chaque jour tant qu'elles ne le sont pas)
  const rappels = profile?.role === 'admin' ? await rappelsDuJour() : [];

  // Nombre de tomes et livres (la progression détaillée est dans la page Ma progression)
  const mesTomes = await listerMesTomes(authUser.id);
  const visibles = typesVisibles(profile?.types_pratiques, profile?.types_vus);
  const voitMystere = visibles.includes('mystere');
  const voitCozy = visibles.includes('cozy');
  const prochesQuetes = quetes
    .filter((q) => !q.terminee)
    .sort((a, b) => b.valeur / b.objectif - a.valeur / a.objectif || (a.objectif - a.valeur) - (b.objectif - b.valeur))
    .slice(0, 2);

  const xpActuel = profile?.xp || 0;
  const niv = progressionNiveau(xpActuel);
  // Nom affiché : seulement celui choisi par la personne (le pseudo s'affiche à part, juste en dessous)
  const nomAffiche = profile?.name || '';
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
          href="/parametres"
          className="btn alt"
          aria-label="Paramètres"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flex: '0 0 auto',
          }}
        >
          <Settings size={16} aria-hidden="true" />
        </Link>
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
          {/* Photo dans son cadre (anneau ou cadre illustré de Pionnière et Pionnier) */}
          <PhotoCadre cadre={cadre} taille={72}>
            {(t) => (
              <div
                style={{
                  width: t,
                  height: t,
                  borderRadius: '50%',
                  background: 'var(--carte)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--texte-secondaire)',
                }}
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
                  <User size={Math.round(t * 0.53)} aria-hidden="true" />
                )}
              </div>
            )}
          </PhotoCadre>

          <span
            style={{
              position: 'absolute',
              // Sous un cadre illustré, la pastille descend sous le cadre pour ne pas cacher l'ornement du bas
              bottom: CADRES[cadre]?.image ? '-14px' : '-6px',
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
          {nomAffiche && (
            <b
              style={{
                display: 'block',
                fontSize: '1.15rem',
                overflowWrap: 'anywhere',
              }}
            >
              {nomAffiche}
            </b>
          )}

          {/* Pseudo dans la couleur du poste, modifiable à tout moment */}
          <ModifierPseudo pseudo={pseudoAffiche || ''} role={role} />

          <small
            style={{
              display: 'block',
              color: couleurPoste(role),
              fontWeight: 'bold',
            }}
          >
            {/* Pionnière ou Pionnier s'ajoute au poste (l'Invocatrice garde seulement son titre) */}
            {profile?.pionnier && role !== 'admin' && <>{nomPionnier(profile?.genre)} · </>}
            {nomPoste(role, profile?.genre)}
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

          {/* Titre spécial choisi par la personne dans ses Paramètres (ex. Cheffe des coloristes) */}
          {profile?.title && profile.title !== 'Coloriste débutant' && (
            <small style={{ display: 'block', fontWeight: 600, color: 'var(--texte-secondaire)' }}>
              {profile.title}
            </small>
          )}

          {/* Kromadex+ offert par l'Invocatrice : jusqu'à quand */}
          {role !== 'admin' && offertActif(profile) && (
            <small style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px', fontWeight: 600 }}>
              <img src="/kromadex-plus.svg" alt="Kromadex+" style={{ height: '14px', width: 'auto' }} />
              <span>
                offert par l’Invocatrice des couleurs · {profile.plus_offert_jusqu
                  ? `valable jusqu’au ${new Date(new Date(profile.plus_offert_jusqu) - 1).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' })}`
                  : 'sans date de fin'}
              </span>
            </small>
          )}

          {/* Profil public (abonnés, coloriages publiés) */}
          <Link href={`/membre/${authUser.id}`} className="btn alt"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', marginTop: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
            <Eye size={16} aria-hidden="true" /> Voir mon profil
          </Link>
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
              {voitMystere && voitCozy ? 'Tomes et livres' : voitCozy ? 'Livres' : 'Tomes'}
            </small>
          </div>
        </div>
      </div>

      <MesRecompenses recompenses={[...badgePionnier(profile), ...recompenses.filter((r) => !OBJETS.includes(r.genre))]}
        epingles={profile?.badges_epingles || []} modifiable
        vide="Tes badges, reliques et sceaux d’épreuves, de combats et d’aventures apparaîtront ici. Tu pourras en épingler 6 ; sinon les 6 plus récents s’affichent." />

      <Inventaire objets={recompenses.filter((r) => OBJETS.includes(r.genre) && !r.utilise)} />

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

      {/* Pages choisies par la Roue du Destin, à colorier */}
      {destin.length > 0 && <QuetesDuDestin quetes={JSON.parse(JSON.stringify(destin))} titre="Mes quêtes du Destin" />}

      {/* Accès rapides : Activités à venir, Statistiques, tomes, collections et palettes en premier.
          Chaque page ouverte porte exactement le même nom que son bouton. */}
      <div className="profil-acces">
        {['admin', 'modo'].includes(role) && (
          <Link
            href="/profil/admin"
            className="btn profil-acces-admin"
          >
            <Shield size={22} aria-hidden="true" />
            <span>
              {role === 'admin' ? 'Espace de l’Invocatrice' : 'Espace sentinelle'}
              {role === 'admin' && demandesATraiter > 0 && ` · ${demandesATraiter} demande${demandesATraiter > 1 ? 's' : ''} à traiter`}
            </span>
            {role === 'admin' && nonLus.demandes > 0 && <span className="pastille" aria-hidden="true" />}
          </Link>
        )}

        {role === 'admin' && (
          <Link href="/activites-a-venir" className="btn profil-acces-lien">
            <CalendarClock size={22} aria-hidden="true" />
            <span>Activités à venir</span>
          </Link>
        )}

        <Link href="/statistiques" className="btn profil-acces-lien">
          <BarChart3 size={22} aria-hidden="true" />
          <span>Mes statistiques</span>
        </Link>

        <Link href="/profil/progression" className="btn profil-acces-lien">
          <TrendingUp size={22} aria-hidden="true" />
          <span>{nomMesTomes(visibles)}</span>
        </Link>

        <Link href="/profil/tomes" className="btn profil-acces-lien">
          <BookOpen size={22} aria-hidden="true" />
          <span>{nomCollectionTomes(visibles)}</span>
        </Link>

        <Link href="/profil/collection" className="btn profil-acces-lien">
          <Palette size={22} aria-hidden="true" />
          <span>Ma collection de crayons</span>
        </Link>

        {/* Suggestions de palettes : seulement pour les personnes qui font du Cozy colo (ou un autre coloriage) */}
        {faitCozy(profile?.types_pratiques) && (
          <Link href="/palettes" className="btn profil-acces-lien">
            <Paintbrush size={22} aria-hidden="true" />
            <span>Palettes de couleurs</span>
          </Link>
        )}

        {role === 'cheffe' && (
          <Link
            href="/profil/admin"
            className="btn profil-acces-lien"
          >
            <Trophy size={22} aria-hidden="true" />
            <span>
              Créer mon épreuve de {profile?.genre === 'feminin' ? 'cheffe' : profile?.genre === 'masculin' ? 'chef' : 'chef.fe'}
              {profile?.cheffe_expires_at && (
                <small style={{ display: 'block', fontWeight: 400, fontSize: '0.75rem' }}>
                  Cheffe jusqu&apos;au {new Date(profile.cheffe_expires_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                </small>
              )}
            </span>
          </Link>
        )}

        {/* Kromadex+ : s'abonner, ou gérer son abonnement (carte, annulation) ; l'Invocatrice a déjà tout */}
        {role !== 'admin' && <Link
          href="/kromadex-plus"
          className="btn profil-acces-lien"
          aria-label="Kromadex+ : gérer l’abonnement"
        >
          <img src="/kromadex-plus.svg" alt="" style={{ height: '22px', width: 'auto', maxWidth: '100%' }} />
          <span>Gérer l’abonnement</span>
        </Link>}

        {role !== 'admin' && (
          <Link
            href="/aide"
            className="btn profil-acces-lien"
          >
            <HelpCircle size={22} aria-hidden="true" />
            <span>Aide</span>
            {nonLus.reponses > 0 && <span className="pastille" aria-hidden="true" />}
          </Link>
        )}

        <Link href="/coloriages" className="btn profil-acces-lien">
          <Images size={22} aria-hidden="true" />
          <span>Mes coloriages</span>
        </Link>

        <Link href="/quetes" className="btn profil-acces-lien">
          <Map size={22} aria-hidden="true" />
          <span>Quêtes</span>
        </Link>

        <Link href="/aventures" className="btn profil-acces-lien">
          <Compass size={22} aria-hidden="true" />
          <span>Aventures</span>
        </Link>

        <Link href="/combats" className="btn profil-acces-lien">
          <Swords size={22} aria-hidden="true" />
          <span>Combats</span>
        </Link>

        {role !== 'admin' && <Link
          href="/missives"
          className="btn profil-acces-lien"
          aria-label={nonLus.missives ? `Missives, ${nonLus.missives} non lue${nonLus.missives > 1 ? 's' : ''}` : undefined}
        >
          <Mail size={22} aria-hidden="true" />
          <span>Missives</span>
          {nonLus.missives > 0 && <span className="pastille" aria-hidden="true" />}
        </Link>}
      </div>

      {/* Déconnexion : bouton corail pleine largeur, tout en bas du profil */}
      <BoutonDeconnexion />
    </div>
  );
}