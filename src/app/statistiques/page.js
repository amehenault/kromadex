import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame, CalendarCheck, Heart, MessageCircle, Users, Trophy, Grid3x3, BookOpen, Sparkles, History, Lock, Compass, Swords, Dices } from 'lucide-react';
import { NOMS_AVENTURES } from '@/lib/activites';
import { abonnementDe, JOURS_STATS_GRATUIT } from '@/lib/abonnement';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';
import { listerMesTomes } from '@/lib/mesTomes';
import { typesVisibles } from '@/lib/typesColoriage';
import { accord } from '@/lib/genre';
import { FUSEAU, BONUS_SERIE, serieEnCours, meilleureSerie, aujourdhuiLocal, joursColories, joursConnectes } from '@/lib/series';

export const dynamic = 'force-dynamic';

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const nomMois = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

// Statistiques personnelles : séries, mois en cours, tomes, J'aime, résumé des participations, historique
export default async function StatistiquesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const uid = user.id;
  // Genre de la personne : « Inscrite », ou « Inscrit » pour le genre masculin
  const [{ genre } = {}] = await sql`SELECT genre FROM users WHERE id = ${uid}`;

  const aujourdhui = await aujourdhuiLocal();
  const debutMois = `${aujourdhui.slice(0, 7)}-01`;
  const [colories, connectes, [mois], tomesMois, tomesAvant, topLikes, [inter], defis, bingos, [bonus]] = await Promise.all([
    joursColories(uid),
    joursConnectes(uid),
    sql`SELECT count(*)::int AS coloriages FROM pages
        WHERE user_id = ${uid} AND (created_at AT TIME ZONE ${FUSEAU})::date >= ${debutMois}::date`,
    sql`SELECT min(tome) AS tome, count(*)::int AS n FROM pages
        WHERE user_id = ${uid} AND tome <> '' AND (created_at AT TIME ZONE ${FUSEAU})::date >= ${debutMois}::date
        GROUP BY lower(tome) ORDER BY n DESC, min(tome) LIMIT 3`,
    sql`SELECT min(tome) AS tome, count(*)::int AS n FROM pages
        WHERE user_id = ${uid} AND tome <> ''
          AND (created_at AT TIME ZONE ${FUSEAU})::date >= (${debutMois}::date - interval '1 month')
          AND (created_at AT TIME ZONE ${FUSEAU})::date < ${debutMois}::date
        GROUP BY lower(tome) ORDER BY n DESC, min(tome) LIMIT 3`,
    sql`SELECT p.id, p.title, OCTET_LENGTH(p.image_b64) AS img_size, count(l.user_id)::int AS likes
        FROM pages p JOIN page_likes l ON l.page_id = p.id
        WHERE p.user_id = ${uid} AND p.publiee GROUP BY p.id ORDER BY likes DESC, p.publiee_le DESC LIMIT 3`,
    sql`SELECT
          (SELECT count(*)::int FROM page_likes l JOIN pages p ON p.id = l.page_id WHERE p.user_id = ${uid}) AS likes_recus,
          (SELECT count(*)::int FROM page_likes WHERE user_id = ${uid}) AS likes_donnes,
          (SELECT count(*)::int FROM missive_commentaires WHERE user_id = ${uid}) AS commentaires,
          (SELECT count(*)::int FROM abonnements WHERE suivi = ${uid}) AS abonnes,
          (SELECT count(*)::int FROM pages WHERE user_id = ${uid} AND publiee) AS publies`,
    sql`SELECT d.id, d.titre, d.genre, (dp.page_id IS NOT NULL) AS envoye FROM defi_participations dp JOIN defis d ON d.id = dp.defi_id
        WHERE dp.user_id = ${uid}
          AND ((d.genre <> 'groupe' AND d.mois = ${debutMois}::date) OR (d.genre = 'groupe' AND d.fin >= ${aujourdhui}::date))
        ORDER BY d.genre, d.titre`,
    sql`SELECT b.id, b.titre, cardinality(b.cases) AS taille,
          (SELECT count(*)::int FROM bingo_cases c WHERE c.bingo_id = b.id AND c.user_id = ${uid}) AS cochees
        FROM bingos b
        WHERE COALESCE(b.debut, ${debutMois}::date) <= ${aujourdhui}::date
          AND COALESCE(b.fin, (${debutMois}::date + interval '1 month - 1 day')::date) >= ${aujourdhui}::date`,
    sql`SELECT COALESCE(sum(xp), 0)::int AS xp FROM xp_journal WHERE user_id = ${uid} AND cle LIKE 'serie-%'`,
  ]);

  // Historique : tous les mois pour Kromadex+, les 30 derniers jours pour la version gratuite
  const { plus } = await abonnementDe(uid);
  const historique = plus
    ? await sql`SELECT to_char(date_trunc('month', created_at AT TIME ZONE ${FUSEAU}), 'YYYY-MM-01') AS mois, count(*)::int AS n
        FROM pages WHERE user_id = ${uid} GROUP BY 1 ORDER BY 1 DESC`
    : null;
  const [recents] = plus ? [null] : await sql`SELECT count(*)::int AS n FROM pages
      WHERE user_id = ${uid} AND created_at > now() - make_interval(days => ${JOURS_STATS_GRATUIT})`;

  // Résumé de mes participations : aventures, combats et tournois en cours, derniers tirages de la Roue du Destin
  const [aventures, combats, tournois, tirages] = await Promise.all([
    sql`SELECT a.id, a.genre, a.titre,
          (SELECT count(*)::int FROM aventure_soumissions s WHERE s.aventure_id = a.id AND s.user_id = ${uid}) AS soumis
        FROM aventures a
        WHERE a.fin >= ${aujourdhui}::date AND a.debut <= ${aujourdhui}::date
          AND (EXISTS (SELECT 1 FROM aventure_inscriptions i WHERE i.aventure_id = a.id AND i.user_id = ${uid})
            OR EXISTS (SELECT 1 FROM aventure_soumissions s WHERE s.aventure_id = a.id AND s.user_id = ${uid}))
        ORDER BY a.fin`,
    sql`SELECT c.id, c.genre, c.theme, c.statut, (c.invite = ${uid} AND c.statut = 'invitation') AS invitation_recue,
          (SELECT p.page_id IS NOT NULL FROM combat_participants p WHERE p.combat_id = c.id AND p.user_id = ${uid}) AS soumis
        FROM combats c
        WHERE c.genre IN ('duel', 'joute') AND c.statut IN ('invitation', 'ouvert', 'soumission', 'verdict')
          AND (c.invite = ${uid} OR EXISTS (SELECT 1 FROM combat_participants p WHERE p.combat_id = c.id AND p.user_id = ${uid}))
        ORDER BY c.cree_le DESC`,
    sql`SELECT t.id, t.titre, t.statut, t.ronde FROM tournois t JOIN tournoi_inscrits i ON i.tournoi_id = t.id
        WHERE i.user_id = ${uid} AND t.statut IN ('inscriptions', 'en_cours') ORDER BY t.cree_le DESC`,
    sql`SELECT r.id, r.tome, r.page_no,
          EXISTS (SELECT 1 FROM pages p WHERE p.user_id = ${uid} AND lower(p.tome) = lower(r.tome) AND p.page_no = r.page_no) AS fait
        FROM roue_tirages r WHERE r.user_id = ${uid} ORDER BY r.tire_le DESC LIMIT 5`,
  ]);
  const etatCombat = (c) => c.invitation_recue ? 'Invitation à accepter'
    : c.statut === 'invitation' ? 'En attente de réponse'
    : c.statut === 'verdict' ? 'Verdict de l’Assemblée en cours'
    : c.soumis ? 'Coloriage envoyé' : 'Coloriage à envoyer';
  const rienEnCours = !defis.length && !bingos.length && !aventures.length && !combats.length && !tournois.length && !tirages.length;

  // Nombre de tomes (coloriage mystère) et de livres (Cozy colo), comme dans Collections > Ma collection
  const [profile, mesTomes] = await Promise.all([getUserProfile(uid), listerMesTomes(uid)]);
  const visibles = typesVisibles(profile?.types_pratiques, profile?.types_vus);
  const voitMystere = visibles.includes('mystere');
  const voitCozy = visibles.includes('cozy');
  const estLivre = (t) => t.type === 'cozy' || (t.type !== 'mystere' && voitCozy && !voitMystere);
  const nbLivres = mesTomes.filter(estLivre).length;
  const parType = [
    voitMystere && { cle: 'mystere', n: mesTomes.length - nbLivres, mot: 'Tome', type: 'Coloriage mystère' },
    voitCozy && { cle: 'cozy', n: nbLivres, mot: 'Livre', type: 'Cozy colo' },
  ].filter(Boolean);

  const serieColo = serieEnCours(colories, aujourdhui);
  const serieCo = serieEnCours(connectes, aujourdhui);
  const resteColo = 7 - (serieColo.longueur % 7);
  const resteCo = 7 - (serieCo.longueur % 7);

  // Calendrier du mois : cases vides avant le 1er (semaine commençant le lundi)
  const nbJours = new Date(Number(aujourdhui.slice(0, 4)), Number(aujourdhui.slice(5, 7)), 0).getDate();
  const decalage = (new Date(`${debutMois}T12:00:00`).getDay() + 6) % 7;
  const coloriesSet = new Set(colories);
  const joursMois = colories.filter((j) => j >= debutMois).length;

  const ligneResume = { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', minHeight: '44px' };
  const texteResume = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const carte = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' };
  const tuile = { background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', padding: '10px', minWidth: 0 };
  const grand = { fontSize: '1.4rem', fontWeight: 800, display: 'block' };
  const petit = { color: 'var(--texte-secondaire)', fontSize: '0.8rem' };
  const ligneTome = (t, i) => (
    <div key={t.tome} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.9rem' }}>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {t.tome}</span>
      <b style={{ flex: '0 0 auto' }}>{t.n} page{t.n > 1 ? 's' : ''}</b>
    </div>
  );

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Statistiques</h2>
      </div>

      {/* Séries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: 'var(--espace-3)' }}>
        <div style={tuile}>
          <Flame size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} />
          <span style={grand}>{serieColo.longueur} j</span>
          <b style={{ fontSize: '0.85rem' }}>Série de coloriage</b>
          <small style={{ ...petit, display: 'block' }}>+{BONUS_SERIE.coloriage} XP dans {resteColo} jour{resteColo > 1 ? 's' : ''}</small>
          <small style={{ ...petit, display: 'block' }}>Record : {meilleureSerie(colories)} j</small>
        </div>
        <div style={tuile}>
          <CalendarCheck size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} />
          <span style={grand}>{serieCo.longueur} j</span>
          <b style={{ fontSize: '0.85rem' }}>Série de connexion</b>
          <small style={{ ...petit, display: 'block' }}>+{BONUS_SERIE.connexion} XP dans {resteCo} jour{resteCo > 1 ? 's' : ''}</small>
          <small style={{ ...petit, display: 'block' }}>Record : {meilleureSerie(connectes)} j</small>
        </div>
      </div>
      {bonus.xp > 0 && (
        <p style={{ ...petit, margin: '-4px 0 var(--espace-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} aria-hidden="true" /> {bonus.xp} XP gagnés grâce à tes séries
        </p>
      )}

      {/* Tomes et livres par type de coloriage */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${parType.length}, minmax(0, 1fr))`, gap: '8px', marginBottom: 'var(--espace-3)' }}>
        {parType.map((t) => (
          <Link key={t.cle} href="/profil/progression" style={{ ...tuile, textDecoration: 'none', color: 'inherit' }}>
            <BookOpen size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} />
            <span style={grand}>{t.n}</span>
            <b style={{ fontSize: '0.85rem' }}>{t.mot}{t.n > 1 ? 's' : ''}</b>
            <small style={{ ...petit, display: 'block' }}>{t.type}</small>
          </Link>
        ))}
      </div>

      {/* Mois en cours */}
      <div className="carte" style={carte}>
        <b style={{ textTransform: 'capitalize' }}>{nomMois(debutMois)}</b>
        <small style={petit}>{mois.coloriages} coloriage{mois.coloriages > 1 ? 's' : ''} sur {joursMois} jour{joursMois > 1 ? 's' : ''}</small>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '4px' }}>
          {JOURS.map((j, i) => <small key={i} style={{ ...petit, textAlign: 'center', fontWeight: 700 }}>{j}</small>)}
          {Array.from({ length: decalage }, (_, i) => <span key={`v${i}`} />)}
          {Array.from({ length: nbJours }, (_, i) => {
            const iso = `${debutMois.slice(0, 8)}${String(i + 1).padStart(2, '0')}`;
            const fait = coloriesSet.has(iso);
            return (
              <span key={iso} title={fait ? 'Journée coloriée' : undefined} style={{
                aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: iso === aujourdhui ? 800 : 400,
                background: fait ? 'var(--btn)' : 'var(--fond-carte)', color: fait ? '#ffffff' : 'var(--texte-secondaire)',
                border: iso === aujourdhui ? '2px solid var(--texte-principal)' : '1px solid var(--bordure-carte)',
              }}>{i + 1}</span>
            );
          })}
        </div>
      </div>

      {/* Tomes les plus utilisés */}
      <div className="carte" style={carte}>
        <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={18} aria-hidden="true" /> Tomes les plus utilisés</b>
        <small style={{ ...petit, fontWeight: 700 }}>Ce mois-ci</small>
        {tomesMois.length ? tomesMois.map(ligneTome) : <small style={petit}>Aucun coloriage ce mois-ci.</small>}
        <small style={{ ...petit, fontWeight: 700, marginTop: '4px' }}>Le mois dernier</small>
        {tomesAvant.length ? tomesAvant.map(ligneTome) : <small style={petit}>Aucun coloriage le mois dernier.</small>}
      </div>

      {/* Interactions */}
      <div className="carte" style={carte}>
        <b>Interactions</b>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          {[
            [Heart, inter.likes_recus, "J'aime reçus"],
            [Heart, inter.likes_donnes, "J'aime donnés"],
            [Users, inter.abonnes, 'Abonnés'],
            [MessageCircle, inter.commentaires, 'Commentaires'],
          ].map(([Icone, n, label]) => (
            <div key={label} style={tuile}>
              <Icone size={16} aria-hidden="true" style={{ color: 'var(--btn)' }} />
              <span style={{ ...grand, fontSize: '1.2rem' }}>{n}</span>
              <small style={petit}>{label}</small>
            </div>
          ))}
        </div>
      </div>

      {/* Coloriages les plus aimés */}
      <div className="carte" style={carte}>
        <b>Mes coloriages les plus aimés</b>
        {!topLikes.length && <small style={petit}>Publie tes coloriages dans la Communauté pour recevoir des J'aime.</small>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
          {topLikes.map((p) => (
            <Link key={p.id} href={`/pages/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
              <span style={{ display: 'block', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
                {p.img_size ? <img src={`/api/pages/${p.id}/image?s=${p.img_size}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </span>
              <small style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <Heart size={12} aria-hidden="true" /> {p.likes}
              </small>
            </Link>
          ))}
        </div>
      </div>

      {/* Résumé de mes participations : épreuves, bingos, aventures, combats et Roue du Destin */}
      <div className="carte" style={carte}>
        <b>Résumé de mes participations</b>
        <small style={petit}>Tout ce que tu as en cours, au même endroit : touche une ligne pour y aller.</small>
        {rienEnCours && <small style={petit}>Rien en cours pour l’instant. Lance-toi dans une épreuve, un bingo, une aventure, un combat ou fais tourner la Roue du Destin !</small>}
        {defis.map((d) => (
          <Link key={d.id} href="/defis" style={ligneResume}>
            <Trophy size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>Épreuve · {d.titre}</span>
            <small style={petit}>{d.envoye ? 'Coloriage envoyé' : 'Coloriage à envoyer'}</small>
          </Link>
        ))}
        {bingos.map((b) => (
          <Link key={b.id} href="/defis" style={ligneResume}>
            <Grid3x3 size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>Bingo · {b.titre.replace(/^bingo\s*[:·-]?\s*/i, '') || b.titre}</span>
            <small style={petit}>{b.cochees} / {b.taille || 9} cases remplies</small>
          </Link>
        ))}
        {aventures.map((a) => (
          <Link key={`a${a.id}`} href={`/aventures/${a.id}`} style={ligneResume}>
            <Compass size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>{NOMS_AVENTURES[a.genre]?.singulier} · {a.titre}</span>
            <small style={petit}>{a.soumis ? `${a.soumis} coloriage${a.soumis > 1 ? 's' : ''} soumis` : accord(genre, 'Inscrite', 'Inscrit')}</small>
          </Link>
        ))}
        {combats.map((c) => (
          <Link key={`c${c.id}`} href="/combats" style={ligneResume}>
            <Swords size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>{c.genre === 'duel' ? 'Duel' : 'Joute'} · {c.theme}</span>
            <small style={petit}>{etatCombat(c)}</small>
          </Link>
        ))}
        {tournois.map((t) => (
          <Link key={`t${t.id}`} href="/combats" style={ligneResume}>
            <Trophy size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>Tournoi · {t.titre}</span>
            <small style={petit}>{t.statut === 'inscriptions' ? 'Inscriptions en cours' : `Ronde ${t.ronde}`}</small>
          </Link>
        ))}
        {tirages.map((r) => (
          <Link key={`r${r.id}`} href={r.fait ? '/coloriages' : `/pages/new?tome=${encodeURIComponent(r.tome)}&page=${r.page_no}`} style={ligneResume}>
            <Dices size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={texteResume}>Roue du Destin · {r.tome}, page {r.page_no}</span>
            <small style={petit}>{r.fait ? 'Coloriée' : 'À colorier'}</small>
          </Link>
        ))}
      </div>

      {/* Historique des coloriages */}
      <div className="carte" style={carte}>
        <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><History size={18} aria-hidden="true" /> Mon historique</b>
        {plus ? (
          historique.length ? historique.map((h) => (
            <div key={h.mois} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.9rem' }}>
              <span style={{ textTransform: 'capitalize' }}>{nomMois(h.mois)}</span>
              <b>{h.n} coloriage{h.n > 1 ? 's' : ''}</b>
            </div>
          )) : <small style={petit}>Aucun coloriage pour l’instant.</small>
        ) : (
          <>
            <span style={{ fontSize: '0.9rem' }}>{recents.n} coloriage{recents.n > 1 ? 's' : ''} ces {JOURS_STATS_GRATUIT} derniers jours</span>
            <Link href="/kromadex-plus" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', fontWeight: 700, color: 'inherit', fontSize: '0.9rem' }}>
              <Lock size={16} aria-hidden="true" /> Tout ton historique, mois par mois, avec Kromadex+
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
